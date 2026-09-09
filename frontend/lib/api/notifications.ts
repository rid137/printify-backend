import { apiRequest } from "./client";

export const notificationsApi = {
  registerDevice: (body: { fcmToken: string; platform?: "android" | "ios" | "web" }) =>
    apiRequest<Record<string, never>>("/api/notification/register-device", {
      method: "POST",
      body,
    }),

  sendTest: () =>
    apiRequest<Record<string, never>>("/api/notification/send-test", { method: "POST" }),
};
