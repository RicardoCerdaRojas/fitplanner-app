
'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Dumbbell, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { YouTubePlayer } from './youtube-player';
import { getYouTubeId } from '@/lib/utils'; // <-- Importar desde la ubicación central
import type { Block } from './athlete-routine-list';


interface RoutineDetailViewProps {
    blocks: Block[];
}

const VideoPlayerModal = ({ videoUrl, exerciseName }: { videoUrl: string, exerciseName: string }) => {
    const videoId = getYouTubeId(videoUrl);

    if (!videoId) {
        return (
            <button title="Video no disponible o URL no válida" className="flex items-center cursor-not-allowed">
                <Youtube className="w-5 h-5 text-muted-foreground" />
            </button>
        );
    }
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button title="Ver video de ejemplo" className="flex items-center">
                    <Youtube className="w-5 h-5 text-red-500 hover:text-red-600" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0">
                <DialogHeader className="p-4">
                    <DialogTitle>{exerciseName}</DialogTitle>
                    <DialogDescription>Video de ejemplo del ejercicio.</DialogDescription>
                </DialogHeader>
                <YouTubePlayer videoId={videoId} />
            </DialogContent>
        </Dialog>
    );
};

export const RoutineDetailView = ({ blocks }: RoutineDetailViewProps) => {
    if (!blocks || blocks.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">Esta rutina no tiene ejercicios definidos.</div>;
    }

    return (
        <div className="p-4 space-y-4 bg-background/50 rounded-b-lg">
            {blocks.map((block, index) => (
                <div key={index} className="space-y-3">
                    <h3 className="font-bold text-lg">{block.name} - <span className="text-primary">{block.sets} Sets</span></h3>
                    <div className="space-y-3">
                        {block.exercises.map((exercise, i) => (
                            <Card key={i} className="p-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-semibold">{exercise.name}</p>
                                        {exercise.description && <p className="text-xs text-muted-foreground mt-1">{exercise.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 pl-2">
                                        {exercise.repType === 'reps' ? (
                                            <Badge variant="outline"><Dumbbell className="w-3 h-3 mr-1" />{exercise.reps} reps {exercise.weight && `x ${exercise.weight}kg`}</Badge>
                                        ) : (
                                            <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{exercise.duration}</Badge>
                                        )}
                                        {exercise.videoUrl && <VideoPlayerModal videoUrl={exercise.videoUrl} exerciseName={exercise.name} />}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
