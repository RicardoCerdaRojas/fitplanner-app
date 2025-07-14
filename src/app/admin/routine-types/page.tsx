
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
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
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { TrialEnded } from '@/components/trial-ended';

const formSchema = z.object({
  name: z.string().min(2, 'Type name must be at least 2 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export type RoutineType = {
    id: string;
    name: string;
    gymId: string;
};

export default function RoutineTypesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { activeMembership, loading, isTrialActive } = useAuth();
    const [routineTypes, setRoutineTypes] = useState<RoutineType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingType, setEditingType] = useState<RoutineType | null>(null);
    const [typeToDelete, setTypeToDelete] = useState<RoutineType | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '' },
    });
    
    useEffect(() => {
        if (loading || !activeMembership?.gymId) return;

        setIsLoading(true);
        const typesQuery = query(collection(db, 'routineTypes'), where('gymId', '==', activeMembership.gymId), orderBy('name'));
        const unsubscribe = onSnapshot(typesQuery, (snapshot) => {
            const fetchedTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineType));
            setRoutineTypes(fetchedTypes);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching routine types:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load routine types.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [loading, activeMembership, toast]);

    useEffect(() => {
        if (editingType) {
            form.reset({ name: editingType.name });
        } else {
            form.reset({ name: '' });
        }
    }, [editingType, form]);


    async function onSubmit(values: FormValues) {
        if (!activeMembership?.gymId) return;
        setIsSubmitting(true);
        try {
            if (editingType) {
                const typeRef = doc(db, 'routineTypes', editingType.id);
                await updateDoc(typeRef, { name: values.name });
                toast({ title: 'Success!', description: `Routine type has been updated to "${values.name}".` });
                setEditingType(null);
            } else {
                await addDoc(collection(db, 'routineTypes'), {
                    name: values.name,
                    gymId: activeMembership.gymId,
                });
                toast({ title: 'Success!', description: `Routine type "${values.name}" has been created.` });
            }
            form.reset();
        } catch (error) {
            console.error("Error submitting form:", error);
            const action = editingType ? 'update' : 'create';
            toast({ variant: 'destructive', title: 'Error', description: `Could not ${action} routine type.` });
        } finally {
            setIsSubmitting(false);
            setEditingType(null);
        }
    }
    
    async function handleDeleteConfirm() {
        if (!typeToDelete) return;
        try {
            await deleteDoc(doc(db, "routineTypes", typeToDelete.id));
            toast({ title: 'Routine Type Deleted', description: `The type "${typeToDelete.name}" has been removed.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the routine type.' });
        } finally {
            setTypeToDelete(null);
        }
    }

    const handleCancelEdit = () => {
        setEditingType(null);
        form.reset();
    };

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
            <AlertDialog open={!!typeToDelete} onOpenChange={(isOpen) => {if (!isOpen) setTypeToDelete(null)}}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the routine type "{typeToDelete?.name}".
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
            <div className="flex flex-col min-h-screen">
                <AppHeader />
                {isTrialActive === false ? (
                    <TrialEnded />
                ) : (
                    <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
                        <div className="w-full max-w-2xl">
                            <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                            <AdminBottomNav />
                        
                            <Card>
                                <CardHeader>
                                    <CardTitle>Manage Routine Types</CardTitle>
                                    <CardDescription>A list of all available routine types in your gym.</CardDescription>
                                    <div className="pt-4">
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="sr-only">Type Name</FormLabel>
                                                        <div className="flex items-start gap-2">
                                                            <FormControl>
                                                            <Input placeholder={editingType ? `Renaming "${editingType.name}"` : "e.g. Upper Body"} {...field} />
                                                            </FormControl>
                                                            <div className="flex gap-2">
                                                                <Button type="submit" disabled={isSubmitting}>
                                                                    {isSubmitting ? (editingType ? 'Updating...' : 'Adding...') : (editingType ? 'Update' : 'Add')}
                                                                </Button>
                                                                {editingType && (
                                                                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                                                        Cancel
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <FormMessage className="pl-1"/>
                                                    </FormItem>
                                                )}/>
                                            </form>
                                        </Form>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right w-[100px]">Actions</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow><TableCell colSpan={2}><Skeleton className="h-8 w-full"/></TableCell></TableRow>
                                            ) : routineTypes.length === 0 ? (
                                                <TableRow><TableCell colSpan={2} className="text-center">No routine types created yet.</TableCell></TableRow>
                                            ) : (
                                                routineTypes.map((type) => (
                                                    <TableRow key={type.id}>
                                                        <TableCell className="font-medium">{type.name}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setEditingType(type)}
                                                                disabled={!!editingType}
                                                                className='h-8 w-8'
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setTypeToDelete(type)}
                                                                disabled={!!editingType}
                                                                className='h-8 w-8 text-destructive hover:text-destructive'
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
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
