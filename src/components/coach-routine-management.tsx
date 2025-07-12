
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Trash2, Edit, ClipboardList, Search, FilterX, Plus, Copy } from 'lucide-react';
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
import { Separator } from './ui/separator';


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
    const { toast } = useToast();
    const [searchFilter, setSearchFilter] = useState('');
    const [routineToDelete, setRoutineToDelete] = useState<ManagedRoutine | null>(null);

    const handleSaveAsTemplate = async (routine: ManagedRoutine) => {
        const templateName = prompt("Enter a name for this new template:", routine.routineTypeName || "New Template");
        
        if (templateName === null || templateName.trim() === '') {
            if (templateName !== null) { // Only show toast if user didn't cancel
                toast({ variant: "destructive", title: "Invalid Name", description: "Template name cannot be empty." });
            }
            return;
        }

        try {
            const { id, memberId, userName, routineDate, progress, createdAt, updatedAt, ...templateData } = routine;
            
            const dataToSave = { 
                ...templateData, 
                templateName, 
                createdAt: Timestamp.now() 
            };

            await addDoc(collection(db, 'routineTemplates'), dataToSave);
            toast({ title: 'Template Saved!', description: `"${templateName}" has been added to your library.` });
        } catch (error) {
            console.error("Error saving template:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save the routine as a template." });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!routineToDelete) return;
        try {
            await deleteDoc(doc(db, 'routines', routineToDelete.id));
            toast({ title: 'Success!', description: 'The routine has been deleted.' });
        } catch (error) {
            console.error('Error deleting routine:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the routine.' });
        } finally {
            setRoutineToDelete(null);
        }
    };

    const filteredRoutines = useMemo(() => {
        return routines.filter(routine => {
            if (!searchFilter) return true;
            const searchLower = searchFilter.toLowerCase();
            return (routine.routineTypeName && routine.routineTypeName.toLowerCase().includes(searchLower)) ||
                   (routine.userName && routine.userName.toLowerCase().includes(searchLower));
        });
    }, [routines, searchFilter]);

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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Manage Routines</CardTitle>
                            <CardDescription>Search for routines by routine name or member name.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                               <Link href="/coach/templates">
                                 <ClipboardList className="mr-2 h-4 w-4" /> Template Library
                               </Link>
                            </Button>
                            <Button asChild className="w-full sm:w-auto">
                               <Link href="/coach/create-routine">
                                 <Plus className="mr-2 h-4 w-4" /> Create Routine
                               </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative pt-4">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input 
                            placeholder="Search routines..." 
                            value={searchFilter} 
                            onChange={(e) => setSearchFilter(e.target.value)} 
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredRoutines.length > 0 ? (
                            filteredRoutines.map((routine) => (
                                <div key={routine.id} className="border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div>
                                        <p className="font-semibold">{routine.routineTypeName || routine.routineName || 'Untitled Routine'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            For {routine.userName} on {format(routine.routineDate, 'PPP')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleSaveAsTemplate(routine)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/coach/create-routine?edit=${routine.id}`}>
                                               <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setRoutineToDelete(routine)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                                <FilterX className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No Routines Found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {searchFilter ? "Try adjusting your search terms." : "You haven't created any routines yet."}
                                </p>
                                <Button variant="outline" className="mt-4" onClick={() => setSearchFilter('')}>
                                    Clear Search
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
