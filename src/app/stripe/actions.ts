'use server';

import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Define your price IDs from your Stripe dashboard
const priceIds: { [key: string]: string } = {
    TRAINER: process.env.STRIPE_TRAINER_PRICE_ID || 'price_1P...',
    STUDIO: process.env.STRIPE_STUDIO_PRICE_ID || 'price_1P...',
    GYM: process.env.STRIPE_GYM_PRICE_ID || 'price_1P...',
};

export async function createCheckoutSession(plan: 'TRAINER' | 'STUDIO' | 'GYM') {
  const user = auth.currentUser;
  
  if (!user) {
    return { error: 'You must be logged in to subscribe.' };
  }

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return { error: 'User profile not found.' };
  }

  const userData = userSnap.data();
  let stripeCustomerId = userData.stripeCustomerId;

  // Create a Stripe customer if one doesn't exist
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: userData.name,
      metadata: {
        firebaseUID: user.uid,
      },
    });
    stripeCustomerId = customer.id;
    await setDoc(userRef, { stripeCustomerId }, { merge: true });
  }

  const priceId = priceIds[plan];
  if (!priceId) {
      return { error: 'Invalid plan selected.' };
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
            firebaseUID: user.uid,
            plan: plan
        }
      },
      success_url: `${appUrl}/`,
      cancel_url: `${appUrl}/`,
      metadata: {
          firebaseUID: user.uid,
          plan: plan
      }
    });

    return { sessionId: session.id };
  } catch (error: any) {
    console.error('Error creating Stripe session:', error);
    return { error: 'Could not create checkout session.' };
  }
}
