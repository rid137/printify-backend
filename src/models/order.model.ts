import mongoose, { model, Schema } from 'mongoose';
import { IOrder } from '../types/order.types.js';

const OrderSchema = new Schema<IOrder>({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  file: {
    url: { type: String, required: true },
    pages: { type: Number, required: true },
    fileName: { type: String, required: true },
  },
  printingOptions: {
    color: { type: String, required: true },
    sides: { type: String, required: true },
    paperType: { type: String, required: true },
    paperSize: { type: String, required: true },
    binding: { type: String, required: true },
    finishing: {type: String, required: true}
  },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
  },
},
{
  timestamps: true,
}
);

const Order = model<IOrder>('Order', OrderSchema);

export default Order;