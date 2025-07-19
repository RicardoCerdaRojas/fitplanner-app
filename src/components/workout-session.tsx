
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Routine, Exercise, ExerciseProgress } from './athlete-routine-list';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Dumbbell, Repeat, Clock, Video, CheckCircle2, Circle, Info } from 'lucide-react';
import ReactPlayer from 'react-player/lazy';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';


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
        let seconds = 0;
        const minMatch = str.match(/(\d+)\s*m/);
        const secMatch = str.match(/(\d+)\s*s/);
        if (minMatch) seconds += parseInt(minMatch[1], 10) * 60;
        if (secMatch) seconds += parseInt(secMatch[1], 10);
        if (!minMatch && !secMatch) { // fallback for just numbers
            const numMatch = str.match(/(\d+)/);
            if (numMatch) seconds = parseInt(numMatch[0], 10);
        }
        return seconds;
    };

    const initialSeconds = useMemo(() => parseDuration(durationString), [durationString]);
    
    type Phase = 'idle' | 'countdown' | 'running' | 'paused' | 'finished';
    const [phase, setPhase] = useState<Phase>('idle');
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const [countdown, setCountdown] = useState(5);
    
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        setAudioRef(new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"));
    }, [])

    // Effect to handle timer ticks
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (phase === 'countdown' && countdown > 0) {
            interval = setInterval(() => {
                setCountdown(c => c - 1);
            }, 1000);
        } else if (phase === 'countdown' && countdown <= 0) {
            setPhase('running');
        } else if (phase === 'running' && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(s => s - 1);
            }, 1000);
        } else if (phase === 'running' && secondsLeft <= 0) {
            setPhase('finished');
            audioRef?.play().catch(e => console.error("Audio play failed:", e));
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [phase, countdown, secondsLeft, audioRef]);

    // Effect to reset timer when the exercise changes
    useEffect(() => {
        setSecondsLeft(initialSeconds);
        setCountdown(5);
        setPhase('idle');
    }, [initialSeconds, isCurrent]);

    const handlePrimaryAction = () => {
        if (phase === 'idle') {
            setPhase('countdown');
        } else if (phase === 'running') {
            setPhase('paused');
        } else if (phase === 'paused') {
            setPhase('running');
        }
    };

    const reset = () => {
        setPhase('idle');
        setSecondsLeft(initialSeconds);
        setCountdown(5);
    };

    const renderTime = () => {
        if (phase === 'countdown') {
            return (
                <>
                    <p className="text-2xl font-semibold text-muted-foreground mb-2">Get Ready!</p>
                    <div className="text-9xl font-bold font-mono text-accent tabular-nums">
                        {countdown}
                    </div>
                </>
            );
        }
        
        const displaySeconds = (phase === 'finished') ? 0 : secondsLeft;
        const minutes = Math.floor(displaySeconds / 60);
        const seconds = displaySeconds % 60;
        
        return (
            <div className="text-9xl font-bold font-mono text-primary tabular-nums">
                <span>{String(minutes).padStart(2, '0')}</span>:<span>{String(seconds).padStart(2, '0')}</span>
            </div>
        );
    };

    const getButtonProps = () => {
        switch(phase) {
            case 'idle': return { text: 'Start', icon: <Play className="mr-2 h-6 w-6" />, disabled: false, variant: 'default' as const };
            case 'countdown': return { text: 'Starting...', icon: <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-2"></div>, disabled: true, variant: 'default' as const };
            case 'running': return { text: 'Pause', icon: <Pause className="mr-2 h-6 w-6" />, disabled: false, variant: 'outline' as const };
            case 'paused': return { text: 'Resume', icon: <Play className="mr-2 h-6 w-6" />, disabled: false, variant: 'default' as const };
            case 'finished': return { text: 'Done!', icon: <CheckCircle2 className="mr-2 h-6 w-6" />, disabled: true, variant: 'default' as const };
        }
    }
    const buttonProps = getButtonProps();

    return (
        <div className="flex flex-col items-center gap-4">
            {renderTime()}
            <div className="flex items-center gap-4 mt-4">
                <Button onClick={handlePrimaryAction} size="lg" disabled={buttonProps.disabled} variant={buttonProps.variant}>
                    {buttonProps.icon} {buttonProps.text}
                </Button>
                <Button onClick={reset} size="lg" variant="ghost" disabled={phase === 'idle' || phase === 'countdown'}>
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
    const { user, userProfile } = useAuth();
    const sessionId = user?.uid; 

    const sessionPlaylist = useMemo(() => {
        const playlist: SessionExercise[] = [];
        routine.blocks?.forEach((block, bIndex) => {
            if (block.exercises && block.exercises.length > 0) {
                const totalSets = parseInt(block.sets.match(/\d+/)?.[0] || '1', 10);
                for (let sIndex = 0; sIndex < totalSets; sIndex++) {
                    // This was creating one playlist entry per set, we want one per exercise.
                    // The logic below is better.
                    // Let's create one entry per set of an exercise.
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
    
    const sessionDocRef = useMemo(() => {
        if (!sessionId) return null;
        return doc(db, "workoutSessions", sessionId);
    }, [sessionId]);

    // Effect for Firestore: Update live session document for gym admin view
    useEffect(() => {
        if (!sessionDocRef || !user || !userProfile?.gymId) return;

        const updateSessionDocument = async () => {
             if (!sessionDocRef || !user || !userProfile?.gymId) return;

            const currentItem = sessionPlaylist[currentIndex];
            if (!currentItem) return;

            const exerciseKey = `${currentItem.blockIndex}-${currentItem.exerciseIndex}-${currentItem.setIndex}`;
            const docSnapshot = await getDoc(sessionDocRef);

            const sessionData = {
                userId: user.uid,
                userName: userProfile.name || user.email || 'Unknown User',
                gymId: userProfile.gymId,
                routineId: routine.id,
                routineName: routine.routineTypeName || routine.routineName || 'Untitled Routine',
                startTime: docSnapshot.exists() ? docSnapshot.data().startTime : Timestamp.now(),
                status: 'active' as const,
                currentExerciseName: currentItem.name,
                currentSetIndex: currentIndex,
                totalSetsInSession: sessionPlaylist.length,
                lastReportedDifficulty: progress[exerciseKey]?.difficulty || null,
                lastUpdateTime: Timestamp.now(),
            };
            
            try {
                await setDoc(sessionDocRef, sessionData, { merge: true });
            } catch (error) {
                console.error("Error creating/updating session document:", error);
            }
        };

        updateSessionDocument();

        const heartbeatInterval = setInterval(updateSessionDocument, 15000);

        return () => {
            clearInterval(heartbeatInterval);
            if (sessionDocRef) {
                deleteDoc(sessionDocRef);
            }
        };
    }, [sessionDocRef, user, userProfile, routine, sessionPlaylist, currentIndex, progress]);


    const handleSessionEnd = () => {
        onSessionEnd();
    };

    const currentItem = sessionPlaylist[currentIndex];
    if (!currentItem) {
        useEffect(() => {
            onSessionEnd();
        }, [onSessionEnd]);
        return null;
    }

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

    const toggleCompletion = () => {
        handleProgressUpdate({ completed: !currentSetProgress?.completed });
    };

    const handleNext = () => {
        setShowVideo(false);
        if (currentIndex < sessionPlaylist.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handleSessionEnd();
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
    
    const progressPercentage = ((currentIndex) / sessionPlaylist.length) * 100;
    
    const isLastItem = currentIndex === sessionPlaylist.length - 1;
    const isCompleted = currentSetProgress?.completed || false;
    

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
                        
                        {currentItem.description && (
                            <div className="mb-6 p-4 bg-background/50 border rounded-lg text-sm text-muted-foreground max-w-md text-left flex items-start gap-3">
                                <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                                <p>{currentItem.description}</p>
                            </div>
                        )}
                        
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
                    <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0} className="h-14 w-14">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        onClick={toggleCompletion}
                        variant={isCompleted ? 'outline' : 'default'}
                        className="flex-1 h-14 text-lg font-bold"
                    >
                        {isCompleted ? <CheckCircle2 className="mr-2 h-5 w-5"/> : <Circle className="mr-2 h-5 w-5"/>}
                        {isCompleted ? 'Completed' : 'Mark as Complete'}
                    </Button>
                    <Button 
                        size="icon" 
                        onClick={handleNext}
                        className="h-14 w-14 bg-accent hover:bg-accent/90"
                    >
                       {isLastItem ? 'End' : <ChevronRight className="h-5 w-5" />}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
}
