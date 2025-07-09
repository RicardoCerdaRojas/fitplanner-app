'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { CoachWorkoutDisplay, type CoachRoutine } from '@/components/coach-workout-display';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminNav } from '@/components/admin-nav';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export type Athlete = {
  uid: string;
  name: string;
};

export default function CoachPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [routine, setRoutine] = useState<CoachRoutine | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userProfile?.role !== 'coach' && userProfile?.role !== 'gym-admin') {
        router.push('/');
      }
    }
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    if (loading || !userProfile?.gymId) {
      setIsLoadingAthletes(false);
      return;
    }

    setIsLoadingAthletes(true);
    const athletesQuery = query(
      collection(db, 'users'),
      where('gymId', '==', userProfile.gymId),
      where('role', '==', 'athlete')
    );

    const unsubscribe = onSnapshot(athletesQuery, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || data.email,
        };
      }).filter(athlete => athlete.name);
      
      setAthletes(fetchedAthletes as Athlete[]);
      setIsLoadingAthletes(false);
    }, (error) => {
      console.error("Error fetching athletes: ", error);
      toast({
          variant: 'destructive',
          title: 'Database Error',
          description: 'Could not fetch the athletes list. The database may require an index. Please check the browser console for a link to create it.',
      });
      setIsLoadingAthletes(false);
    });

    return () => unsubscribe();
  }, [userProfile?.gymId, loading, toast]);


  if (loading || !user || (userProfile?.role !== 'coach' && userProfile?.role !== 'gym-admin')) {
    return (
        <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
            <AppHeader />
            <div className="w-full max-w-4xl space-y-8 mt-4">
                <Skeleton className="h-72 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
            <p className='mt-8 text-lg text-muted-foreground'>Verifying access...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <AppHeader />
        
        <div className="w-full max-w-4xl">
          {userProfile?.role === 'gym-admin' ? (
              <>
                  <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                  <AdminNav />
              </>
            ) : (
                <h1 className="text-3xl font-bold font-headline mb-8">Coach Dashboard</h1>
            )}
          {isLoadingAthletes ? <Skeleton className="h-96 w-full"/> : (
            userProfile?.gymId && <CoachRoutineCreator onRoutineCreated={setRoutine} athletes={athletes} gymId={userProfile.gymId} />
          )}
          <CoachWorkoutDisplay routine={routine} />
        </div>
      </main>

      <footer className="w-full text-center p-4 text-muted-foreground text-sm">
        <p>
          Create personalized routines for your clients.
        </p>
        <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
