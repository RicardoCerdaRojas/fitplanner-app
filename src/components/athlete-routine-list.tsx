
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { format } from 'date-fns';
import { Calendar, ClipboardList, PlaySquare, Dumbbell, Repeat, Clock } from 'lucide-react';
import Link from 'next/link';

export type Exercise = {
  name: string;
  repType: 'reps' | 'duration';
  reps?: string;
  duration?: string;
  weight?: string;
  videoUrl?: string;
};

export type Block = {
    name: string;
    sets: string;
    exercises: Exercise[];
};

export type Routine = {
  id: string; 
  routineDate: Date;
  blocks: Block[];
  coachId: string;
};

type AthleteRoutineListProps = {
  routines: Routine[];
};

export function AthleteRoutineList({ routines }: AthleteRoutineListProps) {
  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
        <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No Routines... Yet!</h3>
        <p className="text-muted-foreground">Your coach hasn't assigned any routines to you. Check back later!</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {routines.map((routine, index) => (
        <AccordionItem value={`item-${index}`} key={routine.id} className='border-2 rounded-lg data-[state=open]:border-primary/50 border-b-2'>
          <AccordionTrigger className='px-4 hover:no-underline'>
            <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-primary"/>
                <span className="text-lg font-bold font-headline">Workout for {format(routine.routineDate, 'PPP')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className='px-4'>
            <div className="space-y-4 pt-2">
              {routine.blocks.map((block, blockIndex) => (
                <div key={blockIndex} className="p-4 border rounded-lg bg-card/50">
                   <div className="flex justify-between items-center w-full mb-3">
                        <h4 className="text-lg font-bold text-card-foreground">{block.name}</h4>
                        <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">{block.sets}</span>
                    </div>
                  <div className="space-y-3">
                    {block.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="p-3 border-l-2 border-primary/30 ml-1">
                        <h5 className="font-semibold text-card-foreground mb-2">{exercise.name}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {exercise.repType === 'reps' && exercise.reps && (
                              <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-accent" /><div><p className="font-semibold">Reps</p><p>{exercise.reps}</p></div></div>
                          )}
                          {exercise.repType === 'duration' && exercise.duration && (
                              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /><div><p className="font-semibold">Duration</p><p>{exercise.duration} minutes</p></div></div>
                          )}
                          {exercise.weight && (
                              <div className="flex items-center gap-2"><Dumbbell className="w-4 h-4 text-accent" /><div><p className="font-semibold">Weight</p><p>{exercise.weight}</p></div></div>
                          )}
                           {exercise.videoUrl && (
                              <div className="col-span-full mt-2">
                                  <Link href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline text-xs">
                                      <PlaySquare className="w-4 h-4" /> Watch Example Video
                                  </Link>
                              </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
