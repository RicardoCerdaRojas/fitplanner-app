
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { AthleteRoutineList, type Routine } from '@/components/athlete-routine-list';
import { AthleteNav } from '@/components/athlete-nav';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';
import { AppDashboardIllustration } from '@/components/ui/app-dashboard-illustration';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function LoadingScreen() {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8">
            <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg text-muted-foreground">Loading Your Dashboard...</p>
            </div>
        </div>
    );
}

function GuestHomepage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                <div className="flex flex-col items-center text-center mt-10 max-w-3xl">
                    <h1 className="text-5xl md:text-6xl font-bold font-headline leading-tight">
                        The Smartest Way to Manage Your Gym
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
                        From AI-powered routine generation to live activity tracking, Fitness Flow is the all-in-one platform to elevate your athletes' training experience.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="text-lg py-7 px-8">
                            <Link href="/signup">Get Started for Free</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="text-lg py-7 px-8">
                            <Link href="/login">Login to Your Account</Link>
                        </Button>
                    </div>
                </div>
                 <div className="mt-16 w-full max-w-4xl px-4">
                    <AppDashboardIllustration />
                </div>
            </main>
        </div>
    );
}


function AthleteDashboard() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        setIsLoading(true);
        const routinesQuery = query(collection(db, 'routines'), where('athleteId', '==', user.uid));
        const unsubscribe = onSnapshot(routinesQuery, (snapshot) => {
            const fetchedRoutines = snapshot.docs
              .map((doc) => {
                  const data = doc.data();
                  return {
                      id: doc.id,
                      routineName: data.routineName,
                      routineTypeName: data.routineTypeName,
                      routineDate: (data.routineDate as Timestamp).toDate(),
                      blocks: data.blocks,
                      coachId: data.coachId,
                      progress: data.progress,
                  } as Routine;
              })
              .sort((a, b) => b.routineDate.getTime() - a.routineDate.getTime());
            setRoutines(fetchedRoutines);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="flex flex-col min-h-screen pb-16 md:pb-0">
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-4xl">
                    <AthleteNav />
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="h-24 w-full animate-pulse rounded-lg bg-muted"></div>
                            <div className="h-24 w-full animate-pulse rounded-lg bg-muted"></div>
                        </div>
                    ) : (
                        <AthleteRoutineList routines={routines} />
                    )}
                </div>
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}

export default function Home() {
    const { user, loading, activeMembership } = useAuth();
    
    // The redirection logic is now handled by the AuthContext to avoid race conditions.
    // This component's responsibility is to render the correct view based on the final auth state.
    
    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <GuestHomepage />;
    }

    if (activeMembership?.role === 'athlete') {
        return <AthleteDashboard />;
    }
    
    // Fallback for admin/coach during redirection or for users without a role yet.
    return <LoadingScreen />;
}
