'use client';

import { useState } from 'react';
import { User, Dumbbell } from 'lucide-react';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { CoachWorkoutDisplay, type CoachRoutine } from '@/components/coach-workout-display';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CoachPage() {
  const [routine, setRoutine] = useState<CoachRoutine | null>(null);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <header className="w-full max-w-4xl flex items-center justify-between mb-10">
            <div className="flex items-center">
                <User className="w-10 h-10 text-primary" />
                <h1 className="font-headline text-4xl font-bold ml-4 text-card-foreground">
                    Coach Mode
                </h1>
            </div>
            <Button asChild variant="outline">
                <Link href="/">
                    <Dumbbell className="mr-2 h-4 w-4" /> AI Mode
                </Link>
            </Button>
        </header>
        
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
