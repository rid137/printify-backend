import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { MAX_PAGE_COUNT, MAX_QUANTITY } from "../utils/limits.js";

/** MongoDB ObjectId string validated with mongoose.isValidObjectId. */
export const objectIdSchema = z
  .string()
  .trim()
  .min(1, "ID is required")
  .refine((value) => isValidObjectId(value), {
    message: "Invalid ID format",
  });

export const objectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address")
  .transform((value) => value.toLowerCase());

/** Matches User model minlength: 6 */
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required");

/** Six-digit OTP codes used across auth flows. */
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP code must be a 6-digit number");

export const positiveIntSchema = z.coerce
  .number({ error: "Must be a number" })
  .int("Must be an integer")
  .min(1, "Must be greater than or equal to one");

/** Print quantity on public quotes and authenticated order lines. */
export const quantitySchema = positiveIntSchema.max(
  MAX_QUANTITY,
  `Quantity must be at most ${MAX_QUANTITY}`
);

/** Page counts: public quotes and trusted Cloudinary values. */
export const pageCountSchema = positiveIntSchema.max(
  MAX_PAGE_COUNT,
  `Page count must be at most ${MAX_PAGE_COUNT}`
);

/**
 * Shared pagination query. Defaults match most list endpoints (page=1, size=10).
 * Use userOrdersPaginationQuerySchema when the existing default page size is 20.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
});

export const userOrdersPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});

/** Default page size 20 (admin all-users, user own-transactions). */
export const listPaginationQuerySchema = userOrdersPaginationQuerySchema;

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type ObjectIdParam = z.infer<typeof objectIdParamSchema>;
