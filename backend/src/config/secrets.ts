import { InternalServerError } from "../utils/error/httpErrors.js";
import {
  MIN_PRODUCTION_JWT_SECRET_LENGTH,
  WEAK_JWT_SECRETS,
} from "../utils/limits.js";

export const isProduction = (): boolean =>
  (process.env.NODE_ENV || "").toLowerCase() === "production";

export const productionJwtSecretIssue = (secret: string): string | null => {
  if (secret.length < MIN_PRODUCTION_JWT_SECRET_LENGTH) {
    return `JWT_SECRET must be at least ${MIN_PRODUCTION_JWT_SECRET_LENGTH} characters in production`;
  }
  if (WEAK_JWT_SECRETS.includes(secret.toLowerCase())) {
    return "JWT_SECRET is too weak for production";
  }
  return null;
};

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw InternalServerError("JWT secret is not configured");
  }
  if (isProduction()) {
    const issue = productionJwtSecretIssue(secret);
    if (issue) {
      throw InternalServerError("JWT secret is not configured");
    }
  }
  return secret;
};

/** Comma-separated CORS origins. Production requires FRONTEND_URL (no localhost default). */
export const getCorsOrigins = (): string[] => {
  const raw = process.env.FRONTEND_URL?.trim();
  if (isProduction() && !raw) {
    throw new Error("FRONTEND_URL is required in production");
  }
  return (raw || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

/**
 * Paystack checkout return URL.
 * Prefer FRONTEND_VERIFY_PAYMENT_URL; otherwise first FRONTEND_URL origin + /payment/verify.
 * Avoids sending the literal string "undefined" when the dedicated variable is unset.
 */
export const getPaymentCallbackUrl = (): string => {
  const explicit = process.env.FRONTEND_VERIFY_PAYMENT_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const origin = getCorsOrigins()[0]?.replace(/\/$/, "");
  if (!origin) {
    throw InternalServerError("Payment callback URL is not configured");
  }
  return `${origin}/payment/verify`;
};

type TrustProxyApp = { set: (setting: string, value: unknown) => unknown };

/**
 * Reverse-proxy awareness for req.ip and express-rate-limit.
 * Production defaults to 1 hop (typical PaaS / nginx). Override with TRUST_PROXY.
 */
export const applyTrustProxy = (app: TrustProxyApp): void => {
  const raw = process.env.TRUST_PROXY?.trim();
  if (raw === "false" || raw === "0") {
    app.set("trust proxy", false);
    return;
  }
  if (raw === "true") {
    app.set("trust proxy", 1);
    return;
  }
  if (raw && /^\d+$/.test(raw)) {
    app.set("trust proxy", Number(raw));
    return;
  }
  if (raw) {
    app.set("trust proxy", raw);
    return;
  }
  if (isProduction()) {
    app.set("trust proxy", 1);
  }
};

/** HMAC pepper for OTPs. Optional OTP_PEPPER; otherwise JWT_SECRET. */
export const getOtpPepper = (): string => {
  const pepper = process.env.OTP_PEPPER?.trim();
  if (pepper) {
    return pepper;
  }
  return getJwtSecret();
};

export const JWT_SIGN_ALGORITHM = "HS256" as const;
export const JWT_VERIFY_ALGORITHMS = ["HS256"] as const;

/**
 * Production: Paystack live secret only.
 * Development: PAYSTACK_SECRET_KEY, else PAYSTACK_TEST_SECRET_KEY.
 */
export const getPaystackSecretKey = (): string => {
  if (isProduction()) {
    const live = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!live) {
      throw InternalServerError("Paystack secret key is not configured");
    }
    return live;
  }

  const key =
    process.env.PAYSTACK_SECRET_KEY?.trim() ||
    process.env.PAYSTACK_TEST_SECRET_KEY?.trim();

  if (!key) {
    throw InternalServerError("Paystack secret key is not configured");
  }

  return key;
};

/** Default on in non-production; production requires ENABLE_SWAGGER=true. */
export const isSwaggerEnabled = (): boolean => {
  const raw = process.env.ENABLE_SWAGGER?.trim().toLowerCase();
  if (raw === "true" || raw === "1") {
    return true;
  }
  if (raw === "false" || raw === "0") {
    return false;
  }
  return !isProduction();
};

/**
 * Fail process start when required secrets are missing.
 * Development keeps Paystack test-key fallback; production does not.
 */
export const assertRequiredSecrets = (): void => {
  const missing: string[] = [];

  if (!process.env.JWT_SECRET?.trim()) {
    missing.push("JWT_SECRET");
  }
  if (!process.env.MONGO_URI?.trim()) {
    missing.push("MONGO_URI");
  }

  if (isProduction()) {
    if (!process.env.PAYSTACK_SECRET_KEY?.trim()) {
      missing.push("PAYSTACK_SECRET_KEY");
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME?.trim()) {
      missing.push("CLOUDINARY_CLOUD_NAME");
    }
    if (!process.env.CLOUDINARY_API_KEY?.trim()) {
      missing.push("CLOUDINARY_API_KEY");
    }
    if (!process.env.CLOUDINARY_API_SECRET?.trim()) {
      missing.push("CLOUDINARY_API_SECRET");
    }
    if (!process.env.FRONTEND_URL?.trim()) {
      missing.push("FRONTEND_URL");
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (isProduction()) {
    const jwtIssue = productionJwtSecretIssue(process.env.JWT_SECRET!.trim());
    if (jwtIssue) {
      throw new Error(jwtIssue);
    }
  }
};
