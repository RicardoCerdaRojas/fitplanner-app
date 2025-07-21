
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function checkSubscriptionStatus(uid: string): Promise<boolean> {
  if (!uid) {
    console.error('[Action] checkSubscriptionStatus Error: No UID provided.');
    return false;
  }
  
  console.log(`[Action] STEP 7: Polling for subscription status for UID: ${uid}`);

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const status = userData.stripeSubscriptionStatus;
      console.log(`[Action] Found user. Status in DB: ${status}`);
      // A user is considered subscribed if their status is active or they are in a trial period.
      const isSubscribed = status === 'active' || status === 'trialing';

      if(isSubscribed) {
          console.log("[Action] ✅ User is subscribed, returning true.");
      } else {
          console.log("[Action] ⏳ User not subscribed yet, returning false.");
      }

      return isSubscribed;
    } else {
      console.warn(`[Action] No user document found for UID: ${uid}`);
      return false;
    }
  } catch (error) {
    console.error('[Action] Error fetching user document:', error);
    // Return false on error to prevent infinite loops on the client for server issues.
    return false;
  }
}
