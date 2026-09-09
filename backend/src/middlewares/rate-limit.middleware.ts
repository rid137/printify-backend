import type { NextFunction, Request, Response } from "express";
import rateLimit, { type Options } from "express-rate-limit";

const rateLimited = (
  req: Request,
  res: Response,
  _next: NextFunction,
  options: Options
) => {
  const fallback = "Too many requests, please try again later.";
  const message =
    typeof options.message === "string" && options.message.trim()
      ? options.message
      : fallback;

  res.status(options.statusCode || 429).json({
    error: {
      message,
      statusCode: 429,
      code: "ERR_RATE_LIMIT",
    },
  });
};

/** Baseline limit for all API traffic. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
  handler: rateLimited,
});

/** Stricter limit for authentication endpoints (login, register, OTP, password reset). */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts, please try again later.",
  handler: rateLimited,
});

/**
 * Dedicated webhook limiter (not the authenticated API limiter).
 * Generous enough for Paystack retries; HMAC verification remains mandatory.
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many webhook requests, please try again later.",
  handler: rateLimited,
});
