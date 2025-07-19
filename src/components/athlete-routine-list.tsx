
'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar, ClipboardList, PlaySquare, Dumbbell, Repeat, Clock, Rocket, CheckCircle2, Info } from 'lucide-react';
import { WorkoutSession } from './workout-session';
import ReactPlayer from 'react-player/lazy';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export type ExerciseProgress = {
  [key: string]: { // The key is now `${blockIndex}-${exerciseIndex}-${setIndex}`
    completed: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  };
};

export type Exercise = {
  name: string;
  description?: string;
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
  routineName?: string; 
  routineTypeName?: string;
  routineTypeId?: string;
  routineDate: Date;
  blocks: Block[];
  coachId: string;
  progress?: ExerciseProgress;
};

type AthleteRoutineListProps = {
  routines: Routine[];
};

export function AthleteRoutineList({ routines }: AthleteRoutineListProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sessionRoutine, setSessionRoutine] = useState<Routine | null>(null);
  const { toast } = useToast();

  const handleProgressChange = async (
    routineId: string, 
    exerciseKey: string, 
    currentProgress: any, 
    newProgress: { completed?: boolean; difficulty?: 'easy' | 'medium' | 'hard' }
  ) => {
    const routineRef = doc(db, 'routines', routineId);
    const updatedProgressForSet = {
        ...(currentProgress || {}),
        ...newProgress,
    };
    
    try {
      await updateDoc(routineRef, {
        [`progress.${exerciseKey}`]: updatedProgressForSet
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your progress." });
    }
  };

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
    <>
      <Dialog open={!!videoUrl} onOpenChange={(isOpen) => !isOpen && setVideoUrl(null)}>
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle>Exercise Example</DialogTitle>
          </DialogHeader>
          {videoUrl && (
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <ReactPlayer
                    url={videoUrl}
                    playing
                    controls
                    width="100%"
                    height="100%"
                    config={{
                        youtube: {
                            playerVars: {
                                autoplay: 1,
                                mute: 1,
                            },
                        },
                    }}
                />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!sessionRoutine} onOpenChange={(isOpen) => { if (!isOpen) setSessionRoutine(null); }}>
          {sessionRoutine && (
              <WorkoutSession 
                  key={sessionRoutine.id}
                  routine={sessionRoutine}
                  onSessionEnd={() => setSessionRoutine(null)}
                  onProgressChange={handleProgressChange}
              />
          )}
      </Dialog>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {routines.map((routine, index) => {
          let totalSets = 0;
          let completedSets = 0;

          routine.blocks?.forEach((block, bIndex) => {
            const setsInBlock = parseInt(block.sets.match(/\d+/)?.[0] || '0', 10);
            if (block.exercises) {
                totalSets += setsInBlock * block.exercises.length;

                if (routine.progress) {
                    block.exercises.forEach((_, eIndex) => {
                        for (let sIndex = 0; sIndex < setsInBlock; sIndex++) {
                            const key = `${bIndex}-${eIndex}-${sIndex}`;
                            if (routine.progress[key]?.completed) {
                                completedSets++;
                            }
                        }
                    });
                }
            }
          });
          
          const progressPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
          const isCompleted = progressPercentage === 100;

          return (
          <AccordionItem value={`item-${index}`} key={routine.id} className='bg-card border-2 rounded-lg data-[state=open]:border-primary/50 data-[state=open]:shadow-lg border-b-2'>
            <AccordionTrigger className='px-4 py-3 hover:no-underline'>
              <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                      <Calendar className="w-5 h-5 text-muted-foreground"/>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-lg font-bold font-headline">{routine.routineTypeName || 'Untitled Routine'}</span>
                        <span className="text-sm text-muted-foreground">{format(routine.routineDate, 'PPP')}</span>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 pr-2">
                    {isCompleted ? (
                        <Badge variant="outline" className="font-semibold border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4 mr-1.5"/>
                            Completed
                        </Badge>
                    ) : (
                        <div className="flex items-center gap-2 w-28">
                            <Progress value={progressPercentage} className="h-1.5 flex-1" />
                            <span className="text-xs font-semibold text-muted-foreground">{progressPercentage}%</span>
                        </div>
                    )}
                  </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className='px-4 pb-4'>
               <div className="flex flex-col gap-4 pt-4 border-t">
                  {!isCompleted && (
                    <Button onClick={() => setSessionRoutine(routine)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                        <Rocket className="w-4 h-4 mr-2" /> Start Workout Session
                    </Button>
                  )}
                  <div className="space-y-4 pt-4">
                    {routine.blocks.map((block, blockIndex) => (
                        <div key={blockIndex} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex justify-between items-center w-full mb-4">
                                <h4 className="text-lg font-bold text-card-foreground">{block.name}</h4>
                                <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">{block.sets}</span>
                            </div>
                            <div className="space-y-2">
                            {block.exercises.map((exercise, exIndex) => {
                                const totalSetsInBlock = parseInt(block.sets.match(/\d+/)?.[0] || '1', 10);
                                let completedSetsForExercise = 0;
                                if (routine.progress) {
                                    for (let i = 0; i < totalSetsInBlock; i++) {
                                        const setKey = `${blockIndex}-${exIndex}-${i}`;
                                        if (routine.progress[setKey]?.completed) {
                                            completedSetsForExercise++;
                                        }
                                    }
                                }
                                const exerciseProgressPercentage = totalSetsInBlock > 0 ? (completedSetsForExercise / totalSetsInBlock) * 100 : 0;
                                
                                return (
                                    <div key={exIndex} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-card-foreground truncate">{exercise.name}</p>
                                                {exercise.description && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p>{exercise.description}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Progress value={exerciseProgressPercentage} className="h-1 w-20" />
                                                <span className="text-xs font-medium text-muted-foreground">{completedSetsForExercise}/{totalSetsInBlock} sets</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-x-4 gap-y-2 text-sm text-muted-foreground flex-wrap justify-end">
                                            {exercise.repType === 'reps' && exercise.reps && (
                                                <div className="flex items-center gap-1.5" title="Reps">
                                                    <Repeat className="w-4 h-4 text-primary" />
                                                    <span className="font-medium text-foreground">{exercise.reps}</span>
                                                </div>
                                            )}
                                            {exercise.repType === 'duration' && exercise.duration && (
                                                <div className="flex items-center gap-1.5" title="Duration">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                    <span className="font-medium text-foreground">{exercise.duration}</span>
                                                </div>
                                            )}
                                            {exercise.weight && (
                                                <div className="flex items-center gap-1.5" title="Weight">
                                                    <Dumbbell className="w-4 h-4 text-primary" />
                                                    <span className="font-medium text-foreground">{exercise.weight}</span>
                                                </div>
                                            )}
                                            {exercise.videoUrl && (
                                                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => setVideoUrl(exercise.videoUrl)}>
                                                    <span className="sr-only">Watch video for {exercise.name}</span>
                                                    <PlaySquare className="w-5 h-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )})}
      </Accordion>
    </>
  );
}
