
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { AppHeader } from '@/components/app-header';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { LiveActivityCard, type WorkoutSessionData } from '@/components/live-activity-card';
import { Activity } from 'lucide-react';
import { TrialEnded } from '@/components/trial-ended';

export default function LiveActivityPage() {
    const { activeMembership, loading, isTrialActive } = useAuth();
    const router = useRouter();
    const [activeSessions, setActiveSessions] = useState<WorkoutSessionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const sessionsRef = useRef<WorkoutSessionData[]>([]);
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (loading || !activeMembership?.gymId) return;

        const sessionsQuery = query(
            collection(db, 'workoutSessions'),
            where('gymId', '==', activeMembership.gymId),
            where('status', '==', 'active')
        );

        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
            const fetchedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as WorkoutSessionData));
            
            sessionsRef.current = fetchedSessions;

            if (isLoading) {
                 const initialFilteredSessions = sessionsRef.current.filter(session => {
                    const now = new Date();
                    const lastUpdate = session.lastUpdateTime.toDate();
                    return (now.getTime() - lastUpdate.getTime()) < 30000;
                });
                setActiveSessions(initialFilteredSessions);
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [loading, activeMembership, isLoading]);


    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const now = new Date();
            const filtered = sessionsRef.current.filter(session => {
                if (!session.lastUpdateTime) return false;
                const lastUpdate = session.lastUpdateTime.toDate();
                const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
                return diffSeconds < 30;
            });
            setActiveSessions(filtered);
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);


    if (loading || !activeMembership || activeMembership.role !== 'gym-admin') {
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
    
    if (!isTrialActive) {
        return <TrialEnded />;
    }
    
    return (
        <div className="flex flex-col min-h-screen pb-16 md:pb-0">
            <AppHeader />
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <div className="w-full max-w-7xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Live Gym Activity</h1>
                    <AdminBottomNav />
                </div>
                
                <div className="w-full max-w-7xl">
                    {isLoading ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : activeSessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {activeSessions.map(session => (
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
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
