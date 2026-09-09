import type { IOrder, OrderItem, PrintingOptions } from "../types/order.types.js";
import { DEFAULT_PRICING_RULES } from "../types/pricing.types.js";
import { calculatePriceFromRules } from "../services/pricing.service.js";
import { inferOrderStatus } from "./order-status.js";

/**
 * Normalize an order document for API responses.
 * Legacy single-file orders (pre Phase 7) are presented as a one-item `items` array
 * without mutating the database.
 */
export const normalizeOrderForResponse = (order: IOrder) => {
  const plain =
    typeof order.toObject === "function"
      ? order.toObject({ virtuals: true })
      : ({ ...(order as unknown as object) } as Record<string, any>);

  const items = Array.isArray(plain.items) ? plain.items : [];
  const status = inferOrderStatus(plain);
  const statusHistory = Array.isArray(plain.statusHistory)
    ? plain.statusHistory
    : [];

  const withStatus = {
    status,
    statusHistory,
    isDelivered: status === "delivered",
    deliveredAt:
      status === "delivered" ? plain.deliveredAt || plain.updatedAt : undefined,
  };

  if (items.length > 0) {
    return {
      ...plain,
      ...withStatus,
      currency: plain.currency || "NGN",
      itemsSubtotal:
        plain.itemsSubtotal ??
        items.reduce(
          (sum: number, item: OrderItem) => sum + (item.subtotal || 0),
          0
        ),
    };
  }

  if (plain.file?.url && plain.printingOptions && plain.quantity) {
    const pages = plain.file.pages as number;
    const quantity = plain.quantity as number;
    const calc = calculatePriceFromRules(
      plain.printingOptions as PrintingOptions,
      quantity,
      pages,
      DEFAULT_PRICING_RULES,
      0
    );

    const legacyItem: OrderItem = {
      file: {
        url: plain.file.url,
        publicId: "legacy",
        fileName: plain.file.fileName,
        pages,
      },
      printingOptions: plain.printingOptions,
      quantity,
      unitPrice: calc.pricePerUnit,
      subtotal: plain.totalPrice ?? calc.total,
      pricingSnapshot: {
        rulesVersion: 0,
        rules: calc.rulesSnapshot,
        breakdown: calc.breakdown,
      },
    };

    return {
      ...plain,
      ...withStatus,
      items: [legacyItem],
      itemsSubtotal: plain.totalPrice ?? calc.total,
      currency: plain.currency || "NGN",
      _legacyShape: true,
    };
  }

  return {
    ...plain,
    ...withStatus,
    items: [],
    itemsSubtotal: plain.itemsSubtotal ?? plain.totalPrice ?? 0,
    currency: plain.currency || "NGN",
  };
};
