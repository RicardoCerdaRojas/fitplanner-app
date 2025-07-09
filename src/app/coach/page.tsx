'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminNav } from '@/components/admin-nav';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { CoachRoutineManagement, type ManagedRoutine } from '@/components/coach-routine-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardPlus, ClipboardList } from 'lucide-react';

export type Athlete = {
  uid: string;
  name: string;
};

export default function CoachPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);
  const [routines, setRoutines] = useState<ManagedRoutine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [editingRoutine, setEditingRoutine] = useState<ManagedRoutine | null>(null);
  const [activeTab, setActiveTab] = useState('create');


  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userProfile?.role !== 'coach' && userProfile?.role !== 'gym-admin') {
        router.push('/');
      }
    }
  }, [user, userProfile, loading, router]);

  // Fetch athletes
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
            // Ensure data has the required fields before casting
            if (data.athleteId && data.userName && data.routineDate) {
                return {
                    id: doc.id,
                    ...data,
                    routineDate: (data.routineDate as Timestamp).toDate(),
                } as ManagedRoutine;
            }
            return null;
        }).filter((r): r is ManagedRoutine => r !== null) // Filter out nulls
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
    setEditingRoutine(null); // Clear editing state
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
              {isLoadingAthletes ? <Skeleton className="h-96 w-full mt-4"/> : (
                userProfile?.gymId && <CoachRoutineCreator athletes={athletes} gymId={userProfile.gymId} routineToEdit={editingRoutine} onRoutineSaved={handleRoutineSaved} />
              )}
            </TabsContent>
            <TabsContent value="manage">
              {isLoadingRoutines ? (
                  <Skeleton className="h-96 w-full mt-4" />
              ) : (
                  <CoachRoutineManagement routines={routines} onEdit={handleEditRoutine} />
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
