
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, XCircle, Calendar, Sparkles } from 'lucide-react';
import { createCustomerPortalSession } from '@/app/stripe/actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { SubscriptionButton } from '@/components/subscription-button';
import { differenceInCalendarDays, format } from 'date-fns';

export default function SubscriptionPage() {
    const { toast } = useToast();
    const { activeMembership, gymProfile, userProfile, loading, isTrialActive } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    useEffect(() => {
        if (!loading && (!activeMembership || activeMembership.role !== 'gym-admin')) {
            router.push('/');
        }
    }, [loading, activeMembership, router]);

    const handleManageSubscription = async () => {
        setIsRedirecting(true);
        const { url, error } = await createCustomerPortalSession();

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
            setIsRedirecting(false);
            return;
        }

        if (url) {
            router.push(url);
        } else {
            setIsRedirecting(false);
        }
    };
    
    if (loading || !activeMembership || activeMembership.role !== 'gym-admin') {
        return (
            <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-6xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                 <p className='mt-8 text-lg text-muted-foreground'>Loading subscription details...</p>
            </div>
        );
    }
    
    const trialEndsAt = gymProfile?.trialEndsAt?.toDate();
    const daysLeft = trialEndsAt ? differenceInCalendarDays(trialEndsAt, new Date()) : 0;
    const isSubscribed = !!userProfile?.stripeSubscriptionId;

    const renderSubscriptionStatus = () => {
        if (isSubscribed) {
             return (
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Active Subscription</span>
                </div>
            );
        }
        if (isTrialActive && trialEndsAt) {
             return (
                <div className="flex items-center gap-2 text-blue-600">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-semibold">
                       Trial Period ({daysLeft > 0 ? `${daysLeft} days left` : 'Ends today'})
                    </span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Inactive / Trial Ended</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-28 md:pb-8">
                 <div className="w-full max-w-2xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                    <AdminBottomNav />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Management</CardTitle>
                            <CardDescription>View your current plan, trial status, and manage your billing information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Gym Name</span>
                                    <span className="font-semibold">{gymProfile?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Status</span>
                                    {renderSubscriptionStatus()}
                                </div>
                                {isTrialActive && trialEndsAt && (
                                     <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Trial Ends On</span>
                                        <span className="font-semibold flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {format(trialEndsAt, 'PPP')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {isSubscribed ? (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        You have an active subscription. You can manage your billing details, change your plan, or cancel your subscription at any time through our secure billing portal.
                                    </p>
                                    <Button onClick={handleManageSubscription} className="w-full" disabled={isRedirecting}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {isRedirecting ? 'Redirecting...' : 'Manage Billing & Subscription'}
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                     <p className="text-sm text-muted-foreground mb-4">
                                        {isTrialActive 
                                            ? "Your trial is active. Choose a plan below to continue your service after the trial ends. You won't be charged until your trial is over."
                                            : "Your trial has ended. Please choose a plan to continue using Fit Planner."
                                        }
                                    </p>
                                    <div className="space-y-2">
                                        <SubscriptionButton plan="TRAINER" />
                                        <SubscriptionButton plan="STUDIO" popular={true}/>
                                        <SubscriptionButton plan="GYM"/>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                 </div>
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
