
'use client';

import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { GuestHomepage } from '@/components/guest-homepage';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AthleteNav } from '@/components/athlete-nav';
import { AthleteRoutineList, type Routine } from '@/components/athlete-routine-list';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function AthleteDashboard() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const routinesQuery = query(
      collection(db, 'routines'),
      where('athleteId', '==', user.uid),
      where('routineDate', '>=', Timestamp.fromDate(threeMonthsAgo))
    );

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <AppHeader />
        <div className="w-full max-w-4xl">
          <AthleteNav />
          <h1 className="text-3xl font-bold font-headline mb-4">Your Routines</h1>
          <p className="text-muted-foreground mb-6">Here are the upcoming and recent routines assigned by your coach.</p>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
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

export default function Home() {
    const { user, activeMembership, loading } = useAuth();
    
    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <GuestHomepage />;
    }
    
    if (activeMembership?.role === 'athlete') {
        return <AthleteDashboard />;
    }

    // Fallback for when the redirection from AuthProviderClient is happening
    // or for roles that land on '/' before being redirected.
    return <LoadingScreen />;
}
