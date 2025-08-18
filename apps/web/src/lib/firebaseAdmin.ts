import 'server-only';
import * as admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  // On Firebase Hosting/Functions, credentials are auto-provided
  app = admin.initializeApp();
} else {
  app = admin.app();
}

export const adminDb = app.firestore();
