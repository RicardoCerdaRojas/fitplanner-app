'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { AppHeader } from '@/components/app-header';
import { AdminNav } from '@/components/admin-nav';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { LiveActivityCard, type WorkoutSessionData } from '@/components/live-activity-card';
import { Activity } from 'lucide-react';

export default function LiveActivityPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<WorkoutSessionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (userProfile?.role !== 'gym-admin') {
                router.push('/');
            }
        }
    }, [user, userProfile, loading, router]);

    useEffect(() => {
        if (!userProfile?.gymId) return;

        setIsLoading(true);
        const sessionsQuery = query(
            collection(db, 'workoutSessions'),
            where('gymId', '==', userProfile.gymId),
            where('status', '==', 'active')
        );

        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
            const fetchedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as WorkoutSessionData));
            setSessions(fetchedSessions);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching live sessions:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile?.gymId]);


    if (loading || !user || userProfile?.role !== 'gym-admin') {
        return (
            <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-6xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
                 <p className='mt-8 text-lg text-muted-foreground'>Verifying admin access...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen pb-16 md:pb-0">
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-7xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Live Gym Activity</h1>
                    <AdminNav />

                    {isLoading ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : sessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sessions.map(session => (
                                <LiveActivityCard key={session.id} session={session} />
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg mt-8">
                            <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">No Active Workouts</h3>
                            <p className="text-muted-foreground">It's quiet in here... No athletes are currently in a workout session.</p>
                        </div>
                    )}
                </div>
                <AdminBottomNav />
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
