
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar, ClipboardList, PlaySquare, Dumbbell, Repeat, Clock, Rocket } from 'lucide-react';
import { WorkoutSession } from './workout-session';
import ReactPlayer from 'react-player/lazy';

export type ExerciseProgress = {
  [key: string]: {
    completed: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  };
};

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
  routineName?: string; // For backwards compatibility
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
    const updatedProgress = { ...(currentProgress || {}), ...newProgress };
    try {
      await updateDoc(routineRef, {
        [`progress.${exerciseKey}`]: updatedProgress
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
        {routines.map((routine, index) => (
          <AccordionItem value={`item-${index}`} key={routine.id} className='border-2 rounded-lg data-[state=open]:border-primary/50 border-b-2'>
            <AccordionTrigger className='px-4 hover:no-underline'>
              <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-primary"/>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-lg font-bold font-headline">{routine.routineTypeName || routine.routineName || 'Untitled Routine'}</span>
                    <span className="text-sm text-muted-foreground">{format(routine.routineDate, 'PPP')}</span>
                  </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className='px-4'>
               <div className="flex justify-start pt-4 pb-4 border-b">
                  <Button onClick={() => setSessionRoutine(routine)} className="bg-accent hover:bg-accent/90">
                      <Rocket className="w-4 h-4 mr-2" /> Start Workout Session
                  </Button>
              </div>
              <div className="space-y-4 pt-4">
                {routine.blocks.map((block, blockIndex) => (
                  <div key={blockIndex} className="p-4 border rounded-lg bg-card/50">
                    <div className="flex justify-between items-center w-full mb-3">
                          <h4 className="text-lg font-bold text-card-foreground">{block.name}</h4>
                          <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">{block.sets}</span>
                      </div>
                    <div className="space-y-3">
                      {block.exercises.map((exercise, exIndex) => {
                        const exerciseKey = `${blockIndex}-${exIndex}`;
                        const currentProgress = routine.progress?.[exerciseKey];
                        
                        return (
                          <div key={exIndex} className="p-3 border-l-4 border-primary/30 ml-1 space-y-4">
                            <h5 className="font-semibold text-card-foreground text-base">{exercise.name}</h5>
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
                            </div>
                            <div className="space-y-4">
                              {exercise.videoUrl && (
                                <div>
                                    <Button variant="outline" size="sm" className="text-xs" onClick={() => setVideoUrl(exercise.videoUrl)}>
                                        <PlaySquare className="w-4 h-4 mr-2" /> Watch Example
                                    </Button>
                                </div>
                              )}
                              <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center gap-4 flex-wrap">
                                  <div className="flex items-center gap-2">
                                      <Checkbox 
                                        id={`cb-${routine.id}-${exerciseKey}`}
                                        checked={currentProgress?.completed || false}
                                        onCheckedChange={(checked) => handleProgressChange(routine.id, exerciseKey, currentProgress, { completed: !!checked })}
                                        />
                                      <label htmlFor={`cb-${routine.id}-${exerciseKey}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Mark as Complete
                                      </label>
                                  </div>
                                  <Select 
                                    onValueChange={(value: 'easy' | 'medium' | 'hard') => handleProgressChange(routine.id, exerciseKey, currentProgress, { difficulty: value })}
                                    value={currentProgress?.difficulty}
                                  >
                                      <SelectTrigger className="w-[140px] h-9 text-xs">
                                          <SelectValue placeholder="Rate Difficulty" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="easy">Easy</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="hard">Hard</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
