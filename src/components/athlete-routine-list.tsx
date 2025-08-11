
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Dialog } from "@/components/ui/dialog";
import { Accordion } from '@/components/ui/accordion';
import { RoutineCard } from './routine-card';
import { Skeleton } from './ui/skeleton';
import { CalendarX, AlertTriangle } from "lucide-react";
import { WorkoutSession } from './workout-session';

// --- TIPOS DE DATOS ---
export interface Exercise {
  name: string;
  description?: string;
  repType: 'reps' | 'duration';
  reps?: string;
  duration?: string;
  weight?: string;
  videoUrl?: string;
}
export interface Block {
  name: string;
  sets: string;
  exercises: Exercise[];
}
export interface ExerciseProgress {
    [key: string]: {
        completed?: boolean;
        difficulty?: 'easy' | 'medium' | 'hard';
    };
}
export interface Routine {
  id: string;
  memberId: string;
  routineDate: Date;
  routineTypeName: string;
  blocks: Block[];
  userName:string;
  completed?: boolean;
  progress?: ExerciseProgress;
}

// --- COMPONENTES DE ESTADO ---
const LoadingState = () => ( <div className="p-4 max-w-md mx-auto space-y-4 mt-6"> <Skeleton className="h-40 w-full rounded-lg" /> <Skeleton className="h-24 w-full rounded-lg" /> <Skeleton className="h-24 w-full rounded-lg" /> </div> );
const EmptyState = () => ( <div className="text-center py-20 px-4"> <CalendarX className="mx-auto h-16 w-16 text-muted-foreground" /> <h2 className="mt-6 text-2xl font-bold">No Hay Rutinas... ¡Aún!</h2> <p className="mt-2 text-muted-foreground">Tu entrenador no te ha asignado ninguna rutina.</p> </div> );
const ErrorState = ({ message }: { message: string }) => ( <div className="text-center py-20 px-4 bg-destructive/10 rounded-lg"> <AlertTriangle className="mx-auto h-16 w-16 text-destructive" /> <h2 className="mt-6 text-2xl font-bold text-destructive">Ocurrió un Error</h2> <p className="mt-2 text-muted-foreground">{message}</p> </div> );

// --- FUNCIONES DE UTILIDAD ---
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setHours(0, 0, 0, 0);
  return new Date(d.setDate(diff));
};


// --- COMPONENTE PRINCIPAL ---
export const AthleteRoutineList = () => {
    const { user, loading: authLoading } = useAuth();
    const [routines, setRoutines] = React.useState<Routine[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [activeWorkout, setActiveWorkout] = React.useState<Routine | null>(null);

    React.useEffect(() => {
        if (authLoading || !user) {
            setIsLoading(!authLoading);
            return;
        }

        const q = query( collection(db, 'routines'), where('memberId', '==', user.uid), orderBy('routineDate', 'desc') );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedRoutines = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                routineDate: (doc.data().routineDate as Timestamp).toDate(),
            } as Routine));
            setRoutines(fetchedRoutines);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching routines:", err);
            setError("No se pudieron cargar las rutinas.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);
    
    const handleProgressChange = async (routineId: string, exerciseKey: string, currentProgress: any, newProgress: any) => {
        const routineRef = doc(db, 'routines', routineId);
        const newProgressField = { ...currentProgress, ...newProgress };
        try {
            await updateDoc(routineRef, { [`progress.${exerciseKey}`]: newProgressField });
        } catch (e) { console.error("Failed to update progress", e); }
    };
    
    const { todayRoutine, weekRoutines, historyRoutines } = React.useMemo(() => {
        const today = new Date();
        const startOfThisWeek = getStartOfWeek(today);
        const todayRoutine = routines.find(r => isSameDay(r.routineDate, today)) ?? null;
        const weekRoutines = routines.filter(r => r.routineDate >= startOfThisWeek && !isSameDay(r.routineDate, today));
        const historyRoutines = routines.filter(r => r.routineDate < startOfThisWeek);
        return { todayRoutine, weekRoutines, historyRoutines };
    }, [routines]);

    if (authLoading || isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <>
            <div className="p-4 max-w-md mx-auto space-y-8">
                {routines.length === 0 ? ( <EmptyState /> ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {todayRoutine && <RoutineCard routine={todayRoutine} isToday onStartWorkout={setActiveWorkout} />}

                        {weekRoutines.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Próximas Sesiones</h2>
                                <Accordion type="single" collapsible className="w-full space-y-3">
                                    {weekRoutines.map(r => <RoutineCard key={r.id} routine={r} variant="compact" onStartWorkout={setActiveWorkout} dateFormatOptions={{ weekday: 'long' }} />)}
                                </Accordion>
                            </section>
                        )}

                        {historyRoutines.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Historial</h2>
                                <Accordion type="single" collapsible className="w-full space-y-3">
                                    {historyRoutines.map(r => <RoutineCard key={r.id} routine={r} variant="compact" onStartWorkout={setActiveWorkout} dateFormatOptions={{ day: 'numeric', month: 'long' }} />)}
                                </Accordion>
                            </section>
                        )}
                    </Accordion>
                )}
            </div>
            
            <Dialog open={!!activeWorkout} onOpenChange={(isOpen) => !isOpen && setActiveWorkout(null)}>
                {activeWorkout && (
                    <WorkoutSession 
                        routine={activeWorkout} 
                        onSessionEnd={() => setActiveWorkout(null)} 
                        onProgressChange={handleProgressChange}
                    />
                )}
            </Dialog>
        </>
    );
};
