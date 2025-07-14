'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createCheckoutSession } from '@/app/stripe/actions';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

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
      router.push('/signup');
      return;
    }
    
    setLoading(true);
    
    const { sessionId, error } = await createCheckoutSession({ plan, uid: user.uid });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error,
        });
        setLoading(false);
        return;
    }

    if (sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
            await stripe.redirectToCheckout({ sessionId });
        }
    }
    
    setLoading(false);
  };

  return (
    <Button
      size="lg"
      className={cn(
        'w-full text-lg',
        popular
          ? 'bg-emerald-400 text-black hover:bg-emerald-500'
          : 'bg-gray-700 text-white hover:bg-gray-600'
      )}
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading ? 'Redirigiendo...' : `Empezar con ${plan}`}
    </Button>
  );
}
