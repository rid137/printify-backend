import asyncHandler from "../middlewares/async-handler.middleware.js";
import { successResponse } from "../utils/apiResponse.js";
import { BadRequest } from "../utils/error/httpErrors.js";
import { PaymentService } from "../services/payment.service.js";
import type {
  InitializePaymentBody,
  VerifyPaymentQuery,
} from "../validations/payment.schema.js";

const initializePayment = asyncHandler(async (req, res) => {
  const data = await PaymentService.initializePayment(
    req.user._id,
    req.body as InitializePaymentBody,
    req.user.email
  );
  successResponse(res, data, "Payment initialized successfully");
});

const verifyPayment = asyncHandler(async (req, res) => {
  const data = await PaymentService.verifyPayment(
    req.user._id,
    req.query as unknown as VerifyPaymentQuery
  );
  successResponse(res, data, "Payment verified successfully");
});

/**
 * Public webhook (no JWT). Signature verified inside PaymentService against raw body.
 */
const paystackWebhook = asyncHandler(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    throw BadRequest("Invalid webhook body");
  }

  const signature = req.headers["x-paystack-signature"];
  const signatureHeader = Array.isArray(signature) ? signature[0] : signature;

  const data = await PaymentService.handleWebhook(req.body, signatureHeader);
  successResponse(res, data, "Webhook received");
});

export { initializePayment, verifyPayment, paystackWebhook };
