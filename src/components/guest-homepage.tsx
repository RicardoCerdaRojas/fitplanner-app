
'use client';

import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AthleteNav } from '@/components/athlete-nav';
import { AthleteRoutineList, type Routine } from '@/components/athlete-routine-list';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

function MemberDashboard() {
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
      where('memberId', '==', user.uid),
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
          <h1 className="text-3xl font-bold font-headline mb-4">Tus Rutinas</h1>
          <p className="text-muted-foreground mb-6">Estas son las rutinas recientes y futuras asignadas por tu coach.</p>
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
        <p>&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
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
                <p className="text-lg text-muted-foreground">Cargando tu Dashboard...</p>
            </div>
        </div>
    );
}

// This component now contains the logic for routing authenticated users.
// The new V2 landing page is now in /app/page.tsx
export default function GuestHomepage() {
    const { user, activeMembership, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only run routing logic when auth state is fully resolved
        if (loading) {
            return;
        }

        if (user) {
            if (activeMembership) {
                if (activeMembership.role === 'gym-admin') {
                    router.replace('/admin');
                } else if (activeMembership.role === 'coach') {
                    router.replace('/coach');
                }
                // For members, the MemberDashboard is rendered below, so no redirect is needed.
            } else {
                // User is authenticated but has no membership, send to create a gym.
                router.replace('/create-gym');
            }
        }
        // If there's no user and loading is false, do nothing. The parent component will render the public page.
    }, [user, activeMembership, loading, router]);


    if (loading) {
        return <LoadingScreen />;
    }

    if (user && activeMembership?.role === 'member') {
        return <MemberDashboard />;
    }
    
    // This state is for users who have just logged in and are waiting for the redirection logic to complete.
    // It prevents a flash of the wrong page.
    if (user) {
        return <LoadingScreen />;
    }

    // For unauthenticated users, this component will return null,
    // allowing the parent component (e.g., page.tsx) to render the public landing page.
    return null;
}
