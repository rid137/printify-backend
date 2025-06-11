import Transaction from "../models/transaction.model.js";
import asyncHandler from "../middlewares/async-handler.middleware.js";
import mongoose from "mongoose";
import { successResponse, paginatedResponse } from "../utils/apiResponse.js";
import { BadRequest, NotFound } from "../utils/error/httpErrors.js";
import { TransactionFilterQuery } from "../types/transaction.types.js";

const removeTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);
  if (!transaction) {
    throw NotFound("Transaction not found");
  }
  successResponse(res, transaction, "Transaction removed successfully");
});

const readTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("user", "username email");
  
  if (!transaction) {
    throw NotFound("Transaction not found");
  }
  successResponse(res, transaction, "Transaction retrieved successfully");
});

const listTransaction = asyncHandler(async (req, res) => {
  const {
    page = "1",
    size = "10",
    transactionId,
    status,
    from,
    to
  } = req.query as TransactionFilterQuery;

  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);

  // Build filter object
  const filter: Record<string, any> = {};

  // Transaction ID filter
  if (transactionId) {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw BadRequest("Invalid transaction ID format");
    }
    filter._id = new mongoose.Types.ObjectId(transactionId);
  }

  // Status filter (case-insensitive)
  if (status?.trim()) {
    filter.status = { $regex: status.trim(), $options: "i" };
  }

  // Date range filter
  if (from && to) {
    const startDate = new Date(from);
    const endDate = new Date(to);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw BadRequest("Invalid date format");
    }
    
    filter.createdAt = { $gte: startDate, $lte: endDate };
  }

  // Get total count and paginated results
  const [totalDocuments, transactions] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter)
      .populate("user", "username email")
      .limit(sizeNum)
      .skip((pageNum - 1) * sizeNum)
      .sort({ createdAt: -1 })
  ]);

  paginatedResponse(res, transactions, {
    currentPage: pageNum,
    perPage: sizeNum,
    totalDocuments,
    totalPages: Math.ceil(totalDocuments / sizeNum),
  }, "Transactions retrieved successfully");
});

const getUserTransaction = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username email");

  successResponse(res, transactions, "User transactions retrieved successfully");
});

export {
  removeTransaction,
  listTransaction,
  readTransaction,
  getUserTransaction
};