/**
 * Focused Phase 8 checks: order status machine rules and payment predicates.
 * Does not connect to MongoDB or Paystack; concurrency/webhook races are
 * asserted as predicate shapes only.
 *
 * Run: node --loader ts-node/esm src/scripts/verify-order-status.ts
 */
import {
  canTransition,
  inferOrderStatus,
  isDeliveredForStatus,
  isEligibleForPayment,
  paymentConfirmationFilter,
  statusTransitionFilter,
  ALLOWED_TRANSITIONS,
  ADMIN_TARGET_STATUSES,
  canonicalStatusForMigration,
} from "../utils/order-status.js";
import {
  adminTargetStatusSchema,
  updateOrderStatusBodySchema,
} from "../validations/order.schema.js";
import { normalizeOrderForResponse } from "../utils/order-normalize.js";
import type { IOrder } from "../types/order.types.js";

let failed = 0;

const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("PASS:", msg);
  }
};

const asOrder = (plain: Record<string, unknown>) =>
  plain as unknown as IOrder;

const adminPaid = { actor: "admin" as const, isPaid: true };
const adminUnpaid = { actor: "admin" as const, isPaid: false };
const userUnpaid = { actor: "user" as const, isPaid: false };
const userPaid = { actor: "user" as const, isPaid: true };

assert(
  inferOrderStatus({ status: "pending" }) === "pending",
  "pending stays pending"
);
assert(
  inferOrderStatus({ status: "pending", isDelivered: true }) === "pending",
  "isDelivered does not override persisted pending"
);
assert(
  inferOrderStatus({ status: "processing", isDelivered: true }) === "processing",
  "isDelivered does not override persisted processing"
);
assert(
  inferOrderStatus({ status: "completed", isDelivered: true }) === "completed",
  "isDelivered does not override persisted completed"
);
assert(
  inferOrderStatus({ status: "delivered", isDelivered: false }) === "delivered",
  "status delivered is authoritative even if flag is false"
);
assert(
  inferOrderStatus({ status: "printed" }) === "completed",
  "legacy printed maps to completed"
);
assert(
  inferOrderStatus({ status: "shipped" }) === "completed",
  "legacy shipped maps to completed"
);
assert(
  inferOrderStatus({ status: "unknown" }) === "pending",
  "unknown status falls back to pending"
);
assert(
  canonicalStatusForMigration({ status: "pending", isDelivered: true }) ===
    "delivered",
  "migration still maps legacy isDelivered to delivered"
);

assert(isDeliveredForStatus("delivered"), "isDelivered true only for delivered");
assert(!isDeliveredForStatus("pending"), "pending is not delivered");
assert(!isDeliveredForStatus("processing"), "processing is not delivered");
assert(!isDeliveredForStatus("cancelled"), "cancelled is not delivered");

assert(
  canTransition("pending", "received", adminPaid).ok,
  "valid pending → received"
);
assert(
  canTransition("received", "processing", adminPaid).ok,
  "valid received → processing"
);
assert(
  canTransition("processing", "completed", adminPaid).ok,
  "valid processing → completed"
);
assert(
  canTransition("completed", "delivered", adminPaid).ok,
  "valid completed → delivered"
);
assert(
  canTransition("pending", "cancelled", userUnpaid).ok,
  "valid pending → cancelled for owner"
);

assert(
  !canTransition("pending", "processing", adminPaid).ok,
  "invalid skip pending → processing"
);
assert(
  !canTransition("pending", "completed", adminPaid).ok,
  "invalid skip pending → completed"
);
assert(
  !canTransition("received", "delivered", adminPaid).ok,
  "invalid skip received → delivered"
);
assert(
  !canTransition("processing", "pending", adminPaid).ok,
  "invalid backward processing → pending"
);
assert(
  !canTransition("delivered", "completed", adminPaid).ok,
  "invalid backward delivered → completed"
);
assert(
  !canTransition("delivered", "processing", adminPaid).ok,
  "delivered is terminal (no processing)"
);
assert(
  !canTransition("delivered", "cancelled", userUnpaid).ok,
  "delivered is terminal (no cancel)"
);
assert(
  !canTransition("cancelled", "pending", adminUnpaid).ok,
  "cancelled is terminal"
);
assert(
  !canTransition("cancelled", "received", adminPaid).ok,
  "cancelled cannot move to received"
);

assert(
  !canTransition("pending", "pending", adminUnpaid).ok,
  "no-op pending → pending rejected"
);
assert(
  !canTransition("received", "received", adminPaid).ok,
  "no-op received → received rejected"
);
assert(
  !canTransition("processing", "processing", adminPaid).ok,
  "no-op processing → processing rejected"
);
assert(
  !canTransition("completed", "completed", adminPaid).ok,
  "no-op completed → completed rejected"
);
assert(
  !canTransition("delivered", "delivered", adminPaid).ok,
  "no-op delivered → delivered rejected"
);
assert(
  !canTransition("cancelled", "cancelled", userUnpaid).ok,
  "no-op cancelled → cancelled rejected"
);

assert(
  !canTransition("pending", "cancelled", adminUnpaid).ok,
  "admin cannot cancel via fulfillment transitions"
);
assert(
  !canTransition("pending", "received", userPaid).ok,
  "user cannot mark received"
);
assert(
  !canTransition("pending", "cancelled", userPaid).ok,
  "user cannot cancel a paid order"
);
assert(
  !canTransition("pending", "received", adminUnpaid).ok,
  "unpaid pending cannot be received"
);

assert(
  ALLOWED_TRANSITIONS.pending.includes("cancelled"),
  "state machine still allows pending → cancelled"
);
assert(
  !(ADMIN_TARGET_STATUSES as readonly string[]).includes("cancelled"),
  "admin target list does not include cancelled"
);

const adminCancelled = adminTargetStatusSchema.safeParse("cancelled");
assert(!adminCancelled.success, "admin target schema rejects cancelled");

const sneakyPending = updateOrderStatusBodySchema.safeParse({
  status: "pending",
});
assert(!sneakyPending.success, "admin cannot set create-only pending status");

const sneakyCancelBody = updateOrderStatusBodySchema.safeParse({
  status: "cancelled",
});
assert(
  !sneakyCancelBody.success,
  "admin status API body rejects cancelled (user cancel is a separate path)"
);

const validReceived = updateOrderStatusBodySchema.safeParse({
  status: "received",
  note: "Paid and queued",
});
assert(validReceived.success, "admin can target received with note");

assert(
  isEligibleForPayment({ status: "pending", isPaid: false }),
  "unpaid pending is eligible for payment"
);
assert(
  !isEligibleForPayment({ status: "pending", isPaid: true }),
  "paid pending is not eligible for payment init"
);
assert(
  !isEligibleForPayment({ status: "cancelled", isPaid: false }),
  "cancelled is not eligible for payment"
);
assert(
  !isEligibleForPayment({ status: "received", isPaid: true }),
  "received is not eligible for payment"
);
assert(
  !isEligibleForPayment({ status: "processing", isPaid: false }),
  "processing is not eligible for payment"
);
assert(
  !isEligibleForPayment({ status: "completed", isPaid: false }),
  "completed is not eligible for payment"
);
assert(
  !isEligibleForPayment({ status: "delivered", isPaid: false }),
  "delivered is not eligible for payment"
);

const payFilter = paymentConfirmationFilter("order-1");
assert(
  payFilter.status === "pending" &&
    payFilter.isPaid === false &&
    payFilter._id === "order-1",
  "payment confirmation predicate requires unpaid pending (predicate only; no Mongo/Paystack)"
);

const receivedFilter = statusTransitionFilter("order-1", "pending", "received");
assert(
  receivedFilter.status === "pending" && receivedFilter.isPaid === true,
  "pending → received write requires current pending and isPaid true"
);

const cancelFilter = statusTransitionFilter("order-1", "pending", "cancelled");
assert(
  cancelFilter.status === "pending" && cancelFilter.isPaid === false,
  "pending → cancelled write requires current pending and isPaid false"
);

const processingFilter = statusTransitionFilter(
  "order-1",
  "received",
  "processing"
);
assert(
  processingFilter.status === "received" &&
    processingFilter.isPaid === undefined,
  "fulfillment writes include expected current status"
);

const emptyHistory = normalizeOrderForResponse(
  asOrder({
    status: "pending",
    isDelivered: false,
    totalPrice: 10,
  })
);
assert(
  Array.isArray(emptyHistory.statusHistory) &&
    emptyHistory.statusHistory.length === 0,
  "normalization does not fabricate status history"
);

const processingRead = normalizeOrderForResponse(
  asOrder({
    status: "processing",
    isDelivered: true,
    items: [{ subtotal: 10 }],
    totalPrice: 10,
  })
);
assert(
  processingRead.status === "processing" &&
    processingRead.isDelivered === false,
  "response derives isDelivered from status, not the stored flag"
);

const deliveredRead = normalizeOrderForResponse(
  asOrder({
    status: "delivered",
    isDelivered: false,
    items: [{ subtotal: 10 }],
    totalPrice: 10,
  })
);
assert(
  deliveredRead.status === "delivered" && deliveredRead.isDelivered === true,
  "delivered status yields isDelivered true on read"
);

process.exit(failed === 0 ? 0 : 1);
