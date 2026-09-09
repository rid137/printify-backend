/**
 * Phase 8.5A checks: Cloudinary public_id ownership, JWT verify options,
 * production secret predicates, and error sanitization.
 *
 * Does not connect to MongoDB, Cloudinary, or Paystack.
 *
 * Run: node --loader ts-node/esm src/scripts/verify-security.ts
 */
import jwt from "jsonwebtoken";
import {
  assertRequiredSecrets,
  getJwtSecret,
  getPaystackSecretKey,
  isProduction,
  isSwaggerEnabled,
  JWT_SIGN_ALGORITHM,
  JWT_VERIFY_ALGORITHMS,
} from "../config/secrets.js";
import { sanitizeForLog } from "../utils/error/getErrorMessage.js";
import {
  CLEANUP_CLOUDINARY_ON_ORDER_CREATE_FAILURE,
  canDestroyUploadedResource,
  isOwnedCloudinaryPublicId,
  toCanonicalCloudinaryPublicId,
} from "../utils/cloudinary-public-id.js";
import { calculateMultiItemPriceBodySchema } from "../validations/order.schema.js";
import createToken from "../utils/createToken.js";
import {
  OTP_MAX_ATTEMPTS,
  OTP_REQUEST_PUBLIC_MESSAGE,
  checkOtp,
  hashOtp,
  resolveLogin,
  resolveOtpEmailAction,
} from "../utils/otp.js";

let failed = 0;

const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("PASS:", msg);
  }
};

const USER_A = "507f1f77bcf86cd799439011";
const USER_B = "507f1f77bcf86cd799439012";
const UUID = "550e8400-e29b-41d4-a716-446655440000";
const ownedId = `${USER_A}_${UUID}`;

assert(
  isOwnedCloudinaryPublicId(USER_A, ownedId),
  "bare owned public_id is accepted"
);
assert(
  isOwnedCloudinaryPublicId(USER_A, `printing-app/${ownedId}`),
  "folder-prefixed owned public_id is accepted"
);
assert(
  !isOwnedCloudinaryPublicId(USER_B, `printing-app/${ownedId}`),
  "another user's public_id is rejected"
);
assert(
  !isOwnedCloudinaryPublicId(USER_A, "random-public-id"),
  "unrelated public_id is rejected"
);
assert(
  !isOwnedCloudinaryPublicId(USER_A, `other-folder/${ownedId}`),
  "public_id outside printing-app folder is rejected"
);
assert(
  toCanonicalCloudinaryPublicId(ownedId) === `printing-app/${ownedId}`,
  "canonical public_id uses printing-app folder"
);

const calcWithoutPublicId = calculateMultiItemPriceBodySchema.safeParse({
  items: [
    {
      file: { pages: 1 },
      printingOptions: {
        color: "black-white",
        sides: "single",
        paperType: "matte",
        paperSize: "A4",
        binding: "none",
        finishing: "none",
      },
      quantity: 1,
    },
  ],
});
assert(
  !calcWithoutPublicId.success,
  "authenticated calculate-price requires publicId (client pages are not enough)"
);

const withEnv = (patch: Record<string, string | undefined>, fn: () => void) => {
  const keys = Object.keys(patch);
  const previous: Record<string, string | undefined> = {};
  for (const key of keys) {
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
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

withEnv({ JWT_SECRET: "phase-8-5a-verify-secret" }, () => {
  const token = createToken(USER_A);
  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: [...JWT_VERIFY_ALGORITHMS],
  }) as jwt.JwtPayload;

  assert(decoded.userId === USER_A, "signed token verifies with HS256");
  assert(typeof decoded.exp === "number", "expiration is present on signed token");

  const header = JSON.parse(
    Buffer.from(token.split(".")[0], "base64url").toString()
  ) as { alg?: string };
  assert(header.alg === JWT_SIGN_ALGORITHM, "token header alg is HS256");

  const expired = jwt.sign(
    { userId: USER_A, exp: Math.floor(Date.now() / 1000) - 30 },
    getJwtSecret(),
    { algorithm: JWT_SIGN_ALGORITHM }
  );
  let expiredRejected = false;
  try {
    jwt.verify(expired, getJwtSecret(), {
      algorithms: [...JWT_VERIFY_ALGORITHMS],
    });
  } catch {
    expiredRejected = true;
  }
  assert(expiredRejected, "expired token is rejected");

  const [h, p, s] = token.split(".");
  const payload = JSON.parse(Buffer.from(p, "base64url").toString()) as {
    userId: string;
  };
  payload.userId = USER_B;
  const tampered = `${h}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${s}`;
  let tamperedRejected = false;
  try {
    jwt.verify(tampered, getJwtSecret(), {
      algorithms: [...JWT_VERIFY_ALGORITHMS],
    });
  } catch {
    tamperedRejected = true;
  }
  assert(tamperedRejected, "tampered token is rejected");

  const noneHeader = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");
  const nonePayload = Buffer.from(JSON.stringify({ userId: USER_A })).toString(
    "base64url"
  );
  const noneToken = `${noneHeader}.${nonePayload}.`;
  let noneRejected = false;
  try {
    jwt.verify(noneToken, getJwtSecret(), {
      algorithms: [...JWT_VERIFY_ALGORITHMS],
    });
  } catch {
    noneRejected = true;
  }
  assert(noneRejected, "alg=none token is rejected");

  let malformedRejected = false;
  try {
    jwt.verify("not.a.jwt", getJwtSecret(), {
      algorithms: [...JWT_VERIFY_ALGORITHMS],
    });
  } catch {
    malformedRejected = true;
  }
  assert(malformedRejected, "malformed token is rejected");
});

withEnv({ JWT_SECRET: undefined }, () => {
  let missingSecret = false;
  try {
    getJwtSecret();
  } catch {
    missingSecret = true;
  }
  assert(missingSecret, "missing JWT_SECRET fails safely");
});

withEnv(
  {
    NODE_ENV: "production",
    JWT_SECRET: "x",
    MONGO_URI: "mongodb://127.0.0.1:27017/printify",
    PAYSTACK_SECRET_KEY: undefined,
    PAYSTACK_TEST_SECRET_KEY: "sk_test_should_not_be_used_in_production",
    CLOUDINARY_CLOUD_NAME: "c",
    CLOUDINARY_API_KEY: "k",
    CLOUDINARY_API_SECRET: "s",
    ENABLE_SWAGGER: undefined,
  },
  () => {
    assert(isProduction(), "NODE_ENV=production is detected");
    let productionPaystackRejected = false;
    try {
      getPaystackSecretKey();
    } catch {
      productionPaystackRejected = true;
    }
    assert(
      productionPaystackRejected,
      "production does not fall back to PAYSTACK_TEST_SECRET_KEY"
    );

    let bootFailed = false;
    try {
      assertRequiredSecrets();
    } catch {
      bootFailed = true;
    }
    assert(bootFailed, "production boot fails without PAYSTACK_SECRET_KEY");
    assert(
      !isSwaggerEnabled(),
      "Swagger is disabled by default in production"
    );
  }
);

withEnv(
  {
    NODE_ENV: "development",
    PAYSTACK_SECRET_KEY: undefined,
    PAYSTACK_TEST_SECRET_KEY: "sk_test_dev_only",
    ENABLE_SWAGGER: undefined,
  },
  () => {
    assert(
      getPaystackSecretKey() === "sk_test_dev_only",
      "development may use PAYSTACK_TEST_SECRET_KEY fallback"
    );
    assert(isSwaggerEnabled(), "Swagger is enabled by default in development");
  }
);

withEnv(
  { NODE_ENV: "production", ENABLE_SWAGGER: "true" },
  () => {
    assert(
      isSwaggerEnabled(),
      "Swagger can be enabled in production with ENABLE_SWAGGER=true"
    );
  }
);

assert(
  sanitizeForLog("mongodb://user:secret@localhost:27017/db").includes("***"),
  "Mongo URIs are redacted in logs"
);
assert(
  !sanitizeForLog("Authorization: Bearer super-secret-token").includes(
    "super-secret-token"
  ),
  "Bearer tokens are redacted in logs"
);

const otpPepper = "verify-script-otp-pepper";
const otpHash = hashOtp("654321", otpPepper);
assert(otpHash !== "654321", "OTP hash is not plaintext");
assert(
  checkOtp(
    { codeHash: otpHash, expiresAt: new Date(Date.now() + 60_000), attempts: 0 },
    "654321",
    otpPepper
  ).ok,
  "valid OTP hash verifies"
);
assert(
  !checkOtp(
    { codeHash: otpHash, expiresAt: new Date(Date.now() - 1000), attempts: 0 },
    "654321",
    otpPepper
  ).ok,
  "expired OTP is rejected"
);
assert(
  !checkOtp(
    {
      codeHash: otpHash,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      consumedAt: new Date(),
    },
    "654321",
    otpPepper
  ).ok,
  "consumed OTP cannot be reused"
);
assert(
  !checkOtp(
    {
      codeHash: otpHash,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: OTP_MAX_ATTEMPTS,
    },
    "654321",
    otpPepper
  ).ok,
  "locked OTP is rejected after max attempts"
);
assert(
  resolveOtpEmailAction({ userFound: false, purpose: "reset_password" }) ===
    "skip",
  "unknown emails do not issue reset OTPs"
);
assert(
  resolveOtpEmailAction({
    userFound: true,
    purpose: "verify_email",
    isVerified: true,
  }) === "skip",
  "verified users do not get new verification OTPs"
);
assert(
  OTP_REQUEST_PUBLIC_MESSAGE.includes("If an account exists"),
  "recovery endpoints share an enumeration-safe public message"
);
assert(
  resolveLogin({
    userFound: true,
    passwordValid: true,
    isVerified: false,
  }) === "unverified",
  "unverified users cannot complete login"
);
assert(
  canDestroyUploadedResource(USER_B, ownedId, { returnedToClient: false }) ===
    false,
  "cannot destroy another user's Cloudinary id"
);
assert(
  CLEANUP_CLOUDINARY_ON_ORDER_CREATE_FAILURE === false,
  "order create does not delete previously uploaded Cloudinary files"
);

withEnv(
  {
    NODE_ENV: "production",
    JWT_SECRET: "change-me",
    MONGO_URI: "mongodb://127.0.0.1:27017/printify",
    PAYSTACK_SECRET_KEY: "sk_live_ok",
    CLOUDINARY_CLOUD_NAME: "c",
    CLOUDINARY_API_KEY: "k",
    CLOUDINARY_API_SECRET: "s",
    FRONTEND_URL: "https://app.example.com",
  },
  () => {
    let weakJwtFailed = false;
    try {
      assertRequiredSecrets();
    } catch {
      weakJwtFailed = true;
    }
    assert(weakJwtFailed, "production boot fails on a weak JWT_SECRET");
  }
);

withEnv(
  {
    NODE_ENV: "production",
    JWT_SECRET: "a".repeat(32),
    MONGO_URI: "mongodb://127.0.0.1:27017/printify",
    PAYSTACK_SECRET_KEY: "sk_live_ok",
    CLOUDINARY_CLOUD_NAME: "c",
    CLOUDINARY_API_KEY: "k",
    CLOUDINARY_API_SECRET: "s",
    FRONTEND_URL: undefined,
  },
  () => {
    let missingFrontend = false;
    try {
      assertRequiredSecrets();
    } catch {
      missingFrontend = true;
    }
    assert(missingFrontend, "production boot fails without FRONTEND_URL");
  }
);

process.exit(failed === 0 ? 0 : 1);
