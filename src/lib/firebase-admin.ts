const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
