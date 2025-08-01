
'use client';

// This file has been cleared as part of the Stripe integration cleanup.
// It can be repurposed for a new subscription system in the future.

import { AppHeader } from '@/components/app-header';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function SubscriptionPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-28 md:pb-8">
                 <div className="w-full max-w-2xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                    <AdminBottomNav />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard /> Subscription</CardTitle>
                            <CardDescription>No subscription provider is currently configured.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Please contact support to enable a subscription plan.
                            </p>
                        </CardContent>
                    </Card>
                 </div>
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fit Planner. All rights reserved.</p>
            </footer>
        </div>
    );
}
