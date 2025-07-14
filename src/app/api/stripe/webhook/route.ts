import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
      const session = event.data.object as Stripe.Checkout.Session;
      
      const firebaseUID = session.metadata?.firebaseUID;
      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      if (!firebaseUID || !stripeCustomerId || !stripeSubscriptionId) {
        console.error('Webhook Error: Missing metadata from session.');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const userRef = doc(db, 'users', firebaseUID);
      await updateDoc(userRef, {
        stripeCustomerId,
        stripeSubscriptionId,
        stripeSubscriptionStatus: 'active',
      });
      console.log(`✅ Subscription created for user ${firebaseUID}`);
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const firebaseUID = subscription.metadata?.firebaseUID;
      
      if (!firebaseUID) {
        console.error('Webhook Error: Missing firebaseUID from subscription metadata.');
        return NextResponse.json({ error: 'Missing firebaseUID metadata' }, { status: 400 });
      }

      const userRef = doc(db, 'users', firebaseUID);
      await updateDoc(userRef, {
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: 'canceled',
      });
      console.log(`✅ Subscription canceled for user ${firebaseUID}`);
      break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
