'use server';

import 'server-only';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});


export async function checkSubscriptionStatus(uid: string): Promise<boolean> {
  if (!uid) {
    console.error('[Action] checkSubscriptionStatus Error: No UID provided.');
    return false;
  }

  console.log(`[Action] Polling for subscription status for UID: ${uid}`);

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const status = userData.stripeSubscriptionStatus;
      console.log(`[Action] Found user. Status in DB: ${status}`);
      // A user is considered subscribed if their status is 'active' OR they are in a 'trialing' period.
      const isSubscribed = status === 'active' || status === 'trialing';

      if (isSubscribed) {
        console.log('[Action] ✅ User is subscribed, returning true.');
      } else {
        console.log('[Action] ⏳ User not subscribed yet, returning false.');
      }

      return isSubscribed;
    } else {
      console.warn(`[Action] No user document found for UID: ${uid}`);
      return false;
    }
  } catch (error) {
    console.error('[Action] Error fetching user document:', error);
    return false;
  }
}

export async function confirmSubscription(sessionId: string, uid: string) {
    if (!sessionId || !uid) {
        return { error: "Session ID and User ID are required." };
    }

    try {
        console.log(`[Action] Confirming subscription for session: ${sessionId}`);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.status !== 'complete') {
            return { error: "Checkout session is not complete." };
        }

        if (!session.subscription) {
            return { error: "No subscription found for this session." };
        }

        const subscription = await stripe.subscriptions.retrieve(
            typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id
        );

        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status, // This will be 'trialing' or 'active'
            stripeCustomerId: typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id,
        });

        console.log(`[Action] ✅ Successfully confirmed subscription for UID ${uid}. Status: ${subscription.status}`);
        return { success: true, status: subscription.status };

    } catch (error: any) {
        console.error("[Action] Error confirming subscription:", error);
        return { error: error.message };
    }
}
