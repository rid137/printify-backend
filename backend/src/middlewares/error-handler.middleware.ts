import { NextFunction, Request, Response } from "express";
import CustomError from "../utils/error/customError.js";
import { getErrorMessage } from "../utils/error/getErrorMessage.js";

export default function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  console.error("[error]", getErrorMessage(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }

  res.status(500).json({
    error: {
      message: "An unexpected error occurred",
      statusCode: 500,
      code: "ERR_INTERNAL",
    },
  });
}
