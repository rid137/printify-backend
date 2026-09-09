import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import { Forbidden, NotFound } from "../utils/error/httpErrors.js";
import { isResourceOwner } from "../utils/ownership.js";
import type { TransactionFilterQueryInput } from "../validations/transaction.schema.js";

export class TransactionService {
  static async removeById(transactionId: string) {
    const transaction = await Transaction.findByIdAndDelete(transactionId);
    if (!transaction) {
      throw NotFound("Transaction not found");
    }
    return transaction;
  }

  static async readByIdForUser(transactionId: string, userId: unknown) {
    const transaction = await Transaction.findById(transactionId).populate(
      "user",
      "username email"
    );

    if (!transaction) {
      throw NotFound("Transaction not found");
    }

    if (!isResourceOwner(transaction.user, userId)) {
      throw Forbidden("You do not have access to this transaction");
    }

    return transaction;
  }

  static async list(filters: TransactionFilterQueryInput) {
    const { page, size, transactionId, status, from, to } = filters;

    const filter: Record<string, unknown> = {};

    if (transactionId) {
      filter._id = new mongoose.Types.ObjectId(transactionId);
    }

    if (status) {
      filter.status = status;
    }

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const [totalDocuments, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate("user", "username email")
        .limit(size)
        .skip((page - 1) * size)
        .sort({ createdAt: -1 }),
    ]);

    return {
      transactions,
      meta: {
        currentPage: page,
        perPage: size,
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / size),
      },
    };
  }

  static async getForUser(
    userId: unknown,
    pagination: { page: number; size: number }
  ) {
    const { page, size } = pagination;
    const filter = { user: userId };

    const [totalDocuments, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .populate("user", "username email"),
    ]);

    return {
      transactions,
      meta: {
        currentPage: page,
        perPage: size,
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / size) || 0,
      },
    };
  }
}
