import { z } from "zod";
import { MAX_FCM_TOKEN_LENGTH } from "../utils/limits.js";

export const registerDeviceBodySchema = z.object({
  fcmToken: z
    .string()
    .trim()
    .min(1, "FCM token is required")
    .max(MAX_FCM_TOKEN_LENGTH, `FCM token must be at most ${MAX_FCM_TOKEN_LENGTH} characters`),
  platform: z.enum(["android", "ios", "web"]).optional(),
});

export type RegisterDeviceBody = z.infer<typeof registerDeviceBodySchema>;
