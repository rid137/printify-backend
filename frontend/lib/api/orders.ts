import { apiRequest } from "./client";
import type { Order, OrderStatus, Paginated, PrintingOptions } from "./types";

export type CreateOrderItem = {
  file: {
    publicId: string;
    fileName: string;
    mimeType?: string;
    format?: "pdf" | "docx" | "pptx";
  };
  printingOptions: PrintingOptions;
  quantity: number;
};

export const ordersApi = {
  listMine: (query: { page?: number; size?: number; status?: OrderStatus }) =>
    apiRequest<Paginated<Order>>("/api/user/orders", { query }),

  getMine: (id: string) => apiRequest<Order>(`/api/user/orders/${id}`),

  create: (items: CreateOrderItem[]) =>
    apiRequest<Order>("/api/user/orders", { method: "POST", body: { items } }),

  calculate: (items: { file: { publicId: string }; printingOptions: PrintingOptions; quantity: number }[]) =>
    apiRequest<{
      items: {
        pages: number;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        totalPages: number;
      }[];
      itemsSubtotal: number;
      total: number;
      totalPrice: number;
      currency: string;
      rulesVersion: number;
    }>("/api/user/orders/calculate-price", { method: "POST", body: { items } }),

  cancel: (id: string, note?: string) =>
    apiRequest<Order>(`/api/user/orders/${id}/cancel`, {
      method: "POST",
      body: note ? { note } : {},
    }),

  adminList: (query: { page?: number; size?: number; status?: OrderStatus }) =>
    apiRequest<Paginated<Order>>("/api/admin/orders", { query }),

  adminGet: (id: string) => apiRequest<Order>(`/api/admin/orders/${id}`),

  count: () => apiRequest<{ totalOrders: number }>("/api/admin/orders/count"),

  totalSales: () => apiRequest<{ totalSales: number }>("/api/admin/orders/total-sales"),

  updateStatus: (id: string, status: "received" | "processing" | "completed" | "delivered", note?: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}/status`, {
      method: "PUT",
      body: note ? { status, note } : { status },
    }),

  markDelivered: (id: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}/deliver`, { method: "PUT" }),
};
