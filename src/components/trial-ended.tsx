
'use client';

import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export function TrialEnded() {
    const router = useRouter();
    
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
                            <Lock className="h-8 w-8" />
                        </div>
                        <CardTitle>Your Trial Has Ended</CardTitle>
                        <CardDescription>
                            Your 14-day free trial is over. Please upgrade your plan to continue using all features of Fit Planner.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button size="lg" onClick={() => router.push('/admin/subscription')}>
                            Manage Subscription
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
