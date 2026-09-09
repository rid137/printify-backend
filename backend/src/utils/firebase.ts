import admin from "firebase-admin";
import { serviceAccount } from "../config/firebase-service-account.js";

let initAttempted = false;
let available = false;

const hasFirebaseCredentials = (): boolean =>
  Boolean(
    serviceAccount.project_id &&
      serviceAccount.client_email &&
      serviceAccount.private_key
  );

/**
 * Lazy FCM init. Missing/invalid Firebase config must not crash API boot.
 */
const ensureFirebase = (): boolean => {
  if (initAttempted) {
    return available;
  }
  initAttempted = true;

  if (!hasFirebaseCredentials()) {
    console.warn(
      "[firebase] FCM disabled: Firebase configuration is missing."
    );
    available = false;
    return false;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    available = admin.apps.length > 0;
  } catch {
    console.warn(
      "[firebase] FCM disabled: Firebase initialization failed."
    );
    available = false;
  }

  return available;
};

export const isFcmAvailable = (): boolean => ensureFirebase();

export const getMessaging = (): admin.messaging.Messaging => {
  if (!ensureFirebase()) {
    throw new Error("FCM_UNAVAILABLE");
  }
  return admin.messaging();
};
