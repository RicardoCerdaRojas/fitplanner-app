
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { CoachRoutineManagement } from '@/components/coach-routine-management';
import { AppHeader } from '@/components/app-header';
import { AdminBottomNav } from '@/components/admin-bottom-nav';


export type Member = {
  uid: string;
  name: string;
  email: string;
};


export default function CoachPage() {
  const { activeMembership, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [routines, setRoutines] = useState<any[]>([]);
  
  // Fetch routines for management
  useEffect(() => {
    if (loading || !activeMembership?.gymId) {
      setIsLoadingRoutines(false);
      return;
    }

    setIsLoadingRoutines(true);
    const routinesQuery = query(
      collection(db, 'routines'),
      where('gymId', '==', activeMembership.gymId)
    );

    const unsubscribe = onSnapshot(routinesQuery, (snapshot) => {
        const fetchedRoutines = snapshot.docs.map(doc => {
            const data = doc.data();
            if (data.memberId && data.userName && data.routineDate) {
                return {
                    id: doc.id,
                    ...data,
                    routineDate: (data.routineDate as Timestamp).toDate(),
                };
            }
            return null;
        }).filter(r => r !== null)
          .sort((a, b) => b!.routineDate.getTime() - a!.routineDate.getTime());
        setRoutines(fetchedRoutines);
        setIsLoadingRoutines(false);
    }, (error) => {
        console.error("Error fetching routines: ", error);
        toast({
            variant: 'destructive',
            title: 'Database Error',
            description: 'Could not fetch routines. Please check the console for details.',
        });
        setIsLoadingRoutines(false);
    });

    return () => unsubscribe();
  }, [loading, activeMembership, toast]);
  

  const handleEditRoutine = (routine: any) => {
    router.push(`/coach/create-routine?edit=${routine.id}`);
  };


  if (loading || !activeMembership || (activeMembership.role !== 'coach' && activeMembership.role !== 'gym-admin')) {
    return (
        <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
            <AppHeader />
            <div className="w-full max-w-4xl space-y-8 mt-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
            <p className='mt-8 text-lg text-muted-foreground'>Verifying access...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-5xl">
          {activeMembership.role === 'gym-admin' ? (
              <>
                  <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                  <AdminBottomNav />
              </>
            ) : (
                <h1 className="text-3xl font-bold font-headline mb-8">Coach Dashboard</h1>
            )}
            
            {isLoadingRoutines ? (
                <div className="w-full max-w-4xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ) : (
                <CoachRoutineManagement 
                  routines={routines} 
                  onEdit={handleEditRoutine} 
                />
            )}
        </div>
      </main>

      <footer className="w-full text-center p-4 text-muted-foreground text-sm">
        <p>
          Create and manage personalized routines for your clients.
        </p>
        <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

