import { Schema, model, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string
  code: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: [true, 'email is required']
    },
    code: {
      type: String,
      required: [true, 'OTP code is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
  },
  {
    timestamps: true,
  }
);

const OTP = model<IOTP>('OTP', otpSchema);

export default OTP;