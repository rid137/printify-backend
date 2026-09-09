import asyncHandler from "../middlewares/async-handler.middleware.js";
import { NotificationService } from "../services/notification.service.js";
import { successResponse } from "../utils/apiResponse.js";
import type { RegisterDeviceBody } from "../validations/notification.schema.js";

const registerDevice = asyncHandler(async (req, res) => {
  const result = await NotificationService.registerDevice(
    req.user._id,
    req.body as RegisterDeviceBody
  );

  if (result.alreadyRegistered) {
    return successResponse(res, {}, "Device already registered");
  }

  return successResponse(res, {}, "Device registered for notifications");
});

const sendTestNotification = asyncHandler(async (req, res) => {
  await NotificationService.sendTestNotification(String(req.user._id));
  successResponse(res, {}, "Test notification sent");
});

export { registerDevice, sendTestNotification };
