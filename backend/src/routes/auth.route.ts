import express from "express";
import {
  forgotPassword,
  loginUser,
  register,
  requestOtp,
  resetPassword,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middlewares/rate-limit.middleware.js";
import {
  validateBody,
} from "../middlewares/validate.middleware.js";
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  requestOtpBodySchema,
  resetPasswordBodySchema,
  verifyOtpBodySchema,
} from "../validations/auth.schema.js";

const router = express.Router();

router.use(authRateLimiter);

router.post("/register", validateBody(registerBodySchema), register);
router.post("/request-otp", validateBody(requestOtpBodySchema), requestOtp);
router.post("/verify-otp", validateBody(verifyOtpBodySchema), verifyOtp);
router.post("/login", validateBody(loginBodySchema), loginUser);
router.post(
  "/forgot-password",
  validateBody(forgotPasswordBodySchema),
  forgotPassword
);
router.post(
  "/reset-password",
  validateBody(resetPasswordBodySchema),
  resetPassword
);

export default router;
