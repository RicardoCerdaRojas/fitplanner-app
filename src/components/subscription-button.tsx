
'use client';

// This file has been removed as part of the Stripe integration cleanup.

import { Button } from "./ui/button";

export function SubscriptionButton({ plan, popular }: { plan: string, popular?: boolean }) {
    return (
        <Button size="lg" className="w-full" disabled>
            Subscription Unavailable
        </Button>
    )
}
