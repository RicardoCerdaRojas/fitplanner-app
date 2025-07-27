
'use client';

// This file has been cleared as part of the Stripe integration cleanup.
// It can be repurposed for a new subscription system in the future.

import { Button } from "./ui/button";

export function SubscriptionButton({ plan, popular }: { plan: string, popular?: boolean }) {
    return (
        <Button size="lg" className="w-full" disabled>
            Subscription Unavailable
        </Button>
    )
}
