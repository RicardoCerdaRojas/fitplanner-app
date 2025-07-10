import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app); // Realtime Database for presence

/**
 * Initializes the Firebase Realtime Database presence system for the current user.
 * This should be called once when the user authenticates.
 * It sets up a listener that, upon disconnection, will clean up any active workout session for that user.
 * @param {string} uid - The current user's ID.
 */
export const initializePresence = (uid: string) => {
    if (typeof window === 'undefined' || !uid) return;
    
    const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`);
    const workoutSessionRef = doc(db, 'workoutSessions', uid);

    const isOfflineForDatabase = {
        state: 'offline',
        last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
        state: 'online',
        last_changed: serverTimestamp(),
    };

    onValue(ref(rtdb, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) {
            // User is not connected, no need to set onDisconnect hooks.
            // Firestore Functions can handle cleanup if necessary as a fallback.
            return;
        }

        // When the user connects, set up the onDisconnect hooks.
        // These will execute when the client's connection is lost.
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            // After successfully setting the onDisconnect hook, update the user's status to online.
            set(userStatusDatabaseRef, isOnlineForDatabase);

            // Also set the workout session to be deleted on disconnect.
            // This is a "last-will-and-testament" operation.
            onDisconnect(ref(rtdb, `/sessionsToClean/${uid}`)).set({
                firestoreSessionId: uid,
                timestamp: serverTimestamp()
            });
            // This RTDB write on disconnect can trigger a Cloud Function to clean up the Firestore document.
            // For now, we'll try a more direct approach if supported, or rely on this for backend cleanup.
            // As a direct fallback for web, we can try to delete the doc.
            // Note: This might not always fire reliably, hence the Cloud Function recommendation.
            deleteDoc(workoutSessionRef);
        });
    });
};


export { app, auth, db, storage, rtdb };
