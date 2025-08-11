
'use client';

import { useState, useMemo } from 'react'; // Importamos useMemo
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';
import { AIWorkoutGenerator } from '@/components/ai-workout-generator';
import { RoutineDetailView } from '@/components/routine-detail-view';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AthleteNav } from '@/components/athlete-nav';

export default function GenerateRoutinePage() {
    const [aiRoutine, setAiRoutine] = useState<GenerateWorkoutRoutineOutput | null>(null);
    const { user, loading } = useAuth();
    const router = useRouter();

    // --- CORRECCIÓN: Parseamos el string JSON de la IA ---
    const parsedRoutine = useMemo(() => {
        if (!aiRoutine?.routine) return null;
        try {
            // El string de la IA se convierte en un objeto de JavaScript
            return JSON.parse(aiRoutine.routine);
        } catch (error) {
            console.error("Error parsing AI-generated routine:", error);
            return null;
        }
    }, [aiRoutine]);

    if (loading) {
        return (
             <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-4xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen pb-16 md:pb-0">
             <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-4xl space-y-8">
                    <AthleteNav />
                    <AIWorkoutGenerator onRoutineGenerated={setAiRoutine} />
                    
                    {/* -- Usamos el objeto parseado para renderizar la vista -- */}
                    {parsedRoutine && parsedRoutine.blocks && (
                        <div className="mt-8 border rounded-lg">
                           <RoutineDetailView blocks={parsedRoutine.blocks} />
                        </div>
                    )}
                </div>
            </main>
            <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
