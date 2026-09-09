import { apiRequest } from "./client";
import type { User } from "./types";

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    apiRequest<User>("/api/auth/register", { method: "POST", body, auth: false }),

  login: (body: { email: string; password: string }) =>
    apiRequest<User>("/api/auth/login", { method: "POST", body, auth: false }),

  verifyOtp: (body: { email: string; code: string }) =>
    apiRequest<User>("/api/auth/verify-otp", { method: "POST", body, auth: false }),

  requestOtp: (body: { email: string }) =>
    apiRequest<Record<string, never>>("/api/auth/request-otp", {
      method: "POST",
      body,
      auth: false,
    }),

  forgotPassword: (body: { email: string }) =>
    apiRequest<Record<string, never>>("/api/auth/forgot-password", {
      method: "POST",
      body,
      auth: false,
    }),

  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    apiRequest<Record<string, never>>("/api/auth/reset-password", {
      method: "POST",
      body,
      auth: false,
    }),
};
