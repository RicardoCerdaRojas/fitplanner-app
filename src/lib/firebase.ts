
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getApps as getAdminApps, getApp as getAdminApp, initializeApp as initializeAdminApp, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// --- Client-side Firebase Initialization ---

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for the client (browser)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Server-side Firebase Admin Initialization ---

let adminDb: ReturnType<typeof getAdminFirestore>;

// Check if we are on the server-side
if (typeof window === 'undefined') {
  // The service account credentials are automatically provided by the App Hosting environment.
  // When running locally, it falls back to the service account key file if you've set it up.
  const adminOptions = {
    // projectId is read from the environment variables in production
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  // Initialize the Admin App if it hasn't been already
  const adminApp = !getAdminApps().length ? initializeAdminApp(adminOptions) : getAdminApp();
  adminDb = getAdminFirestore(adminApp);
}

// Exporting a clearly named admin database instance for server-side code
// Note: We are now exporting 'adminDb' which might require changes in server actions
// to use this instead of the client 'db'. Let's check actions.ts next.
// For now, let's keep the client exports for client-side code.
export { app, auth, db, storage, adminDb };
