import mongoose from "mongoose";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import {
  PricingService,
  calculatePriceFromRules,
} from "./pricing.service.js";
import { NotificationService } from "./notification.service.js";
import { EmailService } from "./email.service.js";
import {
  BadRequest,
  Conflict,
  Forbidden,
  NotFound,
} from "../utils/error/httpErrors.js";
import { getErrorMessage } from "../utils/error/getErrorMessage.js";
import { UploadService } from "./upload.service.js";
import { MAX_PAGE_COUNT } from "../utils/limits.js";
import { isResourceOwner } from "../utils/ownership.js";
import { normalizeOrderForResponse } from "../utils/order-normalize.js";
import { basename as pathBasename } from "path";
import {
  canTransition,
  deliveryFieldsForStatus,
  inferOrderStatus,
  ORDER_STATUS_LABELS,
  statusQueryFilter,
  statusTransitionFilter,
} from "../utils/order-status.js";
import type { PaginationQuery } from "../validations/common.schema.js";
import type {
  CalculateMultiItemPriceBody,
  CreateOrderBody,
} from "../validations/order.schema.js";
import type {
  IOrder,
  OrderItem,
  OrderStatus,
  StatusHistoryEntry,
} from "../types/order.types.js";

const FCM_ICON =
  "https://res.cloudinary.com/dnkhxafkz/image/upload/v1730950976/jcqwmzekkoejemeypfwc.png";

const NO_TRUSTED_PAGE_COUNT =
  "A trusted page count is not available for this file. PDF uploads are priced from Cloudinary page counts; DOCX and PPTX cannot be priced until a server page count exists.";

const inferStoredFormat = (
  cloudinaryFormat: string | undefined,
  fallback?: "pdf" | "docx" | "pptx"
): "pdf" | "docx" | "pptx" | undefined => {
  const format = (cloudinaryFormat || "").toLowerCase();
  if (format === "pdf" || format === "docx" || format === "pptx") {
    return format;
  }
  return fallback;
};

const displayFileName = (fileName: string | undefined): string => {
  if (!fileName) {
    return "document";
  }
  return pathBasename(fileName.replace(/\\/g, "/")) || "document";
};

const ownerIdOf = (order: IOrder): unknown => {
  const user = order.user as unknown;
  if (user && typeof user === "object" && "_id" in user) {
    return (user as { _id: unknown })._id;
  }
  return user;
};

const historyEntry = (
  status: OrderStatus,
  at: Date,
  actorId?: unknown,
  note?: string
): StatusHistoryEntry => ({
  status,
  at,
  ...(actorId
    ? { by: new mongoose.Types.ObjectId(String(actorId)) }
    : {}),
  ...(note ? { note } : {}),
});

export class OrderService {
  /**
   * Multi-item cart calculation. Uses one active PricingConfig for all lines
   * so rulesVersion is consistent within the preview.
   */
  static async calculateMultiItemPrice(
    userId: unknown,
    input: CalculateMultiItemPriceBody
  ) {
    const { rules, version } = await PricingService.getActiveRules();

    const pricedItems = await Promise.all(
      input.items.map(async (item) => {
        const trusted = await resolveTrustedOrderFile(userId, item.file);
        const calc = calculatePriceFromRules(
          item.printingOptions,
          item.quantity,
          trusted.pages,
          rules,
          version
        );

        return {
          pages: trusted.pages,
          quantity: item.quantity,
          printingOptions: item.printingOptions,
          unitPrice: calc.pricePerUnit,
          subtotal: calc.total,
          totalPages: calc.totalPages,
          breakdown: calc.breakdown,
          rulesVersion: calc.rulesVersion,
        };
      })
    );

    const itemsSubtotal = pricedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    return {
      currency: "NGN",
      items: pricedItems,
      itemsSubtotal,
      total: itemsSubtotal,
      totalPrice: itemsSubtotal,
      rulesVersion: version,
    };
  }

  static async createOrder(userId: unknown, input: CreateOrderBody) {
    const { rules, version } = await PricingService.getActiveRules();

    const items: OrderItem[] = await Promise.all(
      input.items.map(async (item) => {
        const file = await resolveTrustedOrderFile(userId, item.file);
        const calc = calculatePriceFromRules(
          item.printingOptions,
          item.quantity,
          file.pages,
          rules,
          version
        );

        return {
          file,
          printingOptions: item.printingOptions,
          quantity: item.quantity,
          unitPrice: calc.pricePerUnit,
          subtotal: calc.total,
          pricingSnapshot: {
            rulesVersion: calc.rulesVersion,
            rules: calc.rulesSnapshot,
            breakdown: calc.breakdown,
          },
        };
      })
    );

    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const createdAt = new Date();

    const order = new Order({
      user: userId as string,
      items,
      itemsSubtotal,
      totalPrice: itemsSubtotal,
      currency: "NGN",
      status: "pending",
      statusHistory: [historyEntry("pending", createdAt, userId)],
      isPaid: false,
      isDelivered: false,
    });

    const saved = await order.save();
    return normalizeOrderForResponse(saved);
  }

  static async getAllOrders(
    pagination: PaginationQuery & { status?: OrderStatus }
  ) {
    const { page, size: perPage, status } = pagination;
    const filter = status ? statusQueryFilter(status) : {};

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders.map((order) => normalizeOrderForResponse(order)),
      meta: {
        currentPage: page,
        perPage,
        totalDocuments: total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  static async getUserOrders(
    userId: unknown,
    pagination: PaginationQuery & { status?: OrderStatus }
  ) {
    const { page, size: perPage, status } = pagination;
    const filter = {
      user: userId,
      ...(status ? statusQueryFilter(status) : {}),
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders.map((order) => normalizeOrderForResponse(order)),
      meta: {
        currentPage: page,
        perPage,
        totalDocuments: total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  static async countTotalOrders() {
    const totalOrders = await Order.countDocuments();
    return { totalOrders };
  }

  static async findOrderByIdForUser(orderId: string, userId: unknown) {
    const order = await Order.findById(orderId)
      .populate("user", "username email")
      .populate("statusHistory.by", "username");

    if (!order) {
      throw NotFound("Order not found");
    }

    if (!isResourceOwner(order.user, userId)) {
      throw Forbidden("You do not have access to this order");
    }

    return normalizeOrderForResponse(order);
  }

  static async findOrderByIdForAdmin(orderId: string) {
    const order = await Order.findById(orderId)
      .populate("user", "username email")
      .populate("statusHistory.by", "username");

    if (!order) {
      throw NotFound("Order not found");
    }

    return normalizeOrderForResponse(order);
  }

  /**
   * Forward-only status transition. No-ops are rejected.
   * `isDelivered` is kept in sync when status becomes delivered.
   * The write is atomic on `{ _id, status: from }` so a stale concurrent
   * transition cannot skip the machine.
   */
  static async transitionStatus(
    orderId: string,
    to: OrderStatus,
    actorId: unknown,
    options?: { note?: string; actor?: "admin" | "user" }
  ) {
    const actor = options?.actor ?? "admin";
    const order = await Order.findById(orderId);

    if (!order) {
      throw NotFound("Order not found");
    }

    const from = inferOrderStatus(order);
    const check = canTransition(from, to, {
      actor,
      isPaid: Boolean(order.isPaid),
    });

    if (!check.ok) {
      throw BadRequest(check.reason);
    }

    const at = new Date();
    const delivery = deliveryFieldsForStatus(to, at);

    const $set: Record<string, unknown> = {
      status: to,
      isDelivered: delivery.isDelivered,
    };
    if (delivery.deliveredAt) {
      $set.deliveredAt = delivery.deliveredAt;
    }

    const updated = await Order.findOneAndUpdate(
      statusTransitionFilter(order._id, from, to),
      {
        $set,
        $push: {
          statusHistory: historyEntry(to, at, actorId, options?.note),
        },
      },
      { new: true, runValidators: true }
    )
      .populate("user", "username email")
      .populate("statusHistory.by", "username");

    if (!updated) {
      const fresh = await Order.findById(orderId);
      if (!fresh) {
        throw NotFound("Order not found");
      }
      throw Conflict(
        "Order status was updated by another request. Please retry."
      );
    }

    void this.notifyStatusChange(updated, to);

    return normalizeOrderForResponse(updated);
  }

  static async cancelOrder(
    orderId: string,
    userId: unknown,
    note?: string
  ) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw NotFound("Order not found");
    }

    if (!isResourceOwner(order.user, userId)) {
      throw Forbidden("You do not have access to this order");
    }

    return this.transitionStatus(orderId, "cancelled", userId, {
      actor: "user",
      note,
    });
  }

  static async markOrderAsDelivered(orderId: string, actorId: unknown) {
    return this.transitionStatus(orderId, "delivered", actorId, {
      actor: "admin",
    });
  }

  static async calculateTotalSales() {
    const [result] = await Order.aggregate<{ totalSales: number }>([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
    ]);
    return { totalSales: result?.totalSales ?? 0 };
  }

  private static async notifyStatusChange(order: IOrder, status: OrderStatus) {
    const userId = ownerIdOf(order);
    const label = ORDER_STATUS_LABELS[status];
    const orderId = String(order._id);
    const title = "Order update";
    const body = `Your order is now ${label.toLowerCase()}.`;

    try {
      await NotificationService.sendToUser(String(userId), {
        title,
        body,
        icon: FCM_ICON,
        badge: FCM_ICON,
        data: { orderId, status },
      });
    } catch (error) {
      console.warn(
        `[order.status] FCM notify failed for order ${orderId}:`,
        getErrorMessage(error)
      );
    }

    try {
      const user = await User.findById(userId).select("email username");
      if (user?.email) {
        await EmailService.sendOrderStatusEmail(
          user.email,
          user.username,
          orderId,
          status,
          label
        );
      }
    } catch (error) {
      console.warn(
        `[order.status] Email notify failed for order ${orderId}:`,
        getErrorMessage(error)
      );
    }
  }
}

type FileRef = {
  publicId?: string;
  public_id?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  format?: "pdf" | "docx" | "pptx";
};

const resolveTrustedOrderFile = async (
  userId: unknown,
  file: FileRef
): Promise<OrderItem["file"]> => {
  const publicId = file.publicId || file.public_id;
  if (!publicId) {
    throw BadRequest("File publicId is required.");
  }

  const asset = await UploadService.getTrustedResource(userId, publicId);

  if (asset.pages == null) {
    throw BadRequest(NO_TRUSTED_PAGE_COUNT);
  }

  if (asset.pages > MAX_PAGE_COUNT) {
    throw BadRequest(`Page count must be at most ${MAX_PAGE_COUNT}`);
  }

  return {
    url: asset.url,
    publicId: asset.publicId,
    fileName: displayFileName(file.fileName),
    pages: asset.pages,
    mimeType: file.mimeType,
    size: asset.bytes ?? file.size,
    format: inferStoredFormat(asset.format, file.format),
  };
};
