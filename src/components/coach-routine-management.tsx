
'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Trash2, Edit, ClipboardList, Search, FilterX, Plus, Copy, Calendar as CalendarIcon, Dumbbell, Repeat, Clock, Copy as CopyIcon } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from './ui/label';
import { MemberCombobox } from './ui/member-combobox';
import type { Member } from '@/app/coach/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { RoutineType } from '@/app/admin/routine-types/page';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { startOfDay, endOfDay } from 'date-fns';

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
    members: Member[];
    routineTypes: RoutineType[];
};

export function CoachRoutineManagement({ routines, members, routineTypes }: Props) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    
    // Filter states
    const [searchFilter, setSearchFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);

    // Dialog states
    const [routineToDelete, setRoutineToDelete] = useState<ManagedRoutine | null>(null);
    const [routineToTemplate, setRoutineToTemplate] = useState<ManagedRoutine | null>(null);
    const [routineToView, setRoutineToView] = useState<ManagedRoutine | null>(null);
    const [templateName, setTemplateName] = useState('');
    
    const handleOpenTemplateDialog = (routine: ManagedRoutine) => {
        setTemplateName(routine.routineTypeName || routine.routineName || 'New Template');
        setRoutineToTemplate(routine);
    };

    const handleSaveAsTemplate = async () => {
        if (!routineToTemplate) return;
        if (!templateName || templateName.trim() === '') {
            toast({ variant: 'destructive', title: 'Invalid Name', description: 'Template name cannot be empty.' });
            return;
        }

        startTransition(async () => {
            try {
                const { memberId, userName, routineDate, progress, id, createdAt, updatedAt, ...templateData } = routineToTemplate;
                
                const dataToSave = {
                    ...templateData,
                    templateName,
                    createdAt: Timestamp.now(),
                };
                
                await addDoc(collection(db, 'routineTemplates'), dataToSave);
                toast({ title: 'Template Saved!', description: `"${templateName}" has been added to your library.` });
            } catch (error) {
                console.error("Error saving template:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not save the routine as a template." });
            } finally {
                setRoutineToTemplate(null);
                setTemplateName('');
            }
        });
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
    
    const clearFilters = () => {
        setSearchFilter('');
        setMemberFilter('');
        setTypeFilter('');
        setDateFilter(undefined);
    }
    const areFiltersActive = searchFilter || memberFilter || typeFilter || dateFilter;

    const copyForWhatsapp = () => {
        if (!routineToView) return;

        let text = `*💪 ${routineToView.routineTypeName || 'Workout Routine'}*\n`;
        text += `_For ${routineToView.userName} on 📅 ${format(routineToView.routineDate, 'PPP')}_\n\n`;

        routineToView.blocks.forEach(block => {
            text += `*${block.name}* (🔁 ${block.sets})\n`;
            block.exercises.forEach(ex => {
                text += `  - ${ex.name}`;
                const details = [];
                if (ex.repType === 'reps' && ex.reps) details.push(`${ex.reps} reps`);
                if (ex.repType === 'duration' && ex.duration) details.push(`⏱️ ${ex.duration}`);
                if (ex.weight) details.push(`${ex.weight} kg`);
                if (details.length > 0) {
                    text += `: ${details.join(' / ')}`;
                }
                text += '\n';
            });
            text += '\n';
        });

        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to Clipboard!', description: 'The routine is ready to be pasted in WhatsApp.' });
    };

    const filteredRoutines = useMemo(() => {
        return routines.filter(routine => {
            const searchLower = searchFilter.toLowerCase();
            const matchesSearch = !searchFilter ||
                   (routine.routineTypeName && routine.routineTypeName.toLowerCase().includes(searchLower)) ||
                   (routine.userName && routine.userName.toLowerCase().includes(searchLower));
            
            const matchesMember = !memberFilter || routine.memberId === memberFilter;
            
            const matchesType = !typeFilter || routine.routineTypeId === typeFilter;
            
            const matchesDate = !dateFilter || !dateFilter.from || !dateFilter.to ||
                 (routine.routineDate >= startOfDay(dateFilter.from) &&
                 routine.routineDate <= endOfDay(dateFilter.to));

            return matchesSearch && matchesMember && matchesType && matchesDate;
        });
    }, [routines, searchFilter, memberFilter, typeFilter, dateFilter]);

    return (
        <>
            <Dialog open={!!routineToView} onOpenChange={(isOpen) => !isOpen && setRoutineToView(null)}>
                 <DialogContent className="sm:max-w-2xl">
                     <DialogHeader>
                         <DialogTitle className="text-2xl font-headline">{routineToView?.routineTypeName || 'Routine Details'}</DialogTitle>
                         <DialogDescription>
                            For {routineToView?.userName} on {routineToView?.routineDate ? format(routineToView.routineDate, 'PPP') : ''}
                         </DialogDescription>
                     </DialogHeader>
                     <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-4 p-4 pr-6">
                            {routineToView?.blocks.map((block, blockIndex) => (
                                <div key={blockIndex} className="p-4 border rounded-lg bg-muted/30">
                                    <div className="flex justify-between items-center w-full mb-3">
                                        <h4 className="text-lg font-bold text-card-foreground">{block.name}</h4>
                                        <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">{block.sets}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {block.exercises.map((exercise, exIndex) => (
                                            <div key={exIndex} className="p-3 rounded-md bg-background">
                                                <p className="font-semibold text-md text-card-foreground">{exercise.name}</p>
                                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                                                    {exercise.repType === 'reps' && exercise.reps && (
                                                        <div className="flex items-center gap-1.5" title="Reps"><Repeat className="w-4 h-4 text-primary" /><span>{exercise.reps} reps</span></div>
                                                    )}
                                                    {exercise.repType === 'duration' && exercise.duration && (
                                                        <div className="flex items-center gap-1.5" title="Duration"><Clock className="w-4 h-4 text-primary" /><span>{exercise.duration}</span></div>
                                                    )}
                                                    {exercise.weight && (
                                                        <div className="flex items-center gap-1.5" title="Weight"><Dumbbell className="w-4 h-4 text-primary" /><span>{exercise.weight}</span></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={copyForWhatsapp}><CopyIcon className="mr-2 h-4 w-4" /> Copy for WhatsApp</Button>
                        <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                    </DialogFooter>
                 </DialogContent>
            </Dialog>

            <Dialog open={!!routineToTemplate} onOpenChange={(isOpen) => !isOpen && setRoutineToTemplate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Routine as Template</DialogTitle>
                        <DialogDescription>
                           This will create a reusable template from {routineToTemplate?.routineTypeName}. Give it a name.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                            id="template-name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="e.g., 'Beginner Full Body'"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveAsTemplate} disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pt-4">
                        <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input 
                                placeholder="Search routines..." 
                                value={searchFilter} 
                                onChange={(e) => setSearchFilter(e.target.value)} 
                                className="pl-10"
                            />
                        </div>
                        <MemberCombobox members={members} value={memberFilter} onChange={setMemberFilter} />
                        <Select value={typeFilter} onValueChange={(value) => {
                            setTypeFilter(value === 'all' ? '' : value);
                        }}>
                            <SelectTrigger><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {routineTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFilter?.from ? (dateFilter.to ? <>{format(dateFilter.from, "LLL dd, y")} - {format(dateFilter.to, "LLL dd, y")}</> : format(dateFilter.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={dateFilter?.from} selected={dateFilter} onSelect={setDateFilter} numberOfMonths={2}/>
                                </PopoverContent>
                            </Popover>
                            {areFiltersActive && <Button variant="ghost" onClick={clearFilters}><FilterX className="mr-2 h-4 w-4" /> Clear</Button>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredRoutines.length > 0 ? (
                            filteredRoutines.map((routine) => (
                                <div 
                                    key={routine.id} 
                                    className="flex items-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                    onClick={() => setRoutineToView(routine)}
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-lg">{routine.routineTypeName || routine.routineName || 'Untitled Routine'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            For {routine.userName} on {format(routine.routineDate, 'PPP')}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                            <span>{routine.blocks.length} Blocks</span>
                                            <span>&bull;</span>
                                            <span>{routine.blocks.reduce((acc, block) => acc + block.exercises.length, 0)} Exercises</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 pl-4">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenTemplateDialog(routine); }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/coach/create-routine?edit=${routine.id}`} onClick={(e) => e.stopPropagation()}>
                                               <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); setRoutineToDelete(routine); }}
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
                                    Try adjusting your filters or creating a new routine.
                                </p>
                                {areFiltersActive && <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
