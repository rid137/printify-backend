import mongoose, { Document } from "mongoose";

export interface TransactionDoc extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  reference: string;
  amount: number;
  status: string;
  currency: string;
  email: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionFilterQuery {
  page?: string;
  size?: string;
  transactionId?: string;
  status?: string;
  from?: string;
  to?: string;
}