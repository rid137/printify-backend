import asyncHandler from "../middlewares/async-handler.middleware.js";
import DeviceToken from "../models/device-token.model.js";
import { NotificationService } from "../services/notification.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { BadRequest } from "../utils/error/httpErrors.js";

const registerDevice = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { fcmToken, platform } = req.body;

    if (!fcmToken) {
        throw BadRequest("FCM token is required");
    }

    const existing = await DeviceToken.findOne({ userId, token: fcmToken });

    if (existing) {
        return successResponse(res, {}, "Device already registered");
    }

    await DeviceToken.create({
        userId,
        token: fcmToken,
        platform,
    });

    return successResponse(res, {}, "Device registered for notifications");
});

const sendTestNotification = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    await NotificationService.sendToUser(userId, {
        title: 'Test Notification',
        body: 'This is a test notification from your Express server!',
        icon: "https://res.cloudinary.com/dnkhxafkz/image/upload/v1730950976/jcqwmzekkoejemeypfwc.png",
        badge: "https://res.cloudinary.com/dnkhxafkz/image/upload/v1730950976/jcqwmzekkoejemeypfwc.png"
    });
    
    successResponse(res, {}, "Test notification sent");
});

export {
  registerDevice,
  sendTestNotification
};