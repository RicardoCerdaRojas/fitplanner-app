
// src/lib/firebase/admin.ts
import { getApps as getAdminApps, getApp as getAdminApp, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

let adminDb: ReturnType<typeof getAdminFirestore>;

// This check prevents re-initialization in hot-reload environments
if (!getAdminApps().length) {
  initializeAdminApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

adminDb = getAdminFirestore();

export { adminDb };
