import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, DocumentReference, deleteDoc } from "firebase/firestore";
import { getDatabase, ref, onValue, set, onDisconnect as onDbDisconnect, serverTimestamp } from "firebase/database";
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
 * @param {DocumentReference | null} workoutSessionRef - Optional reference to a workout session document to clean up on disconnect.
 */
export const initializePresence = (uid: string, workoutSessionRef: DocumentReference | null = null) => {
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
            // If the client is not connected, ensure any workout session is cleaned up on the Firestore side as a fallback.
            if (workoutSessionRef) {
                deleteDoc(workoutSessionRef);
            }
            return;
        }

        const onDisconnectRef = onDbDisconnect(userStatusDatabaseRef);
        onDisconnectRef.set(isOfflineForDatabase).then(() => {
            set(userStatusDatabaseRef, isOnlineForDatabase);
             // If a workout session is active, set it to be deleted on disconnect.
            if (workoutSessionRef) {
                const sessionOnDisconnectRef = onDbDisconnect(ref(rtdb, `/sessions/${uid}`));
                sessionOnDisconnectRef.remove(); // This is a placeholder write to trigger the Cloud Function
            }
        });
    });
};


export { app, auth, db, storage, rtdb };
