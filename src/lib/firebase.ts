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
            return;
        }

        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            set(userStatusDatabaseRef, isOnlineForDatabase);
            
            // This is the key part for workout session cleanup.
            // When the user disconnects, this RTDB record will be created.
            // A Cloud Function should listen to this path and delete the corresponding
            // Firestore document `workoutSessions/{uid}`.
            const sessionCleanupRef = ref(rtdb, `/sessionsToClean/${uid}`);
            onDisconnect(sessionCleanupRef).set({
                firestoreSessionId: uid,
                timestamp: serverTimestamp()
            });

            // For a client-only solution, we must also handle manual cleanup.
            // This onDisconnect hook is primarily for backend cleanup via functions.
        });
    });
};


export { app, auth, db, storage, rtdb };
