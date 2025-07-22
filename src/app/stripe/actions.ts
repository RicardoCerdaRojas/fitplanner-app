
'use server';

import 'dotenv/config';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
    origin: string; // The URL origin from the client
}


// Gets or creates a Stripe customer ID and saves it to Firestore.
async function getOrCreateStripeCustomer(uid: string, email: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (userData?.stripeCustomerId) {
        console.log(`[Stripe Action] Found existing Stripe Customer ID for user ${uid}: ${userData.stripeCustomerId}`);
        return userData.stripeCustomerId;
    }

    console.log(`[Stripe Action] No Stripe Customer ID found for user ${uid}. Creating a new one.`);
    const customer = await stripe.customers.create({
        email: email,
        metadata: { firebaseUID: uid },
    });

    await updateDoc(userRef, { stripeCustomerId: customer.id });
    console.log(`[Stripe Action] Created new Stripe Customer and saved to Firestore. Customer ID: ${customer.id}`);
    return customer.id;
}


export async function createCheckoutSession({ plan, uid, origin }: CreateCheckoutSessionParams) {
  console.log(`[Stripe Action] STEP 1: Received request to create checkout session. Plan: ${plan}, UID: ${uid}`);
  if (!uid) {
    console.error('[Stripe Action] Error: You must be logged in to subscribe.');
    return { error: 'You must be logged in to subscribe.' };
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.error(`[Stripe Action] Error: User profile not found for UID: ${uid}.`);
    return { error: 'User profile not found.' };
  }
  const userData = userSnap.data();
  if (!userData.email) {
      console.error(`[Stripe Action] Error: User email is missing for UID: ${uid}.`);
      return { error: 'User email is missing.' };
  }

  try {
    const customerId = await getOrCreateStripeCustomer(uid, userData.email);
    console.log(`[Stripe Action] STEP 2: Using Stripe Customer ID: ${customerId}`);
    
    const priceId = priceIds[plan];
    if (!priceId) {
        console.error(`[Stripe Action] Error: Invalid plan selected. Price ID for ${plan} is missing.`);
        return { error: 'Invalid plan selected. Price ID is missing.' };
    }
    console.log(`[Stripe Action] STEP 3: Using Price ID: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/admin/subscription?from_checkout=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/admin/subscription`,
      metadata: {
        firebaseUID: uid, // Redundant for safety
      },
      subscription_data: {
        trial_from_plan: true,
        metadata: {
            firebaseUID: uid, 
        }
      }
    });

    console.log(`[Stripe Action] STEP 4: Successfully created Stripe Checkout Session: ${session.id}`);
    return { sessionId: session.id };
    
  } catch (error: any) {
    console.error('[Stripe Action] Stripe API Error:', error);
    return { error: error.message || 'Could not create checkout session.' };
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
