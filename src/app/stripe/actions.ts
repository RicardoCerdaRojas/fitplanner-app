
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
  if (!uid) {
    return { error: 'You must be logged in to subscribe.' };
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return { error: 'User profile not found.' };
  }

  const userData = userSnap.data();
  let stripeCustomerId = userData.stripeCustomerId;

  // Create a Stripe customer if one doesn't exist
  if (!stripeCustomerId) {
    try {
        const customer = await stripe.customers.create({
          email: userData.email!,
          name: userData.name,
          metadata: {
            firebaseUID: uid,
          },
        });
        stripeCustomerId = customer.id;
        await setDoc(userRef, { stripeCustomerId }, { merge: true });
    } catch(e) {
        console.error("Error creating stripe customer", e);
        return { error: 'Could not create customer in Stripe.' };
    }
  }

  const priceId = priceIds[plan];
  if (!priceId) {
      return { error: 'Invalid plan selected. Price ID is missing.' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
        metadata: {
            firebaseUID: uid,
            plan: plan
        }
      },
      success_url: `${appUrl}/`,
      cancel_url: `${appUrl}/`,
      metadata: {
          firebaseUID: uid,
          plan: plan
      }
    });

    return { sessionId: session.id };
  } catch (error: any) {
    console.error('Error creating Stripe session:', error);
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
