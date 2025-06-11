import mongoose, { Document } from "mongoose";

export interface PrintingOptions {
  color: 'black-white' | 'color';
  sides: 'single' | 'double';
  paperType: 'matte' | 'glossy' | 'cardstock' | 'recycled';
  paperSize: 'A3' | 'A4' | 'A5' | 'letter' | 'legal';
  binding: 'none' | 'stapled' | 'spiral' | 'hardcover';
  finishing: 'none' | 'lamination';
}

interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  paymentResult: PaymentResult;
  file: {
    url: string;
    pages: number;
    fileName: string;
  };
  printingOptions: PrintingOptions;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'printed' | 'shipped' | 'delivered' | 'cancelled';
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
}