import axios from "axios";
import crypto from "crypto";
import { InternalServerError, Unauthorized } from "../utils/error/httpErrors.js";
import { getPaystackSecretKey } from "../config/secrets.js";

export { getPaystackSecretKey } from "../config/secrets.js";

export interface PaystackInitializePayload {
  email: string;
  amount: number;
  reference: string;
  currency: string;
  callback_url: string;
}

export interface PaystackTransactionData {
  authorization_url?: string;
  access_code?: string;
  reference: string;
  status: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  customer?: {
    email: string;
  };
  id?: number | string;
}

interface PaystackApiResponse {
  status: boolean;
  message: string;
  data: PaystackTransactionData;
}

const authHeaders = () => ({
  Authorization: `Bearer ${getPaystackSecretKey()}`,
  "Content-Type": "application/json",
});

/**
 * Thin Paystack HTTP + webhook signature client.
 * PaymentService owns business rules; this class owns Paystack I/O.
 */
export class PaystackClient {
  static async initializeTransaction(payload: PaystackInitializePayload) {
    try {
      const response = await axios.post<PaystackApiResponse>(
        "https://api.paystack.co/transaction/initialize",
        payload,
        { headers: authHeaders() }
      );
      return response.data.data;
    } catch {
      throw InternalServerError("Unable to initialize payment with Paystack");
    }
  }

  static async verifyTransaction(reference: string) {
    try {
      const response = await axios.get<PaystackApiResponse>(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${getPaystackSecretKey()}` } }
      );
      return response.data.data;
    } catch {
      throw InternalServerError("Unable to verify payment with Paystack");
    }
  }

  /**
   * Verify x-paystack-signature as HMAC-SHA512 of the exact raw request body bytes.
   */
  static verifyWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string | undefined
  ): void {
    if (!signatureHeader) {
      throw Unauthorized("Missing Paystack webhook signature");
    }

    const secret = getPaystackSecretKey();
    const expected = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const providedBuf = Buffer.from(signatureHeader, "utf8");

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      throw Unauthorized("Invalid Paystack webhook signature");
    }
  }
}
