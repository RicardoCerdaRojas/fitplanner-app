'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Routine } from './athlete-routine-list'; 
import type { CoachRoutine } from './coach-workout-display';
import type { Timestamp } from 'firebase/firestore';


// A more robust, combined type for routines being managed.
export type ManagedRoutine = Omit<Routine, 'routineDate'> & Omit<CoachRoutine, 'routineDate'> & {
    routineDate: Date;
    createdAt: Timestamp;
};


type Props = {
    routines: ManagedRoutine[];
    onEdit: (routine: ManagedRoutine) => void;
};

export function CoachRoutineManagement({ routines, onEdit }: Props) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (routineId: string) => {
        if (!window.confirm('Are you sure you want to delete this routine permanently?')) {
            return;
        }
        setIsDeleting(routineId);
        try {
            await deleteDoc(doc(db, 'routines', routineId));
            toast({
                title: 'Success!',
                description: 'The routine has been deleted.',
            });
        } catch (error) {
            console.error('Error deleting routine:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the routine.',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const routinesByAthlete = routines.reduce((acc, routine) => {
        const { athleteId, userName } = routine;
        if (!acc[athleteId]) {
            acc[athleteId] = { name: userName, routines: [] };
        }
        acc[athleteId].routines.push(routine);
        return acc;
    }, {} as Record<string, { name: string; routines: ManagedRoutine[] }>);

    const athleteIds = Object.keys(routinesByAthlete);

    if (routines.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-8 mt-8 border-2 border-dashed rounded-lg">
                <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Routines Found</h3>
                <p className="text-muted-foreground">You haven't created any routines yet.</p>
                <p className="text-muted-foreground text-sm mt-1">Switch to the 'Create / Edit' tab to get started.</p>
            </div>
        );
    }
    
    return (
        <div className="mt-4">
            <Tabs defaultValue={athleteIds[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {athleteIds.map((athleteId) => (
                        <TabsTrigger key={athleteId} value={athleteId}>
                            {routinesByAthlete[athleteId].name}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {athleteIds.map((athleteId) => (
                    <TabsContent key={athleteId} value={athleteId}>
                        {routinesByAthlete[athleteId].routines.length === 0 ? (
                            <p className="text-muted-foreground text-center mt-4">No routines for this athlete.</p>
                        ) : (
                            <Accordion type="single" collapsible className="w-full space-y-2 mt-4">
                                {routinesByAthlete[athleteId].routines.map((routine) => (
                                    <AccordionItem value={routine.id} key={routine.id} className="border rounded-lg px-2">
                                        <div className="flex items-center justify-between w-full">
                                            <AccordionTrigger className="flex-1 py-3 px-2 text-left hover:no-underline">
                                                Workout for {format(routine.routineDate, 'PPP')}
                                            </AccordionTrigger>
                                            <div className="flex items-center gap-2 pr-2">
                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(routine)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDelete(routine.id)}
                                                    disabled={isDeleting === routine.id}
                                                >
                                                    {isDeleting === routine.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground"></div>
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <AccordionContent className="px-2 pb-3">
                                            <div className="space-y-2 pt-2 border-t">
                                                {routine.blocks.map((block, blockIndex) => (
                                                    <div key={blockIndex} className="p-2 border rounded-md bg-card/50">
                                                        <div className="flex justify-between items-center w-full mb-2">
                                                            <h4 className="font-semibold text-card-foreground">{block.name}</h4>
                                                            <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{block.sets}</span>
                                                        </div>
                                                        <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                                                            {block.exercises.map((ex, exIndex) => <li key={exIndex}>{ex.name}</li>)}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
