import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import { BadRequest } from "../utils/error/httpErrors.js";

type RequestTarget = "body" | "query" | "params";

const formatZodDetails = (error: ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));

const createValidationError = (error: ZodError) => {
  const details = formatZodDetails(error);
  const message =
    details.length === 1
      ? details[0].message
      : `Validation failed: ${details.map((d) => d.message).join("; ")}`;

  return BadRequest(message, details);
};

/**
 * Express 5 exposes `req.query` as a getter-only property (lazy query parsing).
 * `req.query = parsed` throws:
 *   TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
 * Redefine the property so controllers can keep reading `req.query` / `req.params`.
 */
const applyValidated = (req: Request, target: RequestTarget, data: unknown): void => {
  if (target === "body") {
    req.body = data;
    return;
  }

  Object.defineProperty(req, target, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: data,
  });
};

const validate =
  (target: RequestTarget, schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(createValidationError(result.error));
      return;
    }

    applyValidated(req, target, result.data);
    next();
  };

export const validateBody = (schema: ZodType) => validate("body", schema);
export const validateQuery = (schema: ZodType) => validate("query", schema);
export const validateParams = (schema: ZodType) => validate("params", schema);
