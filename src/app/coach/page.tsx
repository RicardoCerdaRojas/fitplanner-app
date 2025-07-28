
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { CoachRoutineManagement } from '@/components/coach-routine-management';
import { AppHeader } from '@/components/app-header';
import type { RoutineType } from '@/app/admin/routine-types/page';
import { AdminBottomNav } from '@/components/admin-bottom-nav';


export type Member = {
  uid: string;
  name: string;
  email: string;
};


export default function CoachPage() {
  const { activeMembership, loading, isTrialActive } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [routines, setRoutines] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [routineTypes, setRoutineTypes] = useState<RoutineType[]>([]);
  
  // Fetch all necessary data for the coach dashboard
  useEffect(() => {
    if (loading || !activeMembership?.gymId) {
      return;
    }
    
    let routinesLoaded = false, membersLoaded = false, typesLoaded = false;
    const checkLoadingState = () => {
        if (routinesLoaded && membersLoaded && typesLoaded) {
            setIsLoading(false);
        }
    };

    const gymId = activeMembership.gymId;

    const routinesQuery = query(
      collection(db, 'routines'),
      where('gymId', '==', gymId)
    );
    const unsubscribeRoutines = onSnapshot(routinesQuery, (snapshot) => {
        const fetchedRoutines = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                routineDate: (data.routineDate as Timestamp).toDate(),
            };
        }).sort((a, b) => b.routineDate.getTime() - a.routineDate.getTime());
        setRoutines(fetchedRoutines);
        routinesLoaded = true;
        checkLoadingState();
    }, (error) => {
        console.error("Error fetching routines: ", error);
        toast({ variant: 'destructive', title: 'Database Error', description: 'Could not fetch routines.' });
    });

    const membersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({ 
          uid: doc.id, 
          name: doc.data().name || doc.data().email,
          email: doc.data().email,
        })).filter(m => m.name) as Member[];
      setMembers(fetchedMembers);
      membersLoaded = true;
      checkLoadingState();
    });

    const typesQuery = query(collection(db, 'routineTypes'), where('gymId', '==', gymId), orderBy('name'));
    const unsubscribeTypes = onSnapshot(typesQuery, (snapshot) => {
      const fetchedTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineType));
      setRoutineTypes(fetchedTypes);
      typesLoaded = true;
      checkLoadingState();
    });

    return () => {
        unsubscribeRoutines();
        unsubscribeMembers();
        unsubscribeTypes();
    };
  }, [loading, activeMembership, toast]);
  

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
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
        <div className="w-full max-w-5xl">
            <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
            <AdminBottomNav />
            
            {isLoading ? (
                <div className="w-full max-w-4xl space-y-8 mt-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ) : (
                <CoachRoutineManagement 
                  routines={routines}
                  members={members}
                  routineTypes={routineTypes}
                />
            )}
        </div>
      </main>

      <footer className="w-full text-center p-4 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
