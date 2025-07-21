
'use server';

import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function checkSubscriptionStatus(): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // This case should ideally not be hit if the user is on the processing page,
    // but it's good practice to handle it.
    console.error('[checkSubscriptionStatus] Error: No authenticated user found.');
    return false;
  }

  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const status = userData.stripeSubscriptionStatus;
      console.log(`[checkSubscriptionStatus] Checked for user ${currentUser.uid}. Status: ${status}`);
      // A user is considered subscribed if their status is active or they are in a trial period.
      return status === 'active' || status === 'trialing';
    } else {
      console.warn(`[checkSubscriptionStatus] No user document found for UID: ${currentUser.uid}`);
      return false;
    }
  } catch (error) {
    console.error('[checkSubscriptionStatus] Error fetching user document:', error);
    // Return false on error to prevent infinite loops on the client for server issues.
    return false;
  }
}
