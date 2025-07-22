
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
    TRAINER: process.env.NEXT_PUBLIC_STRIPE_TRAINER_PRICE_ID || '',
    STUDIO: process.env.NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID || '',
    GYM: process.env.NEXT_PUBLIC_STRIPE_GYM_PRICE_ID || '',
};
const fitPlannerProductId = process.env.STRIPE_FITPLANNER_PRODUCT_ID || '';


type CreateCheckoutSessionParams = {
    plan: 'TRAINER' | 'STUDIO' | 'GYM';
    uid: string;
    origin: string; // The URL origin from the client
}


// Gets or creates a Stripe customer ID and saves it to Firestore.
// This version is enhanced to be more robust.
async function getOrCreateStripeCustomer(uid: string, email: string): Promise<string> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error(`User with UID ${uid} not found in Firestore.`);
    }

    const userData = userSnap.data();

    // If the Stripe Customer ID already exists on the document, return it.
    if (userData?.stripeCustomerId) {
        // As an extra check, let's ensure the customer exists in Stripe to prevent issues with deleted test data
        try {
            const customer = await stripe.customers.retrieve(userData.stripeCustomerId);
            if (customer && !customer.deleted) {
                console.log(`[Stripe Action] Found existing Stripe Customer ID for user ${uid}: ${userData.stripeCustomerId}`);
                return userData.stripeCustomerId;
            }
        } catch (error) {
            console.warn(`[Stripe Action] Customer ID ${userData.stripeCustomerId} not found in Stripe. Will create a new one.`);
        }
    }

    // If not, create a new customer in Stripe.
    console.log(`[Stripe Action] No Stripe Customer ID found for user ${uid}. Creating a new one.`);
    const customer = await stripe.customers.create({
        email: email,
        name: userData.name, // Add name for better customer recognition in Stripe
        metadata: { firebaseUID: uid },
    });

    // IMPORTANT: Save the new customer ID to Firestore immediately.
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
      success_url: `${origin}/admin/subscription?session_id={CHECKOUT_SESSION_ID}&from_checkout=true`,
      cancel_url: `${origin}/admin/subscription`,
      metadata: {
        firebaseUID: uid,
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


export async function createCustomerPortalSession(uid: string) {
    if (!uid) {
        return { error: "You must be logged in." };
    }

    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        return { error: "User not found." };
    }
    
    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;
    const stripeSubscriptionId = userData?.stripeSubscriptionId;

    if (!stripeCustomerId) {
        return { error: "Stripe customer ID not found." };
    }
     if (!stripeSubscriptionId) {
        return { error: "Stripe subscription ID not found." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";
    
    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${appUrl}/admin/subscription`,
            flow_data: {
                type: 'subscription_update',
                subscription_update: {
                    subscription: stripeSubscriptionId,
                },
            },
        });
        return { url: portalSession.url };
    } catch (error: any) {
        console.error("Error creating customer portal session: ", error);
        return { error: "Could not create customer portal session." };
    }
}
