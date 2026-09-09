import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js";
import {
  BadRequest,
  Forbidden,
  NotFound,
} from "../utils/error/httpErrors.js";
import { isResourceOwner } from "../utils/ownership.js";
import {
  inferOrderStatus,
  isEligibleForPayment,
  paymentConfirmationFilter,
} from "../utils/order-status.js";
import {
  PaystackClient,
  type PaystackTransactionData,
} from "./paystack.client.js";
import { getPaymentCallbackUrl } from "../config/secrets.js";
import type {
  InitializePaymentBody,
  VerifyPaymentQuery,
} from "../validations/payment.schema.js";

type ConfirmContext = {
  reference: string;
  paystackData: PaystackTransactionData;
  /** When set, enforce order ownership (user-facing verify). */
  userId?: unknown;
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

export class PaymentService {
  /**
   * Shared confirmation path used by GET /verify and the webhook.
   * Validates Paystack status/amount/currency against the local Transaction,
   * then atomically marks order + transaction as paid (idempotent).
   */
  private static async confirmSuccessfulPayment({
    reference,
    paystackData,
    userId,
  }: ConfirmContext) {
    if (!paystackData.status || paystackData.status !== "success") {
      throw BadRequest("Payment verification failed");
    }

    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      throw NotFound("Transaction not found for payment reference");
    }

    const order = await Order.findById(transaction.order);
    if (!order) {
      throw NotFound("Order not found");
    }

    // Current design: Paystack reference === orderId === transaction.reference
    if (
      transaction.reference !== reference ||
      String(order._id) !== reference
    ) {
      throw BadRequest("Payment reference does not match order transaction");
    }

    if (userId !== undefined && !isResourceOwner(order.user, userId)) {
      throw Forbidden("You do not have access to this order");
    }

    const paystackCurrency = (paystackData.currency || "").toUpperCase();
    const localCurrency = (transaction.currency || "NGN").toUpperCase();

    if (!paystackCurrency || paystackCurrency !== localCurrency) {
      throw BadRequest("Payment currency mismatch");
    }

    if (typeof paystackData.amount !== "number") {
      throw BadRequest("Paystack amount missing from verification response");
    }

    const expectedKobo = Math.round(transaction.amount * 100);
    if (paystackData.amount !== expectedKobo) {
      throw BadRequest("Payment amount mismatch");
    }

    if (Math.round(order.totalPrice * 100) !== expectedKobo) {
      throw BadRequest("Order amount does not match transaction amount");
    }

    if (order.isPaid) {
      if (transaction.status === "success") {
        return { order, transaction, alreadyPaid: true as const };
      }

      const paidAt = new Date(paystackData.paid_at || order.paidAt || new Date());
      const updatedTransaction = await Transaction.findOneAndUpdate(
        {
          _id: transaction._id,
          status: { $ne: "success" },
        },
        {
          $set: {
            status: "success",
            paidAt,
          },
        },
        { new: true }
      );
      const finalTransaction =
        updatedTransaction ?? (await Transaction.findById(transaction._id));
      if (!finalTransaction || finalTransaction.status !== "success") {
        throw BadRequest("Unable to confirm payment state");
      }
      return { order, transaction: finalTransaction, alreadyPaid: true as const };
    }

    if (inferOrderStatus(order) === "cancelled") {
      throw BadRequest("Cannot confirm payment for a cancelled order");
    }

    if (!isEligibleForPayment(order)) {
      throw BadRequest("Payment can only be confirmed for unpaid pending orders");
    }

    const paidAt = new Date(paystackData.paid_at || new Date());
    const paymentResult = {
      id: String(paystackData.id ?? ""),
      status: paystackData.status,
      update_time: paystackData.paid_at || paidAt.toISOString(),
      email_address: paystackData.customer?.email || transaction.email || "",
    };

    const updatedOrder = await Order.findOneAndUpdate(
      paymentConfirmationFilter(order._id),
      {
        $set: {
          isPaid: true,
          paidAt,
          paymentResult,
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      const freshOrder = await Order.findById(order._id);
      const freshTransaction = await Transaction.findById(transaction._id);

      if (freshOrder?.isPaid && freshTransaction?.status === "success") {
        return {
          order: freshOrder,
          transaction: freshTransaction,
          alreadyPaid: true as const,
        };
      }

      if (freshOrder && inferOrderStatus(freshOrder) === "cancelled") {
        throw BadRequest("Cannot confirm payment for a cancelled order");
      }

      throw BadRequest("Unable to confirm payment state");
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      {
        _id: transaction._id,
        status: { $ne: "success" },
      },
      {
        $set: {
          status: "success",
          paidAt,
        },
      },
      { new: true }
    );

    const finalOrder = updatedOrder ?? (await Order.findById(order._id));
    const finalTransaction =
      updatedTransaction ?? (await Transaction.findById(transaction._id));

    if (!finalOrder || !finalTransaction) {
      throw NotFound("Order or transaction missing after payment confirmation");
    }

    if (!finalOrder.isPaid || finalTransaction.status !== "success") {
      throw BadRequest("Unable to confirm payment state");
    }

    return {
      order: finalOrder,
      transaction: finalTransaction,
      alreadyPaid: updatedOrder == null,
    };
  }

  static async initializePayment(
    userId: unknown,
    input: InitializePaymentBody,
    userEmail: string
  ) {
    const { orderId } = input;
    const email = userEmail.trim().toLowerCase();
    if (!email) {
      throw BadRequest("Authenticated user email is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw NotFound("Order not found");
    }

    if (!isResourceOwner(order.user, userId)) {
      throw Forbidden("You do not have access to this order");
    }

    if (order.isPaid) {
      throw BadRequest("Order is already paid");
    }

    const orderStatus = inferOrderStatus(order);
    if (orderStatus === "cancelled") {
      throw BadRequest("Cannot pay for a cancelled order");
    }
    if (orderStatus !== "pending" || !isEligibleForPayment(order)) {
      throw BadRequest("Payment can only be initialized for pending orders");
    }

    const reference = String(order._id);
    const amount = order.totalPrice;
    const currency = "NGN";

    let transaction = await Transaction.findOne({ reference });

    if (transaction?.status === "success") {
      throw BadRequest("Order payment is already completed");
    }

    if (!transaction) {
      try {
        transaction = await Transaction.create({
          user: order.user,
          order: order._id,
          reference,
          amount,
          currency,
          email,
          status: "pending",
        });
      } catch (error) {
        if (!isDuplicateKeyError(error)) {
          throw error;
        }
        transaction = await Transaction.findOne({ reference });
        if (!transaction) {
          throw BadRequest("Unable to create payment transaction");
        }
      }
    } else {
      // Keep pending transaction aligned with current order total / email
      transaction.amount = amount;
      transaction.currency = currency;
      transaction.email = email;
      await transaction.save();
    }

    return PaystackClient.initializeTransaction({
      email,
      amount: Math.round(amount * 100),
      reference,
      currency,
      callback_url: getPaymentCallbackUrl(),
    });
  }

  static async verifyPayment(userId: unknown, input: VerifyPaymentQuery) {
    const { reference } = input;

    const existingTx = await Transaction.findOne({ reference });
    const existingOrder = existingTx
      ? await Order.findById(existingTx.order)
      : await Order.findById(reference);

    if (!existingOrder) {
      throw NotFound("Order not found");
    }

    if (!isResourceOwner(existingOrder.user, userId)) {
      throw Forbidden("You do not have access to this order");
    }

    if (existingOrder.isPaid && existingTx?.status === "success") {
      return { order: existingOrder };
    }

    const paystackData = await PaystackClient.verifyTransaction(reference);

    const result = await this.confirmSuccessfulPayment({
      reference,
      paystackData,
      userId,
    });

    return { order: result.order };
  }

  /**
   * Process Paystack webhook: verify HMAC against raw body, then confirm payment
   * using a fresh Paystack verify API call (do not trust webhook amounts alone).
   */
  static async handleWebhook(
    rawBody: Buffer,
    signatureHeader: string | undefined
  ) {
    PaystackClient.verifyWebhookSignature(rawBody, signatureHeader);

    let event: { event?: string; data?: PaystackTransactionData };
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw BadRequest("Invalid webhook payload");
    }

    if (event.event !== "charge.success") {
      return { received: true, processed: false as const };
    }

    const reference = event.data?.reference;
    if (!reference) {
      console.warn("[payment.webhook] charge.success missing reference");
      return { received: true, processed: false as const };
    }

    let paystackData: PaystackTransactionData;
    try {
      paystackData = await PaystackClient.verifyTransaction(reference);
    } catch (error) {
      console.error(
        "[payment.webhook] Paystack verify failed for reference",
        reference,
        error instanceof Error ? error.message : "verify failed"
      );
      throw error;
    }

    try {
      await this.confirmSuccessfulPayment({
        reference,
        paystackData,
      });
      return { received: true, processed: true as const };
    } catch (error) {
      console.error(
        "[payment.webhook] Unable to confirm payment for reference",
        reference,
        error instanceof Error ? error.message : "confirm failed"
      );

      const message =
        error instanceof Error ? error.message : "Webhook processing failed";

      // Valid signature but unmatchable/mismatched payment: ack without mutating state
      if (
        message.includes("not found") ||
        message.includes("mismatch") ||
        message.includes("does not match") ||
        message.includes("Payment verification failed") ||
        message.includes("cancelled") ||
        message.includes("unpaid pending")
      ) {
        return { received: true, processed: false as const };
      }

      throw error;
    }
  }
}
