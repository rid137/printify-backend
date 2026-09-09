import { Schema, model, Document } from "mongoose";
import type { OtpPurpose } from "../utils/otp.js";

export interface IOTP extends Document {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt?: Date;
  consumedAt?: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: [true, "email is required"],
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ["verify_email", "reset_password"],
      index: true,
    },
    codeHash: {
      type: String,
      required: [true, "OTP hash is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastSentAt: {
      type: Date,
    },
    consumedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = model<IOTP>("OTP", otpSchema);

export default OTP;
