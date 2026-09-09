import mongoose, { Document } from "mongoose";
import type { PriceBreakdown, PricingRule } from "./pricing.types.js";

export const ORDER_STATUSES = [
  "pending",
  "received",
  "processing",
  "completed",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface StatusHistoryEntry {
  status: OrderStatus;
  at: Date;
  by?: mongoose.Types.ObjectId;
  note?: string;
}

export interface PrintingOptions {
  color: "black-white" | "color";
  sides: "single" | "double";
  paperType: "matte" | "glossy" | "cardstock" | "recycled";
  paperSize: "A3" | "A4" | "A5" | "letter" | "legal";
  binding: "none" | "stapled" | "spiral" | "hardcover";
  finishing: "none" | "lamination";
}

export interface OrderItemFile {
  url: string;
  publicId: string;
  fileName: string;
  pages: number;
  mimeType?: string;
  size?: number;
  format?: "pdf" | "docx" | "pptx";
}

export interface ItemPricingSnapshot {
  rulesVersion: number;
  rules: PricingRule;
  breakdown: PriceBreakdown;
}

export interface OrderItem {
  file: OrderItemFile;
  printingOptions: PrintingOptions;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  pricingSnapshot: ItemPricingSnapshot;
}

interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
}

/**
 * Legacy single-file fields kept optional for migration/read compatibility.
 * New orders only write `items[]`.
 */
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: OrderItem[];
  itemsSubtotal: number;
  totalPrice: number;
  currency: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  isPaid: boolean;
  paidAt?: Date;
  /** @deprecated prefer status === "delivered"; kept in sync by the status machine */
  isDelivered: boolean;
  deliveredAt?: Date;
  paymentResult?: PaymentResult;
  /** @deprecated legacy single-file shape */
  file?: {
    url: string;
    pages: number;
    fileName: string;
  };
  /** @deprecated */
  printingOptions?: PrintingOptions;
  /** @deprecated */
  quantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
