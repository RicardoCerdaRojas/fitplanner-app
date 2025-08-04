
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
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
import { AdminBottomNav } from '@/components/admin-bottom-nav';

const typeSchema = z.object({
  name: z.string().min(2, 'Type name must be at least 2 characters.'),
});

type FormValues = z.infer<typeof typeSchema>;

export type RoutineType = {
    id: string;
    name: string;
    gymId: string;
};

export default function RoutineTypesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { activeMembership, loading, isTrialActive } = useAuth();
    
    const [types, setTypes] = useState<RoutineType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [typeToDelete, setTypeToDelete] = useState<RoutineType | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(typeSchema),
    });

    useEffect(() => {
        if (loading || !activeMembership?.gymId) return;

        setIsLoading(true);
        const typesQuery = query(collection(db, 'routineTypes'), where('gymId', '==', activeMembership.gymId), orderBy('name'));
        
        const unsubscribe = onSnapshot(typesQuery, (snapshot) => {
            const fetchedTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineType));
            setTypes(fetchedTypes);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching routine types:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load routine types.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [loading, activeMembership, toast]);
    
    const handleFormSubmit: SubmitHandler<FormValues> = async (values) => {
        if (!activeMembership?.gymId) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'routineTypes'), { ...values, gymId: activeMembership.gymId });
            toast({ title: 'Success!', description: `Type &quot;${values.name}&quot; has been added.` });
            reset({ name: '' });
        } catch (error) {
            console.error("Error submitting form:", error);
            toast({ variant: 'destructive', title: 'Error', description: `Could not create type.` });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    async function handleDeleteConfirm() {
        if (!typeToDelete) return;
        try {
            await deleteDoc(doc(db, "routineTypes", typeToDelete.id));
            toast({ title: 'Type Deleted', description: `&quot;${typeToDelete.name}&quot; has been removed.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the type.' });
        } finally {
            setTypeToDelete(null);
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
            <AlertDialog open={!!typeToDelete} onOpenChange={(isOpen) => !isOpen && setTypeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the routine type &quot;{typeToDelete?.name}&quot;.
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
            
            <div className="flex flex-col min-h-screen">
                <AppHeader />
                <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
                    <div className="w-full max-w-4xl">
                        <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                        <AdminBottomNav />
                    
                        <Card>
                            <CardHeader>
                                 <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2"><Layers /> Routine Types</CardTitle>
                                        <CardDescription>Manage the categories for your workout routines.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex items-start gap-2 mb-6">
                                    <div className="flex-1">
                                        <Input {...register('name')} placeholder="e.g., 'Full Body', 'Yoga Flow'" />
                                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                                    </div>
                                    <Button type="submit" disabled={isSubmitting}>
                                        <Plus className="mr-2 h-4 w-4" /> {isSubmitting ? 'Adding...' : 'Add Type'}
                                    </Button>
                                </form>

                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : types.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-semibold">No Routine Types Yet</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">Add your first type to get started.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {types.map((type) => (
                                            <div key={type.id} className="flex items-center justify-between w-full px-4 py-2 border rounded-lg bg-muted/30">
                                                <span className="font-semibold text-lg">{type.name}</span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setTypeToDelete(type)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
                </footer>
            </div>
        </>
    );
}
