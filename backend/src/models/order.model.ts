import mongoose, { model, Schema } from "mongoose";
import { IOrder, ORDER_STATUSES } from "../types/order.types.js";

const printingOptionsSchema = new Schema(
  {
    color: {
      type: String,
      required: true,
      enum: ["black-white", "color"],
    },
    sides: {
      type: String,
      required: true,
      enum: ["single", "double"],
    },
    paperType: {
      type: String,
      required: true,
      enum: ["matte", "glossy", "cardstock", "recycled"],
    },
    paperSize: {
      type: String,
      required: true,
      enum: ["A3", "A4", "A5", "letter", "legal"],
    },
    binding: {
      type: String,
      required: true,
      enum: ["none", "stapled", "spiral", "hardcover"],
    },
    finishing: {
      type: String,
      required: true,
      enum: ["none", "lamination"],
    },
  },
  { _id: false }
);

const orderItemFileSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    pages: { type: Number, required: true, min: 1 },
    mimeType: { type: String },
    size: { type: Number, min: 0 },
    format: {
      type: String,
      enum: ["pdf", "docx", "pptx"],
    },
  },
  { _id: false }
);

const pricingSnapshotSchema = new Schema(
  {
    rulesVersion: { type: Number, required: true, min: 0 },
    rules: { type: Schema.Types.Mixed, required: true },
    breakdown: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    file: { type: orderItemFileSchema, required: true },
    printingOptions: { type: printingOptionsSchema, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    pricingSnapshot: { type: pricingSnapshotSchema, required: true },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    items: {
      type: [orderItemSchema],
      default: undefined,
      validate: {
        validator(this: IOrder, value: unknown) {
          // Allow legacy documents without items until migration runs;
          // new writes always provide items via the service.
          if (Array.isArray(value) && value.length > 0) return true;
          if (this.file?.url) return true;
          return false;
        },
        message: "Order must contain at least one item",
      },
    },
    itemsSubtotal: { type: Number, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: [...ORDER_STATUSES],
      default: "pending",
      index: true,
    },
    statusHistory: {
      type: [
        new Schema(
          {
            status: {
              type: String,
              required: true,
              enum: [...ORDER_STATUSES],
            },
            at: { type: Date, required: true, default: Date.now },
            by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            note: { type: String, maxlength: 500 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    isPaid: { type: Boolean, required: true, default: false, index: true },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    // Legacy single-file fields (optional; used only for migration/compat)
    file: {
      url: { type: String },
      pages: { type: Number },
      fileName: { type: String },
    },
    printingOptions: {
      color: { type: String },
      sides: { type: String },
      paperType: { type: String },
      paperSize: { type: String },
      binding: { type: String },
      finishing: { type: String },
    },
    quantity: { type: Number },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ isPaid: 1, createdAt: -1 });

const Order = model<IOrder>("Order", OrderSchema);

export default Order;
