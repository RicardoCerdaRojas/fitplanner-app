'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';
import { AIWorkoutGenerator } from '@/components/ai-workout-generator';
import { WorkoutDisplay } from '@/components/workout-display';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

function AthleteDashboard() {
    const [routine, setRoutine] = useState<GenerateWorkoutRoutineOutput | null>(null);
    return (
        <div className="w-full max-w-2xl">
            <AIWorkoutGenerator onRoutineGenerated={setRoutine} />
            <WorkoutDisplay routine={routine} />
        </div>
    );
}

function CoachDashboard() {
    return (
        <div className="w-full max-w-2xl text-center">
            <Card className="p-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Welcome, Coach!</CardTitle>
                    <CardDescription>You're in Coach Mode. Here you can manage your clients and their routines.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
                        <Link href="/coach">
                            <User className="mr-2 h-4 w-4" /> Go to Client Routine Creator
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function GuestLandingPage() {
  return (
    <div className="w-full max-w-4xl text-center">
        <Card className="p-8 sm:p-12 bg-card/50 border-2 border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="text-4xl md:text-5xl font-headline">Welcome to Fitness Flow</CardTitle>
                <CardDescription className="text-lg md:text-xl mt-2">Your personal AI fitness partner. Get personalized workouts or create routines for your clients.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                 <Button asChild size="lg">
                    <Link href="/login">Login to Your Account</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/signup">Sign Up Now</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}

export default function Home() {
    const { user, userProfile, loading } = useAuth();

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                
                <div className="flex-grow flex items-center justify-center w-full">
                    {loading ? (
                        <div className="w-full max-w-2xl space-y-4">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-12 w-1/3" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : !user ? (
                        <GuestLandingPage />
                    ) : userProfile?.role === 'athlete' ? (
                        <AthleteDashboard />
                    ) : userProfile?.role === 'coach' ? (
                        <CoachDashboard />
                    ) : (
                       <div className="w-full max-w-2xl space-y-4">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-12 w-1/3" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    )}
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
