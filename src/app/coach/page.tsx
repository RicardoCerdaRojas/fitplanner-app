
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminNav } from '@/components/admin-nav';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { CoachRoutineManagement, type ManagedRoutine } from '@/components/coach-routine-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardPlus, ClipboardList } from 'lucide-react';
import type { RoutineType } from '@/app/admin/routine-types/page';

export type Athlete = {
  uid: string;
  name: string;
};

export default function CoachPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [routineTypes, setRoutineTypes] = useState<RoutineType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routines, setRoutines] = useState<ManagedRoutine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [editingRoutine, setEditingRoutine] = useState<ManagedRoutine | null>(null);
  
  const initialAthleteId = searchParams.get('athleteId');
  const [activeTab, setActiveTab] = useState(initialAthleteId ? 'manage' : 'create');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userProfile?.role !== 'coach' && userProfile?.role !== 'gym-admin') {
        router.push('/');
      }
    }
  }, [user, userProfile, loading, router]);

  // Fetch athletes and routine types
  useEffect(() => {
    if (loading || !userProfile?.gymId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Fetch Athletes
    const athletesQuery = query(
      collection(db, 'users'),
      where('gymId', '==', userProfile.gymId),
      where('role', '==', 'athlete')
    );
    const unsubscribeAthletes = onSnapshot(athletesQuery, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => {
        const data = doc.data();
        return { uid: doc.id, name: data.name || data.email };
      }).filter(athlete => athlete.name) as Athlete[];
      setAthletes(fetchedAthletes);
    }, (error) => {
      console.error("Error fetching athletes: ", error);
      toast({
          variant: 'destructive',
          title: 'Database Error',
          description: 'Could not fetch the athletes list.',
      });
    });

    // Fetch Routine Types
    const typesQuery = query(collection(db, 'routineTypes'), where('gymId', '==', userProfile.gymId), orderBy('name'));
    const unsubscribeTypes = onSnapshot(typesQuery, (snapshot) => {
        const fetchedTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineType));
        setRoutineTypes(fetchedTypes);
    }, (error) => {
        console.error("Error fetching routine types:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch routine types.' });
    });

    Promise.all([new Promise(res => onSnapshot(athletesQuery, res)), new Promise(res => onSnapshot(typesQuery, res))])
      .finally(() => setIsLoading(false));


    return () => {
      unsubscribeAthletes();
      unsubscribeTypes();
    };
  }, [userProfile?.gymId, loading, toast]);

  // Fetch routines for management
  useEffect(() => {
    if (loading || !userProfile?.gymId) {
      setIsLoadingRoutines(false);
      return;
    }

    setIsLoadingRoutines(true);
    const routinesQuery = query(
      collection(db, 'routines'),
      where('gymId', '==', userProfile.gymId)
    );

    const unsubscribe = onSnapshot(routinesQuery, (snapshot) => {
        const fetchedRoutines = snapshot.docs.map(doc => {
            const data = doc.data();
            if (data.athleteId && data.userName && data.routineDate) {
                return {
                    id: doc.id,
                    ...data,
                    routineDate: (data.routineDate as Timestamp).toDate(),
                } as ManagedRoutine;
            }
            return null;
        }).filter((r): r is ManagedRoutine => r !== null)
          .sort((a, b) => b.routineDate.getTime() - a.routineDate.getTime());
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
  }, [userProfile?.gymId, loading, toast]);
  
  const handleEditRoutine = (routine: ManagedRoutine) => {
    setEditingRoutine(routine);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleRoutineSaved = () => {
    setEditingRoutine(null);
    setActiveTab('manage');
  };


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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <ClipboardPlus className="mr-2" /> {editingRoutine ? 'Edit Routine' : 'Create Routine'}
              </TabsTrigger>
              <TabsTrigger value="manage">
                <ClipboardList className="mr-2" /> Manage Routines
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              {isLoading ? <Skeleton className="h-96 w-full mt-4"/> : (
                userProfile?.gymId && <CoachRoutineCreator athletes={athletes} routineTypes={routineTypes} gymId={userProfile.gymId} routineToEdit={editingRoutine} onRoutineSaved={handleRoutineSaved} />
              )}
            </TabsContent>
            <TabsContent value="manage">
              {isLoadingRoutines ? (
                  <Skeleton className="h-96 w-full mt-4" />
              ) : (
                  <CoachRoutineManagement routines={routines} onEdit={handleEditRoutine} initialAthleteId={initialAthleteId} />
              )}
            </TabsContent>
          </Tabs>
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
