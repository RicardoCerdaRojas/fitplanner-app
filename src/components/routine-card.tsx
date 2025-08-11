
'use client';

import * as React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CheckCircle, PlayCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { RoutineDetailView } from './routine-detail-view';
import type { Routine } from './athlete-routine-list';

interface RoutineCardProps {
    routine: Routine;
    isToday?: boolean;
    variant?: 'default' | 'compact';
    onStartWorkout: (routine: Routine) => void;
    dateFormatOptions?: Intl.DateTimeFormatOptions;
}

export const RoutineCard = ({ 
    routine, 
    isToday = false, 
    variant = 'default', 
    onStartWorkout, 
    dateFormatOptions = { weekday: 'long' } 
}: RoutineCardProps) => {

    const handleStartWorkout = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStartWorkout(routine);
    };

    const totalExercises = routine.blocks?.reduce((acc, block) => acc + block.exercises.length, 0) || 0;

    // --- VISTA COMPACTA ---
    const CompactView = () => (
        <>
            <div className="flex-1 text-left">
                <p className="font-bold capitalize">{routine.routineDate.toLocaleDateString('es-ES', dateFormatOptions)}</p>
                <p className="text-sm text-muted-foreground">{routine.routineTypeName}</p>
            </div>
            {/* --- CORRECCIÓN CLAVE: Añadimos margen a la derecha (mr-2) --- */}
            <div className="flex-shrink-0 ml-4 mr-2">
                {!routine.completed ? (
                    <div
                        onClick={handleStartWorkout}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                        title="Empezar Rutina"
                    >
                        <PlayCircle className="w-5 h-5" />
                    </div>
                ) : (
                   <CheckCircle className="h-5 w-5 text-green-500" />
                )}
            </div>
        </>
    );

    // --- VISTA COMPLETA ---
    const FullView = () => (
        <div className="w-full">
            <div className="flex justify-between items-start text-left">
                <div className="flex-1 pr-4">
                    <Badge variant="secondary">Rutina de Hoy</Badge>
                    <h2 className="text-2xl font-bold text-primary-foreground pt-2">{routine.routineTypeName}</h2>
                    <p className="text-sm text-primary-foreground/80">{totalExercises} ejercicios</p>
                </div>
                {routine.completed && <Badge variant="secondary" className="bg-green-600 text-white">Completada</Badge>}
            </div>
            {!routine.completed && (
                <Button onClick={handleStartWorkout} className="w-full mt-4 bg-white/20 hover:bg-white/30"><PlayCircle className="mr-2 h-4 w-4" /> Empezar Rutina</Button>
            )}
        </div>
    );

    return (
        <AccordionItem value={routine.id} className={`border-none rounded-lg overflow-hidden group ${isToday ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-card'}`}>
            <AccordionTrigger className="p-4 w-full hover:no-underline data-[state=open]:bg-primary/10">
                {variant === 'compact' ? <CompactView /> : <FullView />}
            </AccordionTrigger>
            <AccordionContent>
                <RoutineDetailView blocks={routine.blocks} />
            </AccordionContent>
        </AccordionItem>
    );
};
