
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function checkSubscriptionStatus(uid: string): Promise<boolean> {
  if (!uid) {
    console.error('[checkSubscriptionStatus] Error: No UID provided.');
    return false;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const status = userData.stripeSubscriptionStatus;
      // A user is considered subscribed if their status is active or they are in a trial period.
      const isSubscribed = status === 'active' || status === 'trialing';
      return isSubscribed;
    } else {
      console.warn(`[checkSubscriptionStatus] No user document found for UID: ${uid}`);
      return false;
    }
  } catch (error) {
    console.error('[checkSubscriptionStatus] Error fetching user document:', error);
    // Return false on error to prevent infinite loops on the client for server issues.
    return false;
  }
}
