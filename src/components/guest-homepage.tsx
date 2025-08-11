
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
          // --- CORRECCIÓN CLAVE ---
          // Aseguramos que el objeto creado cumpla con el tipo 'Routine'
          return {
            id: doc.id,
            memberId: data.memberId,
            userName: data.userName,
            routineTypeName: data.routineTypeName,
            routineDate: (data.routineDate as Timestamp).toDate(),
            blocks: data.blocks,
            completed: data.completed || false,
            progress: data.progress,
          } as Routine;
        })
        .sort((a, b) => b.routineDate.getTime() - a.routineDate.getTime());
      setRoutines(fetchedRoutines);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // El componente AthleteRoutineList ahora maneja su propia obtención de datos.
  // Ya no necesitamos pasarle las rutinas como props, simplificando este componente.
  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <AppHeader />
        <div className="w-full max-w-4xl">
          <AthleteNav />
          <h1 className="text-3xl font-bold font-headline mb-8">Tus Rutinas</h1>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            // Simplificado: AthleteRoutineList ahora es autónomo.
            <AthleteRoutineList />
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

// Este componente ahora contiene la lógica para enrutar a los usuarios autenticados.
export default function GuestHomepage() {
    const { user, activeMembership, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (user) {
            // La lógica de enrutamiento principal ahora debería estar en /app/home/page.tsx
            // Este componente se está volviendo redundante. Por ahora, redirigimos a /home
            // si el usuario es un miembro, y dejamos que /home maneje el dashboard.
            if (activeMembership?.role === 'member') {
                router.replace('/home');
            } else if (activeMembership?.role === 'gym-admin') {
                router.replace('/admin');
            } else if (activeMembership?.role === 'coach') {
                router.replace('/coach');
            } else {
                router.replace('/create-gym');
            }
        }
        // Si no hay usuario, no hacer nada, page.tsx mostrará la landing page.
    }, [user, activeMembership, loading, router]);


    // Durante la carga o la redirección, mostramos una pantalla de carga.
    if (loading || user) {
        return <LoadingScreen />;
    }
    
    // Para usuarios no autenticados, devuelve null.
    return null;
}
