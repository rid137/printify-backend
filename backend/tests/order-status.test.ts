import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransition,
  isEligibleForPayment,
  paymentConfirmationFilter,
  statusTransitionFilter,
} from "../src/utils/order-status.js";

describe("order status transitions", () => {
  const adminPaid = { actor: "admin" as const, isPaid: true };
  const adminUnpaid = { actor: "admin" as const, isPaid: false };
  const userUnpaid = { actor: "user" as const, isPaid: false };

  it("allows the forward machine and owner cancel of unpaid pending", () => {
    assert.equal(canTransition("pending", "received", adminPaid).ok, true);
    assert.equal(canTransition("received", "processing", adminPaid).ok, true);
    assert.equal(canTransition("processing", "completed", adminPaid).ok, true);
    assert.equal(canTransition("completed", "delivered", adminPaid).ok, true);
    assert.equal(canTransition("pending", "cancelled", userUnpaid).ok, true);
  });

  it("rejects skips, no-ops, admin cancel, and unpaid received", () => {
    assert.equal(canTransition("pending", "processing", adminPaid).ok, false);
    assert.equal(canTransition("pending", "pending", adminPaid).ok, false);
    assert.equal(canTransition("pending", "cancelled", adminPaid).ok, false);
    assert.equal(canTransition("pending", "received", adminUnpaid).ok, false);
  });

  it("treats cancelled and delivered as terminal", () => {
    assert.equal(canTransition("cancelled", "received", adminPaid).ok, false);
    assert.equal(canTransition("cancelled", "pending", userUnpaid).ok, false);
    assert.equal(canTransition("delivered", "processing", adminPaid).ok, false);
    assert.equal(canTransition("delivered", "completed", adminPaid).ok, false);
  });

  it("rejects backward and same-status updates", () => {
    assert.equal(canTransition("processing", "received", adminPaid).ok, false);
    assert.equal(canTransition("completed", "processing", adminPaid).ok, false);
    assert.equal(canTransition("received", "received", adminPaid).ok, false);
    assert.equal(canTransition("processing", "processing", adminPaid).ok, false);
  });
});

describe("payment and cancellation atomic predicates", () => {
  it("only unpaid pending orders are eligible for payment", () => {
    assert.equal(isEligibleForPayment({ status: "pending", isPaid: false }), true);
    assert.equal(isEligibleForPayment({ status: "pending", isPaid: true }), false);
    assert.equal(isEligibleForPayment({ status: "cancelled", isPaid: false }), false);
    assert.equal(isEligibleForPayment({ status: "received", isPaid: false }), false);
  });

  it("payment confirm requires unpaid pending", () => {
    const filter = paymentConfirmationFilter("oid");
    assert.equal(filter.isPaid, false);
    assert.equal(filter.status, "pending");
    assert.notEqual(filter.status, "cancelled");
  });

  it("stale pending filter does not match after another transition", () => {
    const adminPaid = { actor: "admin" as const, isPaid: true };
    const first = statusTransitionFilter("oid", "pending", "received");
    const stale = statusTransitionFilter("oid", "pending", "processing");
    assert.equal(first.status, "pending");
    assert.equal(stale.status, "pending");
    assert.equal(canTransition("pending", "processing", adminPaid).ok, false);
    assert.equal(canTransition("received", "processing", adminPaid).ok, true);
  });

  it("cancel write requires current pending and unpaid", () => {
    const filter = statusTransitionFilter("oid", "pending", "cancelled");
    assert.equal(filter.status, "pending");
    assert.equal(filter.isPaid, false);
  });

  it("received write requires current pending and paid", () => {
    const filter = statusTransitionFilter("oid", "pending", "received");
    assert.equal(filter.status, "pending");
    assert.equal(filter.isPaid, true);
  });
});
