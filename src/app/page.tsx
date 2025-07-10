
'use client';

import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function DiagnosticCard() {
    const { user, loading, activeMembership, memberships, gymProfile } = useAuth();

    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Auth State Diagnostics</CardTitle>
                <CardDescription>Real-time status of the authentication context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between p-2 border rounded-md">
                    <span className="font-semibold">Loading:</span>
                    <span className="font-mono">{loading ? 'true' : 'false'}</span>
                </div>
                <div className="flex justify-between p-2 border rounded-md">
                    <span className="font-semibold">User Email:</span>
                    <span className="font-mono">{user ? user.email : 'null'}</span>
                </div>
                <div className="flex justify-between p-2 border rounded-md">
                    <span className="font-semibold">Memberships Loaded:</span>
                    <span className="font-mono">{memberships.length}</span>
                </div>
                <div className="flex justify-between p-2 border rounded-md">
                    <span className="font-semibold">Active Membership Role:</span>
                    <span className="font-mono">{activeMembership ? activeMembership.role : 'null'}</span>
                </div>
                <div className="flex justify-between p-2 border rounded-md">
                    <span className="font-semibold">Gym Profile Name:</span>
                    <span className="font-mono">{gymProfile ? gymProfile.name : 'null'}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
            <AppHeader />
            <main className="flex-grow flex flex-col items-center justify-center w-full">
                <DiagnosticCard />
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
