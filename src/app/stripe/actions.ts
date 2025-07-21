
'use server';

import 'dotenv/config';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Define your price IDs from your Stripe dashboard
const priceIds: { [key: string]: string } = {
    TRAINER: process.env.STRIPE_TRAINER_PRICE_ID || '',
    STUDIO: process.env.STRIPE_STUDIO_PRICE_ID || '',
    GYM: process.env.STRIPE_GYM_PRICE_ID || '',
};

type CreateCheckoutSessionParams = {
    plan: 'TRAINER' | 'STUDIO' | 'GYM';
    uid: string;
}

export async function createCheckoutSession({ plan, uid }: CreateCheckoutSessionParams) {
  console.log(`[Stripe Action] Initiating checkout for plan: ${plan}, UID: ${uid}`);

  if (!uid) {
    console.error('[Stripe Action] Error: UID is missing.');
    return { error: 'You must be logged in to subscribe.' };
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.error(`[Stripe Action] Error: User profile not found for UID: ${uid}.`);
    return { error: 'User profile not found.' };
  }
  const userData = userSnap.data();
  console.log('[Stripe Action] User data fetched from Firestore:', { email: userData.email, stripeCustomerId: userData.stripeCustomerId });


  const priceId = priceIds[plan];
  if (!priceId) {
      console.error(`[Stripe Action] Error: Price ID for plan "${plan}" is missing in environment variables.`);
      return { error: 'Invalid plan selected. Price ID is missing.' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/admin/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/admin/subscription`,
      subscription_data: {
        trial_from_plan: true,
        metadata: {
            firebaseUID: uid,
            plan: plan
        }
      },
      metadata: {
          firebaseUID: uid,
          plan: plan
      }
    };
    
    if (userData.stripeCustomerId) {
        sessionParams.customer = userData.stripeCustomerId;
    } else {
        sessionParams.customer_email = userData.email;
    }

    console.log('[Stripe Action] Creating Stripe session with params:', JSON.stringify(sessionParams, null, 2));

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[Stripe Action] Successfully created Stripe session with ID: ${session.id}`);
    return { sessionId: session.id };
    
  } catch (error: any) {
    console.error('[Stripe Action] Stripe API Error:', error);
    return { error: 'Could not create checkout session.' };
  }
}


export async function createCustomerPortalSession() {
    const user = auth.currentUser;

    if (!user) {
        return { error: "You must be logged in." };
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
        return { error: "User not found." };
    }
    
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;
    if (!stripeCustomerId) {
        return { error: "Stripe customer ID not found." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";
    
    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${appUrl}/admin/subscription`,
        });
        return { url: portalSession.url };
    } catch (error: any) {
        console.error("Error creating customer portal session: ", error);
        return { error: "Could not create customer portal session." };
    }
}
