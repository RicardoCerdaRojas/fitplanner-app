'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Repeat, Clock, Layers } from 'lucide-react';
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type WorkoutDisplayProps = {
  routine: GenerateWorkoutRoutineOutput | null;
};

type Exercise = {
  name: string;
  details: string[];
};

type Block = {
  name: string;
  exercises: Exercise[];
};

const parseRoutineToJSON = (text: string): Block[] => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const blocks: Block[] = [];
  let currentBlock: Block | null = null;
  let currentExercise: Exercise | null = null;

  lines.forEach(line => {
    line = line.trim();
    if (line.match(/^\*\*.+\*\*$/)) { // Block name
      if (currentBlock) {
        if (currentExercise) {
          currentBlock.exercises.push(currentExercise);
        }
        blocks.push(currentBlock);
      }
      currentBlock = { name: line.replace(/\*\*/g, ''), exercises: [] };
      currentExercise = null;
    } else if (line.match(/^\*.+\*$/)) { // Exercise name
      if (currentBlock) {
        if (currentExercise) {
          currentBlock.exercises.push(currentExercise);
        }
        currentExercise = { name: line.replace(/\*/g, ''), details: [] };
      }
    } else if (line.startsWith('- ')) { // Detail
      if (currentExercise) {
        currentExercise.details.push(line.substring(2));
      }
    }
  });

  if (currentBlock) {
    if (currentExercise) {
      currentBlock.exercises.push(currentExercise);
    }
    blocks.push(currentBlock);
  }

  return blocks;
};

const getIconForDetail = (detail: string) => {
    const lowerDetail = detail.toLowerCase();
    if (lowerDetail.startsWith('sets')) return <Layers className="w-4 h-4 text-primary" />;
    if (lowerDetail.startsWith('reps')) return <Repeat className="w-4 h-4 text-primary" />;
    if (lowerDetail.startsWith('duration')) return <Clock className="w-4 h-4 text-primary" />;
    if (lowerDetail.startsWith('weight')) return <Dumbbell className="w-4 h-4 text-primary" />;
    return <Dumbbell className="w-4 h-4 text-primary" />;
};


export function WorkoutDisplay({ routine }: WorkoutDisplayProps) {
  if (!routine || !routine.routine || routine.routine.trim() === '') {
    return null;
  }

  const parsedRoutine = parseRoutineToJSON(routine.routine);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 shadow-lg animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl">Tu Rutina Generada por IA</CardTitle>
            <CardDescription>Aquí tienes la rutina personalizada solo para ti.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={parsedRoutine.map((_, i) => `item-${i}`)}>
          {parsedRoutine.map((block, index) => (
            <AccordionItem value={`item-${index}`} key={index} className='border-2 rounded-lg data-[state=open]:border-primary/50 border-b-2'>
              <AccordionTrigger className='px-4 hover:no-underline'>
                <span className="text-xl font-bold font-headline text-primary">{block.name}</span>
              </AccordionTrigger>
              <AccordionContent className='px-4'>
                <div className="space-y-3 pt-2">
                  {block.exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="p-4 border rounded-lg bg-card/50">
                      <h4 className="text-lg font-bold text-card-foreground mb-3">{exercise.name}</h4>
                      <div className="space-y-2">
                        {exercise.details.map((detail, detailIndex) => {
                          const parts = detail.split(':');
                          return (
                            <div key={detailIndex} className="flex items-center gap-3 text-sm">
                                {getIconForDetail(detail)}
                                <div>
                                    <span className="font-semibold text-foreground">{parts[0]}:</span>
                                    <span className="text-muted-foreground ml-2">{parts.slice(1).join(':').trim()}</span>
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
      </CardContent>
    </Card>
  );
}
