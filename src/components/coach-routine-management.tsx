
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Trash2, Edit, ClipboardList, Repeat, Clock, Dumbbell, Search, FilterX, Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Block, ExerciseProgress } from './athlete-routine-list'; 
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';


// A more robust, combined type for routines being managed.
export type ManagedRoutine = {
    id: string;
    memberId: string;
    userName: string;
    routineDate: Date;
    blocks: Block[];
    coachId: string;
    gymId: string;
    createdAt: FirestoreTimestamp;
    updatedAt: FirestoreTimestamp;
    routineName?: string;
    routineTypeName?: string;
    routineTypeId?: string;
    progress?: ExerciseProgress;
};

type Props = {
    routines: ManagedRoutine[];
};

export function CoachRoutineManagement({ routines }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [routineToDelete, setRoutineToDelete] = useState<ManagedRoutine | null>(null);

    const handleDeleteClick = (routine: ManagedRoutine) => {
        setRoutineToDelete(routine);
    };

    const handleSaveAsTemplate = async (routine: ManagedRoutine) => {
        const templateName = prompt("Enter a name for this new template:", routine.routineTypeName || "New Template");
        if (!templateName) return;

        try {
            const { memberId, userName, routineDate, progress, id, createdAt, updatedAt, ...templateData } = routine;
            
            const dataToSave = {
                ...templateData,
                templateName,
                createdAt: Timestamp.now(),
            };

            await addDoc(collection(db, 'routineTemplates'), dataToSave);

            toast({
                title: 'Template Saved!',
                description: `"${templateName}" has been added to your library.`,
            });
        } catch (error) {
            console.error("Error saving template:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save the routine as a template." });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!routineToDelete) return;
        setIsDeleting(routineToDelete.id);
        try {
            await deleteDoc(doc(db, 'routines', routineToDelete.id));
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
            setRoutineToDelete(null);
        }
    };

    const filteredRoutines = useMemo(() => {
        return routines.filter(routine => {
            if (!searchFilter) return true;
            const searchLower = searchFilter.toLowerCase();
            const matchesSearch = 
                (routine.routineTypeName && routine.routineTypeName.toLowerCase().includes(searchLower)) ||
                (routine.userName && routine.userName.toLowerCase().includes(searchLower));
            
            return matchesSearch;
        });
    }, [routines, searchFilter]);

    const resetFilters = () => {
        setSearchFilter('');
    };
    
    return (
        <>
            <AlertDialog open={!!routineToDelete} onOpenChange={(isOpen) => !isOpen && setRoutineToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the routine for {routineToDelete?.userName}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Manage Routines</CardTitle>
                            <CardDescription>Search for routines by routine name or member name.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline">
                               <Link href="/coach/templates">
                                 <ClipboardList className="mr-2 h-4 w-4" /> Template Library
                               </Link>
                            </Button>
                            <Button asChild>
                               <Link href="/coach/create-routine">
                                 <Plus className="mr-2 h-4 w-4" /> Create Routine
                               </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative pt-4">
                         <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                         <Input 
                            placeholder="Search routines..." 
                            value={searchFilter} 
                            onChange={(e) => setSearchFilter(e.target.value)} 
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredRoutines.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {filteredRoutines.map((routine) => (
                                <AccordionItem value={routine.id} key={routine.id} className="border rounded-lg">
                                    <div className="flex items-center justify-between w-full px-4 py-3">
                                        <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline">
                                            <div className="flex flex-col items-start">
                                                <span className="font-semibold">{routine.routineTypeName || routine.routineName || 'Untitled Routine'}</span>
                                                <span className="text-sm text-muted-foreground font-normal">
                                                    For {routine.userName} on {format(routine.routineDate, 'PPP')}
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <div className="flex items-center gap-2 pl-4">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSaveAsTemplate(routine)}>
                                               <Save className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                                                <Link href={`/coach/create-routine?edit=${routine.id}`}>
                                                   <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleDeleteClick(routine)}
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
                                    <AccordionContent className="px-4 pb-3">
                                        <div className="space-y-2 pt-2 border-t">
                                            {routine.blocks.map((block, blockIndex) => (
                                                <div key={blockIndex} className="p-2 border rounded-md bg-card/50">
                                                    <div className="flex justify-between items-center w-full mb-2">
                                                        <h4 className="font-semibold text-card-foreground">{block.name}</h4>
                                                        <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{block.sets}</span>
                                                    </div>
                                                    <div className="space-y-1 text-sm">
                                                        {block.exercises.map((ex, exIndex) => (
                                                            <div key={exIndex} className="flex justify-between items-center py-1.5 border-b border-dashed border-border/50 last:border-b-0">
                                                                <span className="text-card-foreground/90">{ex.name}</span>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    {ex.repType === 'reps' && ex.reps && (
                                                                        <span className="flex items-center gap-1.5" title="Reps">
                                                                            <Repeat className="w-4 h-4 text-primary/70" />
                                                                            <span>{ex.reps}</span>
                                                                        </span>
                                                                    )}
                                                                    {ex.repType === 'duration' && ex.duration && (
                                                                        <span className="flex items-center gap-1.5" title="Duration">
                                                                            <Clock className="w-4 h-4 text-primary/70" />
                                                                            <span>{ex.duration} min</span>
                                                                        </span>
                                                                    )}
                                                                    {ex.weight && (
                                                                        <span className="flex items-center gap-1.5" title="Weight">
                                                                            <Dumbbell className="w-4 h-4 text-primary/70" />
                                                                            <span>{ex.weight}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-8 mt-8 border-2 border-dashed rounded-lg">
                            <FilterX className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Routines Found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {searchFilter ? "Try adjusting your search terms." : "You haven't created any routines yet."}
                            </p>
                             <Button variant="outline" className="mt-4" onClick={resetFilters}>
                                Clear Search
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
