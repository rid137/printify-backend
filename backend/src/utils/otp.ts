import crypto from "crypto";

/** OTP lifetime (email copy still says 10 minutes). */
export const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Minimum delay between successful OTP emails for the same email+purpose.
 * Failed sends do not start the cooldown, so a transient SMTP error is retryable.
 */
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

/** Failed verification attempts allowed per OTP before it is invalidated. */
export const OTP_MAX_ATTEMPTS = 5;

export const OTP_PURPOSES = ["verify_email", "reset_password"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const OTP_REQUEST_PUBLIC_MESSAGE =
  "If an account exists for this email, a message has been sent.";

export const INVALID_OTP_MESSAGE = "Invalid or expired OTP";

export const EMAIL_NOT_VERIFIED_MESSAGE = "Email verification required";

export type StoredOtp = {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt?: Date | null;
  lastSentAt?: Date | null;
};

export type OtpCheckReason =
  | "missing"
  | "consumed"
  | "expired"
  | "locked"
  | "mismatch";

export type OtpCheck = { ok: true } | { ok: false; reason: OtpCheckReason };

export type LoginOutcome = "invalid_credentials" | "unverified" | "ok";

export type OtpEmailAction = "issue" | "skip";

export const generateOtpCode = (): string =>
  crypto.randomInt(100000, 999999).toString();

export const hashOtp = (code: string, pepper: string): string =>
  crypto.createHmac("sha256", pepper).update(code, "utf8").digest("hex");

export const dummyOtpHash = (pepper: string): string => hashOtp("000000", pepper);

export const otpMatches = (
  code: string,
  codeHash: string,
  pepper: string
): boolean => {
  const computed = Buffer.from(hashOtp(code, pepper), "hex");
  const stored = Buffer.from(codeHash, "hex");
  if (computed.length !== stored.length) {
    return false;
  }
  return crypto.timingSafeEqual(computed, stored);
};

/**
 * Always hashes the submitted code (dummy hash when no record) so missing vs
 * wrong-code paths are closer in timing. Callers must not expose `reason`.
 */
export const checkOtp = (
  record: StoredOtp | null | undefined,
  code: string,
  pepper: string,
  now = new Date()
): OtpCheck => {
  const hash = record?.codeHash ?? dummyOtpHash(pepper);
  const matches = otpMatches(code, hash, pepper);

  if (!record) {
    return { ok: false, reason: "missing" };
  }
  if (record.consumedAt) {
    return { ok: false, reason: "consumed" };
  }
  if (record.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "locked" };
  }
  if (!matches) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true };
};

export const canResendOtp = (
  lastSentAt: Date | null | undefined,
  now = new Date()
): boolean => {
  if (!lastSentAt) {
    return true;
  }
  return now.getTime() - lastSentAt.getTime() >= OTP_RESEND_COOLDOWN_MS;
};

export const resolveLogin = (params: {
  userFound: boolean;
  passwordValid: boolean;
  isVerified: boolean;
}): LoginOutcome => {
  if (!params.userFound || !params.passwordValid) {
    return "invalid_credentials";
  }
  if (!params.isVerified) {
    return "unverified";
  }
  return "ok";
};

/**
 * Whether to create+email a new OTP. Callers always return the same public
 * response regardless of this result (anti-enumeration).
 */
export const resolveOtpEmailAction = (params: {
  userFound: boolean;
  purpose: OtpPurpose;
  isVerified?: boolean;
  lastSentAt?: Date | null;
  now?: Date;
}): OtpEmailAction => {
  if (!params.userFound) {
    return "skip";
  }
  if (params.purpose === "verify_email" && params.isVerified) {
    return "skip";
  }
  if (!canResendOtp(params.lastSentAt, params.now)) {
    return "skip";
  }
  return "issue";
};
