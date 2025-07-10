'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { db, rtdb } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';

import { AppHeader } from '@/components/app-header';
import { AdminNav } from '@/components/admin-nav';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { LiveActivityCard, type WorkoutSessionData } from '@/components/live-activity-card';
import { Activity } from 'lucide-react';

export default function LiveActivityPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const [activeSessions, setActiveSessions] = useState<WorkoutSessionData[]>([]);
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

    // Effect to listen for active session IDs from RTDB and then fetch from Firestore
    useEffect(() => {
        if (!userProfile?.gymId) return;

        const activeSessionsRef = ref(rtdb, 'activeSessions');
        
        // Listen to RTDB for the list of active session IDs
        const unsubscribeRtdb = onValue(activeSessionsRef, (snapshot) => {
            const activeIdsData = snapshot.val();
            const activeIds = activeIdsData ? Object.keys(activeIdsData) : [];
            
            if (activeIds.length === 0) {
                setActiveSessions([]);
                setIsLoading(false);
                return;
            }

            // For each active ID, listen to its Firestore document
            const unsubscribers = activeIds.map(sessionId => {
                const sessionDocRef = doc(db, 'workoutSessions', sessionId);
                return onSnapshot(sessionDocRef, (docSnapshot) => {
                    setActiveSessions(prevSessions => {
                        const existingSessionIndex = prevSessions.findIndex(s => s.id === docSnapshot.id);
                        const newSessionData = { id: docSnapshot.id, ...docSnapshot.data() } as WorkoutSessionData;

                        if (!docSnapshot.exists()) {
                            // Remove session if it has been deleted from Firestore
                            return prevSessions.filter(s => s.id !== docSnapshot.id);
                        }

                        if (existingSessionIndex > -1) {
                            // Update existing session
                            const updatedSessions = [...prevSessions];
                            updatedSessions[existingSessionIndex] = newSessionData;
                            return updatedSessions;
                        } else {
                            // Add new session
                             return [...prevSessions, newSessionData];
                        }
                    });
                });
            });
            
            // Cleanup function for listeners to Firestore documents
            return () => unsubscribers.forEach(unsub => unsub());

        }, (error) => {
            console.error("Error fetching live session IDs from RTDB:", error);
            setIsLoading(false);
        });

        const initialLoadTimer = setTimeout(() => setIsLoading(false), 2000); // Failsafe loading state

        // Cleanup RTDB listener
        return () => {
            unsubscribeRtdb();
            clearTimeout(initialLoadTimer);
        };
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
                <AdminBottomNav />
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
