
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createCheckoutSession } from '@/app/stripe/actions';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
  if (!stripePromise) {
    const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      console.error("Stripe public key is not set. Please check your .env file.");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};


type SubscriptionButtonProps = {
  plan: 'TRAINER' | 'STUDIO' | 'GYM';
  popular?: boolean;
};

export function SubscriptionButton({ plan, popular = false }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/create-gym');
      return;
    }
    
    setLoading(true);
    
    // 1. Call server action to create checkout session
    const { sessionId, error } = await createCheckoutSession({ 
      plan, 
      uid: user.uid,
      origin: window.location.origin // Pass the dynamic origin
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error,
        });
        setLoading(false);
        return;
    }
    
    if (!sessionId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not retrieve a checkout session ID.',
        });
        setLoading(false);
        return;
    }

    // 2. Redirect to Stripe using Stripe.js
    const stripe = await getStripe();
    if (!stripe) {
        toast({
            variant: 'destructive',
            title: 'Stripe Error',
            description: 'Stripe.js could not be loaded.',
        });
        setLoading(false);
        return;
    }

    const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
    
    if (stripeError) {
        console.error("Stripe redirection error:", stripeError);
        toast({
            variant: 'destructive',
            title: 'Redirection Failed',
            description: stripeError.message || 'Could not redirect to Stripe.',
        });
        setLoading(false);
    }
    // If redirection is successful, the user will navigate away, so no need to setLoading(false).
  };
  
  return (
    <Button
      size="lg"
      className={cn(
        'w-full text-lg',
        popular
          ? 'bg-emerald-400 text-black hover:bg-emerald-500'
          : 'bg-primary text-primary-foreground'
      )}
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading ? 'Redirigiendo...' : `Empezar con ${plan}`}
    </Button>
  );
}
