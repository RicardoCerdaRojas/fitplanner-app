
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Routine, ExerciseProgress } from './athlete-routine-list';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Dumbbell, Repeat, Clock, Video } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import ReactPlayer from 'react-player/lazy';

// Timer Component
const Timer = ({ durationString, isCurrent }: { durationString: string; isCurrent: boolean }) => {
    const parseDuration = (str: string) => {
        const match = str.match(/(\d+)/);
        return match ? parseInt(match[0], 10) * 60 : 0;
    };

    const initialSeconds = useMemo(() => parseDuration(durationString), [durationString]);
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setSecondsLeft(initialSeconds);
        setIsActive(false);
    }, [initialSeconds, isCurrent]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(seconds => seconds - 1);
            }, 1000);
        } else if (secondsLeft === 0) {
            setIsActive(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsLeft]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setSecondsLeft(initialSeconds);
    };

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-8xl font-bold font-mono text-primary tabular-nums">
                <span>{String(minutes).padStart(2, '0')}</span>:<span>{String(seconds).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-4">
                <Button onClick={toggle} size="lg" variant={isActive ? "outline" : "default"}>
                    {isActive ? <Pause className="mr-2 h-6 w-6" /> : <Play className="mr-2 h-6 w-6" />}
                    {isActive ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={reset} size="lg" variant="ghost">
                    <RotateCcw className="mr-2 h-6 w-6" />
                    Reset
                </Button>
            </div>
        </div>
    );
};


type WorkoutSessionProps = {
  routine: Routine;
  onSessionEnd: () => void;
  onProgressChange: (routineId: string, exerciseKey: string, currentProgress: any, newProgress: { completed?: boolean; difficulty?: 'easy' | 'medium' | 'hard' }) => void;
};

export function WorkoutSession({ routine, onSessionEnd, onProgressChange }: WorkoutSessionProps) {
    const allExercises = useMemo(() => routine.blocks.flatMap((block, bIndex) => 
        block.exercises.map((exercise, eIndex) => ({ 
            ...exercise,
            blockName: block.name,
            sets: block.sets,
            blockIndex: bIndex, 
            exerciseIndex: eIndex 
        }))
    ), [routine.blocks]);
  
    const [currentIndex, setCurrentIndex] = useState(() => {
        const firstUncompletedIndex = allExercises.findIndex(exercise => {
            const key = `${exercise.blockIndex}-${exercise.exerciseIndex}`;
            return !routine.progress?.[key]?.completed;
        });
        return firstUncompletedIndex === -1 ? 0 : firstUncompletedIndex;
    });
    const [showVideo, setShowVideo] = useState(false);
    const [progress, setProgress] = useState<ExerciseProgress>(routine.progress || {});

    const currentExerciseWithMeta = allExercises[currentIndex];
    const exerciseKey = `${currentExerciseWithMeta.blockIndex}-${currentExerciseWithMeta.exerciseIndex}`;
    const currentExerciseProgress = progress?.[exerciseKey];
    
    const handleProgressUpdate = (newData: { completed?: boolean; difficulty?: 'easy' | 'medium' | 'hard' }) => {
        const updatedProgressForExercise = {
            ...(progress[exerciseKey] || { completed: false }),
            ...newData,
        };

        const newProgressState = {
            ...progress,
            [exerciseKey]: updatedProgressForExercise,
        };
        
        setProgress(newProgressState);
        onProgressChange(routine.id, exerciseKey, progress[exerciseKey] || {}, newData);
    };

    const handleNext = () => {
        setShowVideo(false);
        if (currentIndex < allExercises.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onSessionEnd();
        }
    };

    const handlePrev = () => {
        setShowVideo(false);
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };
    
    useEffect(() => {
        setShowVideo(false);
    }, [currentIndex]);
    
    const progressPercentage = ((currentIndex + 1) / allExercises.length) * 100;

    return (
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-4 border-b pr-12">
                <DialogTitle className="font-headline text-xl">{routine.routineTypeName || routine.routineName}</DialogTitle>
                <div className="space-y-1 mt-2">
                    <Progress value={progressPercentage} />
                    <p className="text-xs text-muted-foreground text-center">Exercise {currentIndex + 1} of {allExercises.length}</p>
                </div>
            </DialogHeader>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-muted/20 overflow-y-auto">
                {showVideo && currentExerciseWithMeta.videoUrl ? (
                    <div className="w-full max-w-2xl flex flex-col items-center gap-4">
                        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                           <ReactPlayer
                                url={currentExerciseWithMeta.videoUrl}
                                playing
                                controls
                                width="100%"
                                height="100%"
                            />
                        </div>
                        <Button variant="outline" onClick={() => setShowVideo(false)}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Exercise
                        </Button>
                    </div>
                ) : (
                    <Card className="w-full max-w-md bg-background shadow-xl">
                        <CardContent className="p-8">
                            <p className="font-semibold text-accent">{currentExerciseWithMeta.blockName} ({currentExerciseWithMeta.sets})</p>
                            <h2 className="text-4xl font-bold font-headline my-4">{currentExerciseWithMeta.name}</h2>
                            
                            {currentExerciseWithMeta.repType === 'duration' && currentExerciseWithMeta.duration ? (
                                <Timer durationString={currentExerciseWithMeta.duration} isCurrent={!!currentExerciseWithMeta}/>
                            ) : (
                                <div className="text-8xl font-bold font-mono text-primary flex items-center justify-center gap-4">
                                    <Repeat className="h-16 w-16" />
                                    <span>{currentExerciseWithMeta.reps}</span>
                                </div>
                            )}

                            <div className="flex justify-center items-center gap-8 mt-8 text-muted-foreground">
                                {currentExerciseWithMeta.weight && (
                                    <div className="flex items-center gap-2"><Dumbbell className="w-5 h-5" /><span>{currentExerciseWithMeta.weight}</span></div>
                                )}
                                {currentExerciseWithMeta.videoUrl && (
                                    <Button variant="outline" onClick={() => setShowVideo(true)}><Video className="w-5 h-5 mr-2" /> Watch Example</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <DialogFooter className="p-4 border-t bg-background sm:justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id={`session-cb-${exerciseKey}`}
                            checked={currentExerciseProgress?.completed || false}
                            onCheckedChange={(checked) => handleProgressUpdate({ completed: !!checked })}
                        />
                        <label htmlFor={`session-cb-${exerciseKey}`} className="text-sm font-medium">Mark as Complete</label>
                    </div>
                    <Select 
                        onValueChange={(value: 'easy' | 'medium' | 'hard') => handleProgressUpdate({ difficulty: value })}
                        value={currentExerciseProgress?.difficulty}
                    >
                        <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Rate Difficulty" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
                        <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <Button onClick={handleNext}>
                        {currentIndex === allExercises.length - 1 ? 'Finish Workout' : 'Next'} <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                 </div>
            </DialogFooter>
        </DialogContent>
    );
}
