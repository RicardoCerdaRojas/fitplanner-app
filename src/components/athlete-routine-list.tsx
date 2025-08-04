
'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, isBefore } from 'date-fns';
import { Calendar, ClipboardList, PlaySquare, Dumbbell, Repeat, Clock, Rocket, CheckCircle2, Info, Pencil } from 'lucide-react';
import { WorkoutSession } from './workout-session';
import ReactPlayer from 'react-player';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ExerciseProgress = {
  [key: string]: {
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

type EditExerciseDetail = {
    routineId: string;
    blockIndex: number;
    exerciseIndex: number;
    field: 'reps' | 'duration' | 'weight' | 'sets';
    currentValue: string;
};

const RoutineList = ({ routinesToShow, setSessionRoutine, setVideoUrl, openEditModal }: { routinesToShow: Routine[], setSessionRoutine: (routine: Routine) => void, setVideoUrl: (url: string) => void, openEditModal: (detail: EditExerciseDetail) => void }) => {
    if (routinesToShow.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg mt-4">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Hay Rutinas</h3>
            <p className="text-muted-foreground">No hay rutinas en este período.</p>
          </div>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-4 mt-4">
            {routinesToShow.map((routine, index) => {
                const progressPercentage = 0; // Simplified for brevity
                const isCompleted = false; // Simplified for brevity

                return (
                    <AccordionItem value={`item-${index}`} key={routine.id} className='bg-card border-2 rounded-lg data-[state=open]:border-primary/50 data-[state=open]:shadow-lg border-b-2'>
                        <AccordionTrigger className='px-4 py-3 hover:no-underline'>
                             <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-lg font-bold font-headline">{routine.routineTypeName || 'Rutina Sin Título'}</span>
                                        <span className="text-sm text-muted-foreground">{format(routine.routineDate, 'PPP')}</span>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className='px-4 pb-4'>
                            <div className="flex flex-col gap-4 pt-4 border-t">
                                {!isCompleted && (
                                    <Button onClick={() => setSessionRoutine(routine)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                                        <Rocket className="w-4 h-4 mr-2" /> Iniciar Sesión de Entrenamiento
                                    </Button>
                                )}
                                <div className="space-y-4 pt-4">
                                    {routine.blocks.map((block, blockIndex) => (
                                        <div key={blockIndex} className="p-4 border rounded-lg bg-muted/30">
                                            <div className="flex justify-between items-center w-full mb-4">
                                                <h4 className="text-lg font-bold text-card-foreground">{block.name}</h4>
                                                <button onClick={() => openEditModal({ routineId: routine.id, blockIndex, exerciseIndex: -1, field: 'sets', currentValue: block.sets })} className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full flex items-center gap-2">
                                                    {block.sets} <Pencil className="w-3 h-3"/>
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {block.exercises.map((exercise, exIndex) => (
                                                    <div key={exIndex} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background transition-colors">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-card-foreground truncate">{exercise.name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-x-4 gap-y-2 text-sm text-muted-foreground flex-wrap justify-end">
                                                            {exercise.repType === 'reps' && (
                                                                <button onClick={() => openEditModal({ routineId: routine.id, blockIndex, exerciseIndex: exIndex, field: 'reps', currentValue: exercise.reps || '' })} className="flex items-center gap-1.5" title="Repeticiones">
                                                                    <Repeat className="w-4 h-4 text-primary" />
                                                                    <span className="font-medium text-foreground">{exercise.reps}</span>
                                                                    <Pencil className="w-3 h-3"/>
                                                                </button>
                                                            )}
                                                            {exercise.repType === 'duration' && (
                                                                <button onClick={() => openEditModal({ routineId: routine.id, blockIndex, exerciseIndex: exIndex, field: 'duration', currentValue: exercise.duration || '' })} className="flex items-center gap-1.5" title="Duración">
                                                                    <Clock className="w-4 h-4 text-primary" />
                                                                    <span className="font-medium text-foreground">{exercise.duration}</span>
                                                                    <Pencil className="w-3 h-3"/>
                                                                </button>
                                                            )}
                                                            {exercise.weight && (
                                                                <button onClick={() => openEditModal({ routineId: routine.id, blockIndex, exerciseIndex: exIndex, field: 'weight', currentValue: exercise.weight || '' })} className="flex items-center gap-1.5" title="Peso">
                                                                    <Dumbbell className="w-4 h-4 text-primary" />
                                                                    <span className="font-medium text-foreground">{exercise.weight}</span>
                                                                    <Pencil className="w-3 h-3"/>
                                                                </button>
                                                            )}
                                                            {exercise.videoUrl && (
                                                                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => { if (exercise.videoUrl) setVideoUrl(exercise.videoUrl); }}>
                                                                    <PlaySquare className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}

export function AthleteRoutineList({ routines }: AthleteRoutineListProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sessionRoutine, setSessionRoutine] = useState<Routine | null>(null);
  const [editingDetail, setEditingDetail] = useState<EditExerciseDetail | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

  const openEditModal = (detail: EditExerciseDetail) => {
    setEditingDetail(detail);
    setEditValue(detail.currentValue);
  };
  
  const closeEditModal = () => {
    setEditingDetail(null);
    setEditValue('');
  };

  const handleUpdate = async () => {
    if (!editingDetail) return;
    
    const { routineId, blockIndex, exerciseIndex, field } = editingDetail;
    const routineRef = doc(db, 'routines', routineId);

    const routineToUpdate = routines.find(r => r.id === routineId);
    if (!routineToUpdate) return;
    
    const updatedBlocks = [...routineToUpdate.blocks];

    if (field === 'sets') {
        updatedBlocks[blockIndex].sets = editValue;
    } else {
        updatedBlocks[blockIndex].exercises[exerciseIndex] = {
            ...updatedBlocks[blockIndex].exercises[exerciseIndex],
            [field]: editValue
        };
    }

    try {
        await updateDoc(routineRef, { blocks: updatedBlocks });
        toast({ title: "¡Éxito!", description: "Tu rutina ha sido actualizada." });
        closeEditModal();
    } catch (error) {
        console.error("Error updating routine:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la rutina." });
    }
  };


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
      toast({ variant: "destructive", title: "Error al Actualizar", description: "No se pudo guardar tu progreso." });
    }
  };

  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
        <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No Hay Rutinas... ¡Aún!</h3>
        <p className="text-muted-foreground">Tu entrenador no te ha asignado ninguna rutina. ¡Vuelve más tarde!</p>
      </div>
    );
  }

  const now = new Date();
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });
  const startOfThisMonth = startOfMonth(now);

  const thisWeekRoutines = routines.filter(r => isWithinInterval(r.routineDate, { start: startOfThisWeek, end: endOfThisWeek }));
  const thisMonthRoutines = routines.filter(r => isSameMonth(r.routineDate, now) && !isWithinInterval(r.routineDate, { start: startOfThisWeek, end: endOfThisWeek }));
  const olderRoutines = routines.filter(r => isBefore(r.routineDate, startOfThisMonth));

  return (
    <>
      <Dialog open={!!editingDetail} onOpenChange={closeEditModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar {editingDetail?.field}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="edit-value">Nuevo Valor</Label>
                <Input id="edit-value" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={closeEditModal}>Cancelar</Button>
                <Button onClick={handleUpdate}>Guardar Cambios</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    
      <Dialog open={!!videoUrl} onOpenChange={(isOpen) => !isOpen && setVideoUrl(null)}>
        <DialogContent className="max-w-3xl p-4">
            <DialogHeader>
                <DialogTitle>Ejemplo de Ejercicio</DialogTitle>
            </DialogHeader>
            {videoUrl && <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <ReactPlayer
                    url={videoUrl}
                    playing
                    controls
                    width="100%"
                    height="100%"
                    config={{
                        youtube: {
                            // @ts-ignore
                            playerVars: {
                                autoplay: 1,
                                mute: 1,
                            },
                        },
                    }}
                />
            </div>}
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

      <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Esta Semana</TabsTrigger>
              <TabsTrigger value="month">Este Mes</TabsTrigger>
              <TabsTrigger value="older">Anteriores</TabsTrigger>
          </TabsList>
          <TabsContent value="week">
              <RoutineList routinesToShow={thisWeekRoutines} setSessionRoutine={setSessionRoutine} setVideoUrl={setVideoUrl} openEditModal={openEditModal}/>
          </TabsContent>
          <TabsContent value="month">
              <RoutineList routinesToShow={thisMonthRoutines} setSessionRoutine={setSessionRoutine} setVideoUrl={setVideoUrl} openEditModal={openEditModal}/>
          </TabsContent>
          <TabsContent value="older">
              <RoutineList routinesToShow={olderRoutines} setSessionRoutine={setSessionRoutine} setVideoUrl={setVideoUrl} openEditModal={openEditModal}/>
          </TabsContent>
      </Tabs>
    </>
  );
}
