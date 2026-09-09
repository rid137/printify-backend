import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCorsOrigins, getPaymentCallbackUrl, productionJwtSecretIssue } from "../src/config/secrets.js";
import { isFcmAvailable } from "../src/utils/firebase.js";
import { MIN_PRODUCTION_JWT_SECRET_LENGTH } from "../src/utils/limits.js";

const withEnv = (patch: Record<string, string | undefined>, fn: () => void) => {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(patch)) {
    previous[key] = process.env[key];
    const value = patch[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(patch)) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

describe("production configuration hardening", () => {
  it("rejects weak and short production JWT secrets", () => {
    assert.ok(productionJwtSecretIssue("change-me"));
    assert.ok(productionJwtSecretIssue("secret"));
    assert.ok(productionJwtSecretIssue("short"));
    assert.equal(
      productionJwtSecretIssue("a".repeat(MIN_PRODUCTION_JWT_SECRET_LENGTH)),
      null
    );
  });

  it("preserves comma-separated CORS origins", () => {
    withEnv(
      {
        FRONTEND_URL: "https://a.example.com, https://b.example.com",
      },
      () => {
        assert.deepEqual(getCorsOrigins(), [
          "https://a.example.com",
          "https://b.example.com",
        ]);
      }
    );
  });

  it("does not throw when probing FCM availability", () => {
    assert.equal(typeof isFcmAvailable(), "boolean");
  });

  it("derives Paystack callback URL from FRONTEND_URL when verify URL is unset", () => {
    withEnv(
      {
        FRONTEND_URL: "https://app.example.com",
        FRONTEND_VERIFY_PAYMENT_URL: undefined,
      },
      () => {
        assert.equal(
          getPaymentCallbackUrl(),
          "https://app.example.com/payment/verify"
        );
      }
    );
  });

  it("prefers an explicit Paystack callback URL", () => {
    withEnv(
      {
        FRONTEND_URL: "https://app.example.com",
        FRONTEND_VERIFY_PAYMENT_URL: "https://pay.example.com/payment/verify/",
      },
      () => {
        assert.equal(
          getPaymentCallbackUrl(),
          "https://pay.example.com/payment/verify"
        );
      }
    );
  });
});
