import admin from 'firebase-admin';
import { serviceAccount } from '../config/firebase-service-account.js';

if (!admin.apps.length) {

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

export const messaging = admin.messaging();