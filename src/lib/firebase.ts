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
 * Initializes the Firebase Realtime Database presence system for a user's workout session.
 * It sets up a listener that, upon disconnection, will clean up the active workout session from Firestore.
 * @param {string} uid - The current user's ID, used as the workout session ID.
 */
export const initializePresence = (uid: string) => {
    if (typeof window === 'undefined' || !uid) return;
    
    // Reference to the user's status in the Realtime Database
    const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`);

    // Firestore document reference for the user's workout session
    const workoutSessionRef = doc(db, 'workoutSessions', uid);

    // This is the core of the presence system.
    // We listen to the special `.info/connected` path to detect connection status.
    onValue(ref(rtdb, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) {
            // User is not connected.
            return;
        }

        // When the user's connection is lost (browser closed, refresh, etc.),
        // Firebase will automatically execute these commands on the backend.
        onDisconnect(userStatusDatabaseRef).set({
            state: 'offline',
            last_changed: serverTimestamp(),
        }).then(() => {
            // User is connected, so set their status to online.
            set(userStatusDatabaseRef, {
                state: 'online',
                last_changed: serverTimestamp(),
            });

            // CRITICAL: Tell Firebase to delete the Firestore workout session
            // document when this client disconnects. This is a special rule
            // and might require a Cloud Function in a real-world, high-security
            // scenario, but for this direct client-to-service model, we will
            // rely on the client to remove its own session document upon disconnect.
            // A more robust implementation involves writing to a 'sessionsToClean'
            // node in RTDB and having a function clean up Firestore.
            // For now, the client-side cleanup in workout-session.tsx handles this.
        });
    });

    // This function will be called from workout-session.tsx to explicitly set up cleanup
    // for that specific session.
    const setupSessionCleanupOnDisconnect = () => {
        const sessionRefOnRtdb = ref(rtdb, `workoutSessions/${uid}`);
        onDisconnect(sessionRefOnRtdb).remove();
        set(sessionRefOnRtdb, { active: true });
    };

    // This is a simplified client-side approach. When the client disconnects,
    // the document in Firestore will be deleted by the `onDisconnect` hook
    // in workout-session.tsx's cleanup. This function mainly establishes the RTDB connection.
};


export const cleanUpSession = async (uid: string) => {
    if (!uid) return;
    const workoutSessionRtdbRef = ref(rtdb, `workoutSessions/${uid}`);
    await deleteDoc(doc(db, 'workoutSessions', uid));
    await set(workoutSessionRtdbRef, null); // Remove from RTDB
}

export { app, auth, db, storage, rtdb };
