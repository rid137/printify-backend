import DeviceToken from '../models/device-token.model.js';
import { messaging } from '../utils/firebase.js';

export class NotificationService {
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

        const response = await messaging.send(message);
        return response;
    }

    static async sendToUser(userId: string, payload: {
        title: string;
        body: string;
        icon: string;
        badge: string;
        data?: Record<string, string>;
    }) {
        const tokens = await DeviceToken.find({userId});
        
        if (!tokens.length) {
            console.warn(`No FCM tokens found for user ${userId}, skipping notification.`);
            return; 
        }

        return this.sendToDevice(tokens[0].token, payload);
    }
}