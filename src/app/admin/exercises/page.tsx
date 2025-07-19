
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Dumbbell, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { TrialEnded } from '@/components/trial-ended';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const exerciseSchema = z.object({
  name: z.string().min(2, 'Exercise name must be at least 2 characters.'),
  description: z.string().optional(),
  videoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof exerciseSchema>;

export type LibraryExercise = {
    id: string;
    name: string;
    description?: string;
    videoUrl?: string;
    gymId: string;
};

function ExerciseForm({
  onSubmit,
  defaultValues,
  isSubmitting,
}: {
  onSubmit: SubmitHandler<FormValues>;
  defaultValues: FormValues;
  isSubmitting: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Exercise Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g., Barbell Squat" />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} placeholder="e.g., Keep your back straight..." />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input id="videoUrl" {...register('videoUrl')} placeholder="https://youtube.com/..." />
        {errors.videoUrl && <p className="text-sm text-destructive mt-1">{errors.videoUrl.message}</p>}
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </SheetClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Exercise'}
        </Button>
      </SheetFooter>
    </form>
  );
}

export default function ExercisesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { activeMembership, loading, isTrialActive } = useAuth();
    
    const [exercises, setExercises] = useState<LibraryExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
    const [exerciseToDelete, setExerciseToDelete] = useState<LibraryExercise | null>(null);

    useEffect(() => {
        if (loading || !activeMembership?.gymId) return;

        setIsLoading(true);
        const exercisesQuery = query(collection(db, 'exercises'), where('gymId', '==', activeMembership.gymId), orderBy('name'));
        
        const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
            const fetchedExercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryExercise));
            setExercises(fetchedExercises);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching exercises:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load exercises.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [loading, activeMembership, toast]);
    
    const openSheet = (exercise: LibraryExercise | null = null) => {
        setEditingExercise(exercise);
        setSheetOpen(true);
    };

    const closeSheet = () => {
        setSheetOpen(false);
        setEditingExercise(null);
    };

    const handleFormSubmit: SubmitHandler<FormValues> = async (values) => {
        if (!activeMembership?.gymId) return;
        setIsSubmitting(true);
        try {
            if (editingExercise) {
                const exerciseRef = doc(db, 'exercises', editingExercise.id);
                await updateDoc(exerciseRef, values);
                toast({ title: 'Success!', description: `Exercise "${values.name}" has been updated.` });
            } else {
                await addDoc(collection(db, 'exercises'), { ...values, gymId: activeMembership.gymId });
                toast({ title: 'Success!', description: `Exercise "${values.name}" has been added to your library.` });
            }
            closeSheet();
        } catch (error) {
            console.error("Error submitting form:", error);
            const action = editingExercise ? 'update' : 'create';
            toast({ variant: 'destructive', title: 'Error', description: `Could not ${action} exercise.` });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    async function handleDeleteConfirm() {
        if (!exerciseToDelete) return;
        try {
            await deleteDoc(doc(db, "exercises", exerciseToDelete.id));
            toast({ title: 'Exercise Deleted', description: `"${exerciseToDelete.name}" has been removed from the library.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the exercise.' });
        } finally {
            setExerciseToDelete(null);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-6xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
                 <p className='mt-8 text-lg text-muted-foreground'>Verifying admin access...</p>
            </div>
        );
    }
    
    if (!activeMembership || activeMembership.role !== 'gym-admin') {
        router.push('/');
        return null;
    }
    
    return (
        <>
            <AlertDialog open={!!exerciseToDelete} onOpenChange={(isOpen) => !isOpen && setExerciseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the exercise "{exerciseToDelete?.name}". It will not affect routines where this exercise has already been used.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{editingExercise ? 'Edit Exercise' : 'Add New Exercise'}</SheetTitle>
                        <SheetDescription>
                            {editingExercise ? 'Update the details for this exercise.' : 'Add a new exercise to your gym\'s library.'}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        <ExerciseForm 
                            onSubmit={handleFormSubmit}
                            isSubmitting={isSubmitting}
                            defaultValues={editingExercise || { name: '', description: '', videoUrl: '' }}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            <div className="flex flex-col min-h-screen">
                <AppHeader />
                {isTrialActive === false ? (
                    <TrialEnded />
                ) : (
                    <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
                        <div className="w-full max-w-4xl">
                            <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                            <AdminBottomNav />
                        
                            <Card>
                                <CardHeader>
                                     <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="flex items-center gap-2"><BookOpen /> Exercise Library</CardTitle>
                                            <CardDescription>Create and manage reusable exercises for your coaches.</CardDescription>
                                        </div>
                                        <Button onClick={() => openSheet()}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Exercise
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : exercises.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-semibold">Your Library is Empty</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">Add your first exercise to get started.</p>
                                        </div>
                                    ) : (
                                        <Accordion type="single" collapsible className="w-full space-y-2">
                                            {exercises.map((exercise) => (
                                                <AccordionItem value={exercise.id} key={exercise.id} className="border rounded-lg bg-muted/30">
                                                    <div className="flex items-center justify-between w-full px-4 py-2">
                                                        <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline font-semibold text-lg">
                                                            {exercise.name}
                                                        </AccordionTrigger>
                                                        <div className="flex items-center gap-1 pl-4">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSheet(exercise)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setExerciseToDelete(exercise)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <AccordionContent className="px-4 pb-3">
                                                        <div className="space-y-2 pt-2 border-t text-sm text-muted-foreground">
                                                            <p><strong>Description:</strong> {exercise.description || 'N/A'}</p>
                                                            <p><strong>Video URL:</strong> {exercise.videoUrl || 'N/A'}</p>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                )}
                <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
                </footer>
            </div>
        </>
    );
}
