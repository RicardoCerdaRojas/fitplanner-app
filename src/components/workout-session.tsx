
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Routine, Exercise, ExerciseProgress } from './athlete-routine-list';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Dumbbell, Repeat, Clock, Video } from 'lucide-react';
import ReactPlayer from 'react-player/lazy';


// A type for the items in our session "playlist"
type SessionExercise = Exercise & {
    blockName: string;
    blockSets: string;
    blockIndex: number;
    exerciseIndex: number;
    setIndex: number;
    totalSets: number;
};


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
        } else if (!isActive && secondsLeft !== 0 && interval) {
             clearInterval(interval);
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
    
    // Create a "playlist" of all exercise sets in a circuit-style order
    const sessionPlaylist = useMemo(() => {
        const playlist: SessionExercise[] = [];
        routine.blocks.forEach((block, bIndex) => {
            const totalSets = parseInt(block.sets.match(/\d+/)?.[0] || '1', 10);
            // Loop through sets/rounds first (circuit-style)
            for (let sIndex = 0; sIndex < totalSets; sIndex++) {
                // Then loop through exercises for that round
                block.exercises.forEach((exercise, eIndex) => {
                    playlist.push({
                        ...exercise,
                        blockName: block.name,
                        blockSets: block.sets,
                        blockIndex: bIndex,
                        exerciseIndex: eIndex,
                        setIndex: sIndex,
                        totalSets: totalSets,
                    });
                });
            }
        });
        return playlist;
    }, [routine.blocks]);
  
    const [currentIndex, setCurrentIndex] = useState(() => {
        const firstUncompletedIndex = sessionPlaylist.findIndex(item => {
            const key = `${item.blockIndex}-${item.exerciseIndex}-${item.setIndex}`;
            return !routine.progress?.[key]?.completed;
        });
        return firstUncompletedIndex === -1 ? 0 : firstUncompletedIndex;
    });

    const [showVideo, setShowVideo] = useState(false);
    const [progress, setProgress] = useState<ExerciseProgress>(routine.progress || {});

    const currentItem = sessionPlaylist[currentIndex];
    const exerciseKey = `${currentItem.blockIndex}-${currentItem.exerciseIndex}-${currentItem.setIndex}`;
    const currentSetProgress = progress?.[exerciseKey];
    
    const handleProgressUpdate = (newData: { completed?: boolean; difficulty?: 'easy' | 'medium' | 'hard' }) => {
        const updatedProgressForSet = {
            ...(progress[exerciseKey] || { completed: false, difficulty: 'medium' }),
            ...newData,
        };

        const newProgressState = {
            ...progress,
            [exerciseKey]: updatedProgressForSet,
        };
        
        setProgress(newProgressState);
        onProgressChange(routine.id, exerciseKey, progress[exerciseKey] || {}, newData);
    };

    const handleNext = () => {
        setShowVideo(false);
        if (currentIndex < sessionPlaylist.length - 1) {
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
    
    const handleCompleteAndNext = () => {
        if (!currentSetProgress?.completed) {
            handleProgressUpdate({ completed: true });
        }
        handleNext();
    };

    useEffect(() => {
        setShowVideo(false);
    }, [currentIndex]);
    
    const progressPercentage = ((currentIndex) / sessionPlaylist.length) * 100;
    
    const isLastItem = currentIndex === sessionPlaylist.length - 1;
    const isCompleted = currentSetProgress?.completed || false;
    let nextButtonText = 'Next';

    if (isLastItem) {
        nextButtonText = isCompleted ? 'Finish Workout' : 'Complete & Finish';
    } else {
        nextButtonText = isCompleted ? 'Next' : 'Complete & Next';
    }


    return (
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-4 border-b pr-12">
                <DialogTitle className="font-headline text-xl">{routine.routineTypeName || routine.routineName}</DialogTitle>
                <div className="space-y-1 mt-2">
                    <Progress value={progressPercentage} />
                    <p className="text-xs text-muted-foreground text-center">Step {currentIndex + 1} of {sessionPlaylist.length}</p>
                </div>
            </DialogHeader>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-muted/20 overflow-y-auto">
                {showVideo && currentItem.videoUrl ? (
                    <div className="w-full max-w-2xl flex flex-col items-center gap-4">
                        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                           <ReactPlayer
                                url={currentItem.videoUrl}
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
                        <Button variant="outline" onClick={() => setShowVideo(false)}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Exercise
                        </Button>
                    </div>
                ) : (
                    <div className="w-full max-w-md flex flex-col items-center justify-center">
                        <p className="font-semibold text-accent">{currentItem.blockName} &bull; Set {currentItem.setIndex + 1} of {currentItem.totalSets}</p>
                        <h2 className="text-5xl font-bold font-headline my-4">{currentItem.name}</h2>
                        
                        {currentItem.repType === 'duration' && currentItem.duration ? (
                            <Timer durationString={currentItem.duration} isCurrent={!!currentItem}/>
                        ) : (
                            <div className="text-9xl font-bold font-mono text-primary flex items-center justify-center gap-4">
                                <Repeat className="h-20 w-20" />
                                <span>{currentItem.reps}</span>
                            </div>
                        )}

                        <div className="flex justify-center items-center gap-8 mt-8 text-muted-foreground">
                            {currentItem.weight && (
                                <div className="flex items-center gap-2"><Dumbbell className="w-5 h-5" /><span>{currentItem.weight}</span></div>
                            )}
                            {currentItem.videoUrl && (
                                <Button variant="outline" onClick={() => setShowVideo(true)}><Video className="w-5 h-5 mr-2" /> Watch Example</Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <DialogFooter className="p-4 border-t bg-background flex flex-col gap-4">
                 <div className="w-full">
                    <p className="text-sm font-medium text-center mb-2 text-muted-foreground">How was that set?</p>
                    <div className="grid grid-cols-3 gap-2">
                        {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                            <Button
                                key={difficulty}
                                variant={currentSetProgress?.difficulty === difficulty || (!currentSetProgress?.difficulty && difficulty === 'medium') ? 'default' : 'outline'}
                                onClick={() => handleProgressUpdate({ difficulty })}
                                className="capitalize h-12 text-base"
                            >
                                {difficulty}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex w-full items-center gap-2">
                    <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="w-1/3 h-14">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button onClick={handleCompleteAndNext} className="flex-1 h-14 text-lg font-bold bg-accent hover:bg-accent/90">
                        {nextButtonText}
                        {!isLastItem && <ChevronRight className="h-5 w-5 ml-2" />}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
}
