'use client';

import { useState } from 'react';
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';
import { AIWorkoutGenerator } from '@/components/ai-workout-generator';
import { WorkoutDisplay } from '@/components/workout-display';
import { AppHeader } from '@/components/app-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function GenerateRoutinePage() {
    const [aiRoutine, setAiRoutine] = useState<GenerateWorkoutRoutineOutput | null>(null);
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
             <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-2xl space-y-8 mt-4">
                    <Skeleton className="h-12 w-40" />
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
        <div className="flex flex-col min-h-screen">
             <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-2xl space-y-8">
                    <Button asChild variant="outline" className="self-start">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <AIWorkoutGenerator onRoutineGenerated={setAiRoutine} />
                    <WorkoutDisplay routine={aiRoutine} />
                </div>
            </main>
            <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
