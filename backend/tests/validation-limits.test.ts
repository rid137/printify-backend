import assert from "node:assert/strict";
import { describe, it } from "node:test";
import CustomError from "../src/utils/error/customError.js";
import { MAX_FCM_TOKEN_LENGTH, MAX_ORDER_ITEMS } from "../src/utils/limits.js";
import { UploadService } from "../src/services/upload.service.js";
import {
  calculateMultiItemPriceBodySchema,
  calculatePriceBodySchema,
  createOrderBodySchema,
} from "../src/validations/order.schema.js";
import { registerDeviceBodySchema } from "../src/validations/notification.schema.js";
import { initializePaymentBodySchema } from "../src/validations/payment.schema.js";
import { updatePricingConfigBodySchema } from "../src/validations/pricing.schema.js";
import { DEFAULT_PRICING_RULES } from "../src/types/pricing.types.js";

const printingOptions = {
  color: "black-white" as const,
  sides: "single" as const,
  paperType: "matte" as const,
  paperSize: "A4" as const,
  binding: "none" as const,
  finishing: "none" as const,
};

const item = (overrides: Record<string, unknown> = {}) => ({
  file: { publicId: "507f1f77bcf86cd799439011_550e8400-e29b-41d4-a716-446655440000", fileName: "a.pdf" },
  printingOptions,
  quantity: 1,
  ...overrides,
});

describe("validation limits", () => {
  it("rejects zero quantity", () => {
    assert.equal(
      calculatePriceBodySchema.safeParse({
        printingOptions,
        quantity: 0,
        pages: 1,
      }).success,
      false
    );
    assert.equal(
      createOrderBodySchema.safeParse({ items: [item({ quantity: 0 })] }).success,
      false
    );
  });

  it("rejects quantity greater than 100", () => {
    assert.equal(
      calculatePriceBodySchema.safeParse({
        printingOptions,
        quantity: 101,
        pages: 1,
      }).success,
      false
    );
    assert.equal(
      createOrderBodySchema.safeParse({ items: [item({ quantity: 101 })] })
        .success,
      false
    );
  });

  it("rejects more than 20 order items", () => {
    const items = Array.from({ length: MAX_ORDER_ITEMS + 1 }, () => item());
    assert.equal(createOrderBodySchema.safeParse({ items }).success, false);
    assert.equal(
      calculateMultiItemPriceBodySchema.safeParse({ items }).success,
      false
    );
  });

  it("rejects pages greater than 10000", () => {
    assert.equal(
      calculatePriceBodySchema.safeParse({
        printingOptions,
        quantity: 1,
        pages: 10_001,
      }).success,
      false
    );
  });

  it("rejects more than 10 upload files before processing", async () => {
    const files = Array.from({ length: 11 }, () => ({ name: "a.pdf" }));
    await assert.rejects(
      () => UploadService.uploadFiles(files, "507f1f77bcf86cd799439011"),
      (error: unknown) =>
        error instanceof CustomError &&
        error.statusCode === 400 &&
        /at most 10 files/i.test(error.message)
    );
  });

  it("rejects oversized FCM tokens", () => {
    assert.equal(
      registerDeviceBodySchema.safeParse({
        fcmToken: "x".repeat(MAX_FCM_TOKEN_LENGTH + 1),
      }).success,
      false
    );
    assert.equal(
      registerDeviceBodySchema.safeParse({
        fcmToken: "ok-token",
      }).success,
      true
    );
  });

  it("rejects client email on authenticated payment initialize", () => {
    const extraEmail = initializePaymentBodySchema.safeParse({
      orderId: "507f1f77bcf86cd799439011",
      email: "other@example.com",
    });
    assert.equal(extraEmail.success, false);

    const orderOnly = initializePaymentBodySchema.safeParse({
      orderId: "507f1f77bcf86cd799439011",
    });
    assert.equal(orderOnly.success, true);
  });

  it("rejects out-of-range admin pricing values without clamping", () => {
    const tooHigh = updatePricingConfigBodySchema.safeParse({
      rules: { ...DEFAULT_PRICING_RULES, basePricePerPage: 1_000_001 },
    });
    assert.equal(tooHigh.success, false);

    const ok = updatePricingConfigBodySchema.safeParse({
      rules: DEFAULT_PRICING_RULES,
    });
    assert.equal(ok.success, true);
  });
});
