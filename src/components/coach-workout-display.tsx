'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClipboardList, PlaySquare, Dumbbell, Repeat, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export type CoachExercise = {
  name: string;
  repType: 'reps' | 'duration';
  reps?: string;
  duration?: string;
  weight?: string;
  videoUrl?: string;
};

export type CoachBlock = {
    name: string;
    sets: string;
    exercises: CoachExercise[];
};

export type CoachRoutine = {
  userName: string;
  routineDate: Date;
  blocks: CoachBlock[];
};

type CoachWorkoutDisplayProps = {
  routine: CoachRoutine | null;
};

export function CoachWorkoutDisplay({ routine }: CoachWorkoutDisplayProps) {
  if (!routine) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 shadow-lg animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3">
                    <ClipboardList className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-2xl">Workout for {format(routine.routineDate, 'PPP')}</CardTitle>
                        <CardDescription>A personalized routine for {routine.userName}.</CardDescription>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
                <User className="w-4 h-4"/>
                <span>{routine.userName}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={routine.blocks.map((_, i) => `item-${i}`)}>
            {routine.blocks.map((block, index) => (
                <AccordionItem value={`item-${index}`} key={index} className='border-2 rounded-lg data-[state=open]:border-primary/50 border-b-2'>
                    <AccordionTrigger className='px-4 hover:no-underline'>
                        <div className="flex justify-between items-center w-full">
                            <span className="text-xl font-bold font-headline text-primary">{block.name}</span>
                            <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">{block.sets}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className='px-4'>
                        <div className="space-y-4 pt-2">
                            {block.exercises.map((exercise, exIndex) => (
                                <div key={exIndex} className="p-4 border rounded-lg bg-card/50">
                                    <h4 className="text-lg font-bold text-card-foreground mb-3">{exercise.name}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        {exercise.repType === 'reps' && exercise.reps && (
                                            <div className="flex items-center gap-2"><Repeat className="w-5 h-5 text-accent" /><div><p className="font-semibold">Reps</p><p>{exercise.reps}</p></div></div>
                                        )}
                                        {exercise.repType === 'duration' && exercise.duration && (
                                            <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-accent" /><div><p className="font-semibold">Duration</p><p>{exercise.duration} minutes</p></div></div>
                                        )}
                                        {exercise.weight && (
                                            <div className="flex items-center gap-2"><Dumbbell className="w-5 h-5 text-accent" /><div><p className="font-semibold">Weight</p><p>{exercise.weight}</p></div></div>
                                        )}
                                    </div>
                                    {exercise.videoUrl && (
                                        <div className="mt-4">
                                            <Link href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                                                <PlaySquare className="w-5 h-5" /> Watch Example Video
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
