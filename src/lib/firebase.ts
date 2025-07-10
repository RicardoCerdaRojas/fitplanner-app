import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDatabase, ref, onValue, set, onDisconnect as onDbDisconnect } from "firebase/database";
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
 * @param {string} uid - The current user's ID.
 */
export const initializePresence = (uid: string) => {
    if (typeof window === 'undefined') return;
    const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`);

    const isOfflineForDatabase = {
        state: 'offline',
        last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
        state: 'online',
        last_changed: serverTimestamp(),
    };

    // Listen for connection status to the Realtime Database
    onValue(ref(rtdb, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) {
            return;
        }

        // When the client disconnects, set their status to 'offline'
        onDbDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            // Set the user's status to 'online' since they are currently connected.
            set(userStatusDatabaseRef, isOnlineForDatabase);
        });
    });
};


export { app, auth, db, storage, rtdb };
