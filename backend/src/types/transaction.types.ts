import mongoose, { Document } from "mongoose";

export const TRANSACTION_STATUSES = ["pending", "success"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface TransactionDoc extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  reference: string;
  amount: number;
  status: TransactionStatus;
  currency: string;
  email: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
