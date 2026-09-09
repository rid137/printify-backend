import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  transactionFilterQuerySchema,
  transactionStatusSchema,
} from "../src/validations/transaction.schema.js";
import { TRANSACTION_STATUSES } from "../src/types/transaction.types.js";

describe("transaction status", () => {
  it("accepts only pending and success", () => {
    assert.equal(transactionStatusSchema.safeParse("pending").success, true);
    assert.equal(transactionStatusSchema.safeParse("success").success, true);
    assert.equal(transactionStatusSchema.safeParse("failed").success, false);
    assert.equal(transactionStatusSchema.safeParse("refunded").success, false);
    assert.deepEqual([...TRANSACTION_STATUSES], ["pending", "success"]);
  });

  it("rejects arbitrary regex status filters", () => {
    const regex = transactionFilterQuerySchema.safeParse({
      status: ".*",
    });
    assert.equal(regex.success, false);

    const injection = transactionFilterQuerySchema.safeParse({
      status: "success|pending",
    });
    assert.equal(injection.success, false);

    const exact = transactionFilterQuerySchema.safeParse({
      status: "success",
    });
    assert.equal(exact.success, true);
  });
});
