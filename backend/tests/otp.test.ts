import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_REQUEST_PUBLIC_MESSAGE,
  checkOtp,
  canResendOtp,
  dummyOtpHash,
  generateOtpCode,
  hashOtp,
  otpMatches,
  resolveLogin,
  resolveOtpEmailAction,
} from "../src/utils/otp.js";

const PEPPER = "unit-test-otp-pepper";

describe("OTP hashing", () => {
  it("does not store or round-trip plaintext", () => {
    const code = generateOtpCode();
    const hashed = hashOtp(code, PEPPER);
    assert.equal(hashed.length, 64);
    assert.notEqual(hashed, code);
    assert.equal(hashed.includes(code), false);
  });

  it("verifies the matching code and rejects others", () => {
    const code = "482193";
    const hashed = hashOtp(code, PEPPER);
    assert.equal(otpMatches(code, hashed, PEPPER), true);
    assert.equal(otpMatches("000000", hashed, PEPPER), false);
    assert.equal(otpMatches(code, hashed, "other-pepper"), false);
  });
});

describe("OTP expiry and reuse", () => {
  const base = {
    codeHash: hashOtp("123456", PEPPER),
    attempts: 0,
    expiresAt: new Date(Date.now() + 60_000),
  };

  it("accepts a valid unexpired OTP", () => {
    const result = checkOtp(base, "123456", PEPPER);
    assert.equal(result.ok, true);
  });

  it("rejects expired OTPs", () => {
    const result = checkOtp(
      { ...base, expiresAt: new Date(Date.now() - 1000) },
      "123456",
      PEPPER
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "expired");
  });

  it("rejects consumed OTPs (reuse)", () => {
    const result = checkOtp(
      { ...base, consumedAt: new Date() },
      "123456",
      PEPPER
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "consumed");
  });

  it("rejects after max attempts", () => {
    const result = checkOtp(
      { ...base, attempts: OTP_MAX_ATTEMPTS },
      "123456",
      PEPPER
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "locked");
  });

  it("rejects a wrong code as mismatch", () => {
    const result = checkOtp(base, "000000", PEPPER);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "mismatch");
  });

  it("treats a missing record as failure without throwing", () => {
    const result = checkOtp(null, "123456", PEPPER);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "missing");
  });

  it("uses a dummy hash when no record exists", () => {
    assert.equal(dummyOtpHash(PEPPER).length, 64);
  });
});

describe("OTP resend cooldown and enumeration policy", () => {
  it("allows first send and blocks sends inside the cooldown window", () => {
    const now = new Date("2026-01-01T00:01:00.000Z");
    assert.equal(canResendOtp(undefined, now), true);
    assert.equal(
      canResendOtp(new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS + 1000), now),
      false
    );
    assert.equal(
      canResendOtp(new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS), now),
      true
    );
  });

  it("skips issuance for unknown emails and already-verified users", () => {
    assert.equal(
      resolveOtpEmailAction({
        userFound: false,
        purpose: "verify_email",
      }),
      "skip"
    );
    assert.equal(
      resolveOtpEmailAction({
        userFound: true,
        purpose: "verify_email",
        isVerified: true,
      }),
      "skip"
    );
    assert.equal(
      resolveOtpEmailAction({
        userFound: true,
        purpose: "verify_email",
        isVerified: false,
      }),
      "issue"
    );
    assert.equal(
      resolveOtpEmailAction({
        userFound: true,
        purpose: "reset_password",
      }),
      "issue"
    );
  });

  it("uses one public message for existing and missing accounts", () => {
    assert.equal(
      OTP_REQUEST_PUBLIC_MESSAGE,
      "If an account exists for this email, a message has been sent."
    );
  });
});

describe("unverified login rejection", () => {
  it("rejects unverified users after a valid password", () => {
    assert.equal(
      resolveLogin({
        userFound: true,
        passwordValid: true,
        isVerified: false,
      }),
      "unverified"
    );
  });

  it("does not distinguish missing users from bad passwords", () => {
    assert.equal(
      resolveLogin({
        userFound: false,
        passwordValid: false,
        isVerified: false,
      }),
      "invalid_credentials"
    );
    assert.equal(
      resolveLogin({
        userFound: true,
        passwordValid: false,
        isVerified: true,
      }),
      "invalid_credentials"
    );
  });

  it("allows verified users", () => {
    assert.equal(
      resolveLogin({
        userFound: true,
        passwordValid: true,
        isVerified: true,
      }),
      "ok"
    );
  });
});
