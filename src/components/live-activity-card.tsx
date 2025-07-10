'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User, Clock, Smile, Meh, Frown } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export type WorkoutSessionData = {
    id: string;
    userId: string;
    userName: string;
    gymId: string;
    routineId: string;
    routineName: string;
    startTime: Timestamp;
    lastUpdateTime: Timestamp;
    status: 'active' | 'completed';
    currentExerciseName: string;
    currentSetIndex: number;
    totalSetsInSession: number;
    lastReportedDifficulty?: 'easy' | 'medium' | 'hard';
};

const difficultyMap = {
    easy: { text: 'Easy', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: <Smile className="h-3 w-3" /> },
    medium: { text: 'Medium', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', icon: <Meh className="h-3 w-3" /> },
    hard: { text: 'Hard', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: <Frown className="h-3 w-3" /> },
};


const useElapsedTime = (startTime: Timestamp) => {
    const [elapsedTime, setElapsedTime] = useState('00:00');

    useEffect(() => {
        const timer = setInterval(() => {
            if (!startTime) {
                setElapsedTime('00:00');
                return;
            }
            const start = startTime.toDate();
            const now = new Date();
            const diff = now.getTime() - start.getTime();

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setElapsedTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    return elapsedTime;
};


export function LiveActivityCard({ session }: { session: WorkoutSessionData }) {
    const elapsedTime = useElapsedTime(session.startTime);
    const progressPercentage = session.totalSetsInSession > 0
        ? Math.round(((session.currentSetIndex + 1) / session.totalSetsInSession) * 100)
        : 0;
        
    const difficulty = session.lastReportedDifficulty ? difficultyMap[session.lastReportedDifficulty] : null;

    return (
        <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
                <Avatar>
                    <AvatarFallback>{session.userName?.charAt(0) || <User/>}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{session.userName}</CardTitle>
                    <CardDescription className="truncate">{session.routineName}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between gap-4">
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-baseline">
                            <p className="text-sm font-medium text-muted-foreground">Progress</p>
                            <p className="text-xs text-muted-foreground">
                                Set {session.currentSetIndex + 1} / {session.totalSetsInSession}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Progress value={progressPercentage} className="flex-1 h-2" />
                            <span className="text-sm font-semibold w-10 text-right">{progressPercentage}%</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Exercise</p>
                        <p className="font-semibold text-card-foreground truncate" title={session.currentExerciseName}>{session.currentExerciseName}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1.5" title="Time Elapsed">
                        <Clock className="h-4 w-4" />
                        <span>{elapsedTime}</span>
                    </div>
                    {difficulty && (
                         <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", difficulty.className)}>
                            {difficulty.icon}
                            {difficulty.text}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
