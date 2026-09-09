import DeviceToken from '../models/device-token.model.js';
import { getMessaging, isFcmAvailable } from '../utils/firebase.js';
import { InternalServerError } from '../utils/error/httpErrors.js';

export class NotificationService {
    static async registerDevice(
        userId: unknown,
        input: { fcmToken: string; platform?: 'android' | 'ios' | 'web' }
    ) {
        const { fcmToken, platform } = input;
        const existing = await DeviceToken.findOne({ userId, token: fcmToken });

        if (existing) {
            return { alreadyRegistered: true as const };
        }

        await DeviceToken.create({
            userId,
            token: fcmToken,
            platform,
        });

        return { alreadyRegistered: false as const };
    }

    static async sendToDevice(deviceToken: string, payload: {
        title: string;
        body: string;
        icon: string;
        badge: string;
        data?: Record<string, string>;
    }) {
        
        const message = {
            token: deviceToken,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            webpush: {
                notification: {
                icon: payload.icon, 
                badge: payload.badge
                }
            },
            data: payload.data || {}
        };

        const response = await getMessaging().send(message);
        return response;
    }

    static async sendToUser(userId: string, payload: {
        title: string;
        body: string;
        icon: string;
        badge: string;
        data?: Record<string, string>;
    }) {
        if (!isFcmAvailable()) {
            console.warn(`FCM unavailable, skipping notification for user ${userId}`);
            return;
        }

        const tokens = await DeviceToken.find({userId});
        
        if (!tokens.length) {
            console.warn(`No FCM tokens found for user ${userId}, skipping notification.`);
            return; 
        }

        try {
            return await this.sendToDevice(tokens[0].token, payload);
        } catch {
            console.warn(`FCM send failed for user ${userId}`);
            return;
        }
    }

    static async sendTestNotification(userId: string) {
        if (!isFcmAvailable()) {
            throw InternalServerError("Push notifications are not available");
        }

        return this.sendToUser(userId, {
            title: 'Test Notification',
            body: 'This is a test notification from your Express server!',
            icon: "https://res.cloudinary.com/dnkhxafkz/image/upload/v1730950976/jcqwmzekkoejemeypfwc.png",
            badge: "https://res.cloudinary.com/dnkhxafkz/image/upload/v1730950976/jcqwmzekkoejemeypfwc.png"
        });
    }
}