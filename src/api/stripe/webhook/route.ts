
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// This config is essential for Stripe webhooks to work correctly with Next.js.
// It disables the default body parser so we can receive the raw request body for signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to read the raw request body as a buffer.
async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}


export async function POST(req: NextRequest) {
  const buf = await buffer(req.body as any);
  const sig = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log(`[Webhook] ✅ Webhook event received and verified: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ [Webhook] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const firebaseUID = session.metadata?.firebaseUID;
      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

      if (!firebaseUID || !stripeCustomerId) {
        console.error(`❌ [Webhook] Error: Missing firebaseUID or customerId from session on checkout.session.completed.`);
        return NextResponse.json({ error: 'Missing required metadata or IDs.' }, { status: 400 });
      }

      // At this point, the subscription might still be being created.
      // The most reliable approach is to listen for `customer.subscription.updated`
      // to get the final subscription status. Here, we just store the customer ID.
      try {
        const userRef = doc(db, 'users', firebaseUID);
        await updateDoc(userRef, { stripeCustomerId });
        console.log(`[Webhook] ✅ Stored Stripe Customer ID: ${stripeCustomerId} for user ${firebaseUID}`);
      } catch (error) {
        console.error(`❌ [Webhook] Error updating user with customer ID for UID ${firebaseUID}:`, error);
        return NextResponse.json({ error: 'Failed to update user with customer ID.' }, { status: 500 });
      }
      break;
    }
    
    case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const firebaseUID = subscription.metadata?.firebaseUID;
        if (!firebaseUID) {
            console.error('❌ [Webhook] Error: Missing firebaseUID from subscription metadata on update.');
            return NextResponse.json({ error: 'Missing firebaseUID metadata on subscription' }, { status: 400 });
        }
        
        const userRef = doc(db, 'users', firebaseUID);
        const dataToUpdate = {
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status, // e.g., 'trialing', 'active', 'past_due', 'canceled'
        };
        console.log(`[Webhook] Updating subscription status for UID: ${firebaseUID} to "${subscription.status}"`);
        await updateDoc(userRef, dataToUpdate);
        console.log(`[Webhook] ✅ Subscription status updated to ${subscription.status} for user ${firebaseUID}`);
        break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const firebaseUID = subscription.metadata?.firebaseUID;
      
      if (!firebaseUID) {
        console.error('❌ [Webhook] Error: Missing firebaseUID from subscription metadata on delete.');
        return NextResponse.json({ error: 'Missing firebaseUID metadata' }, { status: 400 });
      }

      const userRef = doc(db, 'users', firebaseUID);
      const dataToUpdate = {
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: 'canceled',
      };
       console.log(`[Webhook] Canceling subscription for user: ${firebaseUID}`);
      await updateDoc(userRef, dataToUpdate);
      console.log(`[Webhook] ✅ Subscription canceled for user ${firebaseUID}`);
      break;
    }
    
    default:
      console.log(`[Webhook] - Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
