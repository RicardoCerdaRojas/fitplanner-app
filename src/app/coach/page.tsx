'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { CoachWorkoutDisplay, type CoachRoutine } from '@/components/coach-workout-display';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';

export default function CoachPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [routine, setRoutine] = useState<CoachRoutine | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userProfile?.role !== 'coach') {
        router.push('/');
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading || !user || userProfile?.role !== 'coach') {
    return (
        <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
            <AppHeader />
            <div className="w-full max-w-4xl space-y-8 mt-4">
                <Skeleton className="h-72 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
            <p className='mt-8 text-lg text-muted-foreground'>Verifying coach access...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <AppHeader />
        
        <div className="w-full max-w-4xl">
          <CoachRoutineCreator onRoutineCreated={setRoutine} />
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
