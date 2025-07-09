'use client';

import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';
import { AIWorkoutGenerator } from '@/components/ai-workout-generator';
import { WorkoutDisplay } from '@/components/workout-display';

export default function Home() {
  const [routine, setRoutine] = useState<GenerateWorkoutRoutineOutput | null>(null);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <header className="w-full max-w-4xl flex items-center justify-center sm:justify-start mb-10">
          <Dumbbell className="w-10 h-10 text-primary" />
          <h1 className="font-headline text-4xl font-bold ml-4 text-card-foreground">
            Fitness Flow
          </h1>
        </header>
        
        <div className="w-full max-w-4xl">
          <AIWorkoutGenerator onRoutineGenerated={setRoutine} />
          <WorkoutDisplay routine={routine} />
        </div>
      </main>

      <footer className="w-full text-center p-4 text-muted-foreground text-sm">
        <p>
          Create your own routines, track your progress, and crush your goals.
        </p>
        <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
