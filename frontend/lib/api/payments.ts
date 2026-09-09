import { apiRequest } from "./client";
import type { Order, Paginated, PaymentInit, Transaction, TransactionStatus } from "./types";

export const paymentsApi = {
  initialize: (orderId: string) =>
    apiRequest<PaymentInit>("/api/payment/initialize", {
      method: "POST",
      body: { orderId },
    }),

  verify: (reference: string) =>
    apiRequest<{ order: Order }>("/api/payment/verify", { query: { reference } }),
};

export const transactionsApi = {
  listMine: (query: { page?: number; size?: number }) =>
    apiRequest<Paginated<Transaction>>("/api/user/transactions/own", { query }),

  getMine: (id: string) => apiRequest<Transaction>(`/api/user/transactions/${id}`),

  adminList: (query: {
    page?: number;
    size?: number;
    status?: TransactionStatus;
    transactionId?: string;
    from?: string;
    to?: string;
  }) => apiRequest<Paginated<Transaction>>("/api/admin/transactions", { query }),

  adminRemove: (id: string) =>
    apiRequest<Transaction>(`/api/admin/transactions/${id}`, { method: "DELETE" }),
};
