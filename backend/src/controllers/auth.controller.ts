import asyncHandler from "../middlewares/async-handler.middleware.js";
import { successResponse, createdResponse } from "../utils/apiResponse.js";
import { AuthService } from "../services/auth.service.js";
import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  RequestOtpBody,
  ResetPasswordBody,
  VerifyOtpBody,
} from "../validations/auth.schema.js";

const register = asyncHandler(async (req, res) => {
  const data = await AuthService.register(req.body as RegisterBody);
  createdResponse(res, data, "OTP sent to email for verification");
});

const createUser = asyncHandler(async (req, res) => {
  const data = await AuthService.createUser(req.body as RegisterBody);
  createdResponse(res, data, "User created successfully");
});

const loginUser = asyncHandler(async (req, res) => {
  const data = await AuthService.login(req.body as LoginBody);
  successResponse(res, data, "Login successful");
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await AuthService.forgotPassword(req.body as ForgotPasswordBody);
  successResponse(res, {}, data.publicMessage);
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await AuthService.resetPassword(req.body as ResetPasswordBody);
  successResponse(res, data, "Password updated successfully");
});

const requestOtp = asyncHandler(async (req, res) => {
  const data = await AuthService.requestOtp(req.body as RequestOtpBody);
  successResponse(res, {}, data.publicMessage);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const data = await AuthService.verifyOtp(req.body as VerifyOtpBody);
  successResponse(res, data, "Email verified successfully");
});

export {
  register,
  createUser,
  forgotPassword,
  resetPassword,
  loginUser,
  requestOtp,
  verifyOtp,
};
