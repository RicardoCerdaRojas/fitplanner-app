
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createCheckoutSession } from '@/app/stripe/actions';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';

let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
  if (!stripePromise) {
    const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      console.error("Stripe public key is not set. Please check your .env file.");
      return null;
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
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/signup');
      return;
    }
    
    setLoading(true);
    
    const { sessionId, error, url } = await createCheckoutSession({ plan, uid: user.uid });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error,
        });
        setLoading(false);
        return;
    }

    if (url) {
        setRedirectUrl(url);
    } else if (sessionId) {
        const stripe = await getStripe();
        if (stripe) {
            const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
            if (stripeError) {
                // This will likely be caught by the sandbox policy, but handle it just in case
                console.error("Stripe redirection error:", stripeError);
                toast({
                    variant: 'destructive',
                    title: 'Redirection Failed',
                    description: 'Could not automatically redirect to Stripe. Please use the provided link.',
                });
                // Construct the URL manually as a fallback
                setRedirectUrl(`https://checkout.stripe.com/pay/${sessionId}`);
            }
        } else {
             toast({
                variant: 'destructive',
                title: 'Stripe Error',
                description: 'Stripe could not be initialized. Please check your configuration.',
            });
        }
    }
    
    setLoading(false);
  };
  
  if (redirectUrl) {
    return (
      <Button
        size="lg"
        asChild
        className={cn(
            'w-full text-lg bg-green-500 hover:bg-green-600 text-white',
        )}
      >
        <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
          Proceed to Checkout <ArrowRight className="ml-2" />
        </a>
      </Button>
    )
  }

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
