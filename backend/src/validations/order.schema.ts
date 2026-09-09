import { z } from "zod";
import { ORDER_STATUSES } from "../types/order.types.js";
import {
  pageCountSchema,
  paginationQuerySchema,
  quantitySchema,
  userOrdersPaginationQuerySchema,
} from "./common.schema.js";
import { printingOptionsSchema } from "./printing-options.schema.js";
import { MAX_ORDER_ITEMS } from "../utils/limits.js";

/** Single-line public/landing calculator (Phase 6) — client pages are a quote only. */
export const calculatePriceBodySchema = z.object({
  printingOptions: printingOptionsSchema,
  quantity: quantitySchema,
  pages: pageCountSchema,
});

const requirePublicId = (
  file: { publicId?: string; public_id?: string },
  ctx: z.RefinementCtx
) => {
  if (!file.publicId && !file.public_id) {
    ctx.addIssue({
      code: "custom",
      message: "File publicId is required.",
      path: ["publicId"],
    });
  }
};

/**
 * Client page counts are ignored (stripped if sent). Pricing uses the
 * Cloudinary page count after ownership verification.
 */
const orderItemFileInputSchema = z
  .object({
    url: z.string().trim().min(1).optional(),
    fileName: z.string().trim().min(1, "File name is required."),
    publicId: z.string().trim().min(1).optional(),
    public_id: z.string().trim().min(1).optional(),
    mimeType: z.string().trim().min(1).optional(),
    size: z.number().finite().nonnegative().optional(),
    format: z.enum(["pdf", "docx", "pptx"]).optional(),
  })
  .superRefine(requirePublicId);

const uploadedFileRefSchema = z
  .object({
    publicId: z.string().trim().min(1).optional(),
    public_id: z.string().trim().min(1).optional(),
  })
  .superRefine(requirePublicId);

/**
 * Client may only send file + options + quantity.
 * Pricing fields are rejected via .strict().
 */
export const orderItemInputSchema = z
  .object({
    file: orderItemFileInputSchema,
    printingOptions: printingOptionsSchema,
    quantity: quantitySchema,
  })
  .strict();

export const createOrderBodySchema = z
  .object({
    items: z
      .array(orderItemInputSchema)
      .min(1, "Order must contain at least one item")
      .max(MAX_ORDER_ITEMS, `Order cannot contain more than ${MAX_ORDER_ITEMS} items`),
  })
  .strict();

/** Multi-item cart/order price preview (authenticated). */
export const calculateMultiItemPriceBodySchema = z
  .object({
    items: z
      .array(
        z
          .object({
            file: uploadedFileRefSchema,
            printingOptions: printingOptionsSchema,
            quantity: quantitySchema,
          })
          .strict()
      )
      .min(1, "At least one item is required")
      .max(MAX_ORDER_ITEMS, `At most ${MAX_ORDER_ITEMS} items are allowed`),
  })
  .strict();

export type CalculatePriceBody = z.infer<typeof calculatePriceBodySchema>;
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type CalculateMultiItemPriceBody = z.infer<
  typeof calculateMultiItemPriceBodySchema
>;
export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const adminTargetStatusSchema = z.enum([
  "received",
  "processing",
  "completed",
  "delivered",
]);

export const updateOrderStatusBodySchema = z
  .object({
    status: adminTargetStatusSchema,
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export const cancelOrderBodySchema = z.preprocess(
  (value) => value ?? {},
  z
    .object({
      note: z.string().trim().max(500).optional(),
    })
    .strict()
);

export const adminOrdersQuerySchema = paginationQuerySchema.extend({
  status: orderStatusSchema.optional(),
});

export const userOrdersQuerySchema = userOrdersPaginationQuerySchema.extend({
  status: orderStatusSchema.optional(),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;
export type CancelOrderBody = z.infer<typeof cancelOrderBodySchema>;
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type UserOrdersQuery = z.infer<typeof userOrdersQuerySchema>;
