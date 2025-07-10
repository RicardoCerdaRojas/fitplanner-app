'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';

type WorkoutDisplayProps = {
  routine: GenerateWorkoutRoutineOutput | null;
};

const formatRoutine = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  const formattedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  function pushList() {
    if (currentList.length > 0) {
      formattedElements.push(<ul key={`ul-${formattedElements.length}`} className="space-y-1">{currentList}</ul>);
      currentList = [];
    }
  }

  lines.forEach((line, index) => {
    line = line.trim();
    // **Block Name** -> h3
    if (line.match(/^\*\*.+\*\*$/)) {
      pushList();
      formattedElements.push(<h3 key={index} className="text-xl font-bold font-headline mt-6 mb-3 text-primary border-b pb-1">{line.replace(/\*\*/g, '')}</h3>);
    }
    // *Exercise Name* -> h4
    else if (line.match(/^\*.+\*$/)) {
      pushList();
      formattedElements.push(<h4 key={index} className="text-lg font-semibold mt-4 mb-2">{line.replace(/\*/g, '')}</h4>);
    }
    // - Detail: value -> list item
    else if (line.startsWith('- ')) {
      const content = line.substring(2);
      const parts = content.split(':');
      if (parts.length > 1) {
        currentList.push(
          <li key={index} className="flex items-center gap-2">
            <span className="text-muted-foreground">&#8226;</span>
            <span><span className="font-semibold">{parts[0]}:</span>{parts.slice(1).join(':')}</span>
          </li>
        );
      } else {
        currentList.push(<li key={index} className="flex items-center gap-2"><span className="text-muted-foreground">&#8226;</span><span>{content}</span></li>);
      }
    }
    // Fallback for any other line
    else {
      pushList();
      formattedElements.push(<p key={index} className="mb-2">{line}</p>);
    }
  });

  pushList(); // Push any remaining list items
  
  return formattedElements;
};

export function WorkoutDisplay({ routine }: WorkoutDisplayProps) {
  if (!routine || !routine.routine || routine.routine.trim() === '') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 shadow-lg animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl">Your AI-Generated Routine</CardTitle>
            <CardDescription>Here is the personalized routine generated just for you.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            {formatRoutine(routine.routine)}
        </div>
      </CardContent>
    </Card>
  );
}
