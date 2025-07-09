'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, PlaySquare, Dumbbell, Repeat, Clock, User } from 'lucide-react';
import Link from 'next/link';

export type CoachExercise = {
  name: string;
  repType: 'reps' | 'duration';
  reps?: string;
  duration?: string;
  weight?: string;
  videoUrl?: string;
};

export type CoachRoutine = {
  userName: string;
  routineName: string;
  exercises: CoachExercise[];
};

type CoachWorkoutDisplayProps = {
  routine: CoachRoutine | null;
};

export function CoachWorkoutDisplay({ routine }: CoachWorkoutDisplayProps) {
  if (!routine) {
    return null;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 shadow-lg animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3">
                    <ClipboardList className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-2xl">{routine.routineName}</CardTitle>
                        <CardDescription>A personalized routine for {routine.userName}.</CardDescription>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4"/>
                <span>{routine.userName}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            {routine.exercises.map((exercise, index) => (
                <div key={index} className="p-4 border rounded-lg">
                    <h3 className="text-xl font-bold font-headline text-primary mb-3">{exercise.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {exercise.repType === 'reps' && exercise.reps && (
                            <div className="flex items-center gap-2">
                                <Repeat className="w-5 h-5 text-accent" />
                                <div>
                                    <p className="font-semibold">Reps</p>
                                    <p>{exercise.reps}</p>
                                </div>
                            </div>
                        )}
                         {exercise.repType === 'duration' && exercise.duration && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-accent" />
                                <div>
                                    <p className="font-semibold">Duration</p>
                                    <p>{exercise.duration} minutes</p>
                                </div>
                            </div>
                        )}
                        {exercise.weight && (
                            <div className="flex items-center gap-2">
                                <Dumbbell className="w-5 h-5 text-accent" />
                                <div>
                                    <p className="font-semibold">Weight</p>
                                    <p>{exercise.weight}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {exercise.videoUrl && (
                        <div className="mt-4">
                            <Link href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                                <PlaySquare className="w-5 h-5" />
                                Watch Example Video
                            </Link>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
