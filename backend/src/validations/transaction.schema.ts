import { z } from "zod";
import {
  listPaginationQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.schema.js";
import { TRANSACTION_STATUSES } from "../types/transaction.types.js";

export const transactionStatusSchema = z.enum(TRANSACTION_STATUSES);

export const transactionFilterQuerySchema = paginationQuerySchema
  .extend({
    transactionId: objectIdSchema.optional(),
    status: transactionStatusSchema.optional(),
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to) {
      const startDate = new Date(data.from);
      const endDate = new Date(data.to);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid date format",
          path: ["from"],
        });
      }
    }
  });

export const userTransactionsQuerySchema = listPaginationQuerySchema;

export type TransactionFilterQueryInput = z.infer<
  typeof transactionFilterQuerySchema
>;
export type UserTransactionsQuery = z.infer<typeof userTransactionsQuerySchema>;
