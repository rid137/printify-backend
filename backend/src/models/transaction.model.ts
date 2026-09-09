import mongoose, { Schema } from "mongoose";
import {
  TransactionDoc,
  TRANSACTION_STATUSES,
} from "../types/transaction.types.js";

const transactionSchema = new Schema<TransactionDoc>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
      unique: true,
    },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: [...TRANSACTION_STATUSES],
    },
    currency: { type: String, default: "NGN" },
    email: { type: String, required: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

const Transaction = mongoose.model<TransactionDoc>("Transaction", transactionSchema);
export default Transaction;
