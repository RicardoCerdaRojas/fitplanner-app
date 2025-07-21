
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
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/create-gym');
      return;
    }
    
    setLoading(true);
    
    const stripe = await getStripe();
     if (!stripe) {
        toast({
            variant: 'destructive',
            title: 'Stripe Error',
            description: 'Stripe could not be initialized. Please check your configuration.',
        });
        setLoading(false);
        return;
    }
    
    const { sessionId, error, url } = await createCheckoutSession({ 
      plan, 
      uid: user.uid,
      origin: window.location.origin // Pass the client's origin URL
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

    if (url) {
        // This is our new path for sandboxed environments
        setRedirectUrl(url);
    } else if (sessionId) {
        // This is the standard path, which fails in the sandbox
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
        if (stripeError) {
            console.error("Stripe redirection error:", stripeError);
            toast({
                variant: 'destructive',
                title: 'Redirection Failed',
                description: 'Could not automatically redirect to Stripe. Please use the provided link.',
            });
            // As a fallback, construct the URL manually for the user to click.
            const checkoutUrl = new URL(stripe.jsUrl).origin;
            setRedirectUrl(`${checkoutUrl}/pay/${sessionId}`);
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
            'w-full text-lg',
            popular
                ? 'bg-emerald-400 text-black hover:bg-emerald-500 animate-pulse'
                : 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
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
          : 'bg-primary text-primary-foreground'
      )}
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading ? 'Redirigiendo...' : `Empezar con ${plan}`}
    </Button>
  );
}
