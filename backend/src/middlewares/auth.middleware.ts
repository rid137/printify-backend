import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import User from "../models/user.model.js";
import asyncHandler, { AuthenticatedRequest } from "./async-handler.middleware.js";
import mongoose from "mongoose";
import { Forbidden, Unauthorized } from "../utils/error/httpErrors.js";
import CustomError from "../utils/error/customError.js";
import { getJwtSecret, JWT_VERIFY_ALGORITHMS } from "../config/secrets.js";

interface DecodedToken {
  userId: mongoose.Types.ObjectId;
}

const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw Unauthorized("Not authorized, no token.");
    }

    let decoded: DecodedToken;

    try {
      const payload = jwt.verify(token, getJwtSecret(), {
        algorithms: [...JWT_VERIFY_ALGORITHMS],
      });

      if (
        typeof payload === "string" ||
        !payload ||
        typeof payload !== "object" ||
        !("userId" in payload) ||
        payload.userId == null ||
        payload.userId === ""
      ) {
        throw Unauthorized("Not authorized, token failed.");
      }

      decoded = payload as DecodedToken;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw Unauthorized("Not authorized, token failed.");
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      throw Unauthorized("Not authorized, user not found.");
    }

    if (!user.isVerified) {
      throw Forbidden("Email verification required.");
    }

    req.user = user;
    next();
  }
);

const authorizeAdmin = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (req.user && req.user.role === "admin") {
      next();
      return;
    }

    throw Forbidden("Not authorized as an admin.");
  }
);

export { authenticate, authorizeAdmin };
