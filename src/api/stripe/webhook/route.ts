
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
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  
  console.log(`[Webhook] STEP 5: ✅ Webhook received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      
      const firebaseUID = checkoutSession.metadata?.firebaseUID;
      if (!firebaseUID) {
        console.error('❌ [Webhook] Error: Missing firebaseUID from session on checkout.session.completed.');
        return NextResponse.json({ error: 'Missing required metadata or IDs.' }, { status: 400 });
      }

      const stripeSubscriptionId = typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : checkoutSession.subscription?.id;
      if (!stripeSubscriptionId) {
        console.error('❌ [Webhook] Error: Missing subscription ID from session on checkout.session.completed.');
        return NextResponse.json({ error: 'Missing subscription ID.' }, { status: 400 });
      }

      try {
        // To get the most up-to-date status, we retrieve the subscription object from Stripe.
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const userRef = doc(db, 'users', firebaseUID);
        const dataToUpdate = {
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripeSubscriptionStatus: subscription.status, // e.g., 'trialing' or 'active'
        };

        console.log(`[Webhook] STEP 6: Updating user from checkout.session.completed for UID: ${firebaseUID}`);
        console.log("[Webhook] Data to update:", dataToUpdate);
        await updateDoc(userRef, dataToUpdate);
        console.log(`[Webhook] ✅ Checkout session completed for user ${firebaseUID}. Status set to: ${subscription.status}.`);

      } catch (error) {
          console.error(`❌ [Webhook] Error handling checkout.session.completed for UID ${firebaseUID}:`, error);
          return NextResponse.json({ error: 'Failed to process checkout completion.' }, { status: 500 });
      }
      break;
    }
    
    case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const firebaseUID = subscription.metadata?.firebaseUID;
        if (!firebaseUID) {
            console.error('❌ [Webhook] Error: Missing firebaseUID from subscription metadata on update.');
            return NextResponse.json({ error: 'Missing firebaseUID metadata on subscription' });
        }
        
        const userRef = doc(db, 'users', firebaseUID);
        const dataToUpdate = {
            stripeSubscriptionStatus: subscription.status,
            stripeSubscriptionId: subscription.id,
        };
        console.log(`[Webhook] STEP 6 (or update): Updating user from customer.subscription.updated for UID: ${firebaseUID}`);
        console.log("[Webhook] Data to update:", dataToUpdate);
        await updateDoc(userRef, dataToUpdate);
        console.log(`[Webhook] ✅ Subscription status updated to ${subscription.status} for user ${firebaseUID}`);
        break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const firebaseUID = subscription.metadata?.firebaseUID;
      
      if (!firebaseUID) {
        console.error('❌ [Webhook] Error: Missing firebaseUID from subscription metadata on delete.');
        return NextResponse.json({ error: 'Missing firebaseUID metadata' });
      }

      const userRef = doc(db, 'users', firebaseUID);
      const dataToUpdate = {
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: 'canceled', // or subscription.status which would be 'canceled'
      };
      console.log(`[Webhook] Canceling subscription for user: ${firebaseUID}`);
      console.log("[Webhook] Data to update:", dataToUpdate);
      await updateDoc(userRef, dataToUpdate);
      console.log(`[Webhook] ✅ Subscription canceled for user ${firebaseUID}`);
      break;
    }
    
    default:
      console.log(`[Webhook] - Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
