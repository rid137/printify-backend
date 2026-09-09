import asyncHandler from "../middlewares/async-handler.middleware.js";
import { successResponse, paginatedResponse } from "../utils/apiResponse.js";
import { TransactionService } from "../services/transaction.service.js";
import type {
  TransactionFilterQueryInput,
  UserTransactionsQuery,
} from "../validations/transaction.schema.js";

const removeTransaction = asyncHandler(async (req, res) => {
  const transaction = await TransactionService.removeById(req.params.id);
  successResponse(res, transaction, "Transaction removed successfully");
});

const readTransaction = asyncHandler(async (req, res) => {
  const transaction = await TransactionService.readByIdForUser(
    req.params.id,
    req.user._id
  );
  successResponse(res, transaction, "Transaction retrieved successfully");
});

const listTransaction = asyncHandler(async (req, res) => {
  const { transactions, meta } = await TransactionService.list(
    req.query as unknown as TransactionFilterQueryInput
  );
  paginatedResponse(
    res,
    transactions,
    meta,
    "Transactions retrieved successfully"
  );
});

const getUserTransaction = asyncHandler(async (req, res) => {
  const { page, size } = req.query as unknown as UserTransactionsQuery;
  const { transactions, meta } = await TransactionService.getForUser(
    req.user._id,
    { page, size }
  );
  paginatedResponse(
    res,
    transactions,
    meta,
    "User transactions retrieved successfully"
  );
});

export {
  removeTransaction,
  listTransaction,
  readTransaction,
  getUserTransaction,
};
