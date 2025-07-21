
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      
      const firebaseUID = checkoutSession.metadata?.firebaseUID;
      const stripeCustomerId = typeof checkoutSession.customer === 'string' ? checkoutSession.customer : checkoutSession.customer?.id;
      const stripeSubscriptionId = typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : checkoutSession.subscription?.id;

      if (!firebaseUID || !stripeCustomerId || !stripeSubscriptionId) {
        console.error('Webhook Error: Missing required data from session on checkout.session.completed.');
        return NextResponse.json({ error: 'Missing required metadata or IDs.' }, { status: 400 });
      }

      // To get the subscription status, we must retrieve the subscription object from Stripe.
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // We immediately update the user with all the new Stripe info.
      const userRef = doc(db, 'users', firebaseUID);
      await updateDoc(userRef, {
        stripeCustomerId,
        stripeSubscriptionId,
        stripeSubscriptionStatus: subscription.status, // e.g., 'trialing' or 'active'
      });
      console.log(`✅ Checkout session completed for user ${firebaseUID}. Status: ${subscription.status}.`);
      break;
    }
    
    case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const firebaseUID = subscription.metadata?.firebaseUID;
        
        if (!firebaseUID) {
            console.error('Webhook Error: Missing firebaseUID from subscription metadata on update.');
            return NextResponse.json({ error: 'Missing firebaseUID metadata on subscription' });
        }
        
        const userRef = doc(db, 'users', firebaseUID);
        await updateDoc(userRef, {
            stripeSubscriptionStatus: subscription.status,
            stripeSubscriptionId: subscription.id,
        });
        console.log(`✅ Subscription status updated to ${subscription.status} for user ${firebaseUID}`);
        break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const firebaseUID = subscription.metadata?.firebaseUID;
      
      if (!firebaseUID) {
        console.error('Webhook Error: Missing firebaseUID from subscription metadata on delete.');
        return NextResponse.json({ error: 'Missing firebaseUID metadata' });
      }

      const userRef = doc(db, 'users', firebaseUID);
      await updateDoc(userRef, {
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: 'canceled', // or subscription.status which would be 'canceled'
      });
      console.log(`✅ Subscription canceled for user ${firebaseUID}`);
      break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
