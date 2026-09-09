import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

export const initializePaymentBodySchema = z
  .object({
    orderId: objectIdSchema,
  })
  .strict();

/** Paystack reference is currently the order ObjectId. */
export const verifyPaymentQuerySchema = z.object({
  reference: objectIdSchema,
});

export type InitializePaymentBody = z.infer<typeof initializePaymentBodySchema>;
export type VerifyPaymentQuery = z.infer<typeof verifyPaymentQuerySchema>;
