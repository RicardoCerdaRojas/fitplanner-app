
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Edit, ClipboardList, Repeat, Clock, Dumbbell, Search, FilterX, Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Block } from '@/components/athlete-routine-list'; 
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
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AppHeader } from '@/components/app-header';
import { AdminBottomNav } from '@/components/admin-bottom-nav';

export type RoutineTemplate = {
    id: string;
    templateName: string;
    routineTypeName: string;
    routineTypeId: string;
    blocks: Block[];
    gymId: string;
    createdAt: Timestamp;
};

export default function TemplatesPage() {
    const { toast } = useToast();
    const { activeMembership, loading: authLoading } = useAuth();
    const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');
    const [templateToDelete, setTemplateToDelete] = useState<RoutineTemplate | null>(null);

    useEffect(() => {
        if (authLoading || !activeMembership?.gymId) return;

        setIsLoading(true);
        const templatesQuery = query(
            collection(db, 'routineTemplates'),
            where('gymId', '==', activeMembership.gymId)
        );

        const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
            const fetchedTemplates = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt as Timestamp,
            } as RoutineTemplate)).sort((a, b) => a.templateName.localeCompare(b.templateName));
            setTemplates(fetchedTemplates);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching templates:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch routine templates.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [authLoading, activeMembership, toast]);


    const handleDeleteConfirm = async () => {
        if (!templateToDelete) return;
        try {
            await deleteDoc(doc(db, 'routineTemplates', templateToDelete.id));
            toast({ title: 'Success!', description: 'The template has been deleted.' });
        } catch (error) {
            console.error('Error deleting template:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the template.' });
        } finally {
            setTemplateToDelete(null);
        }
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(template => {
            if (!searchFilter) return true;
            const searchLower = searchFilter.toLowerCase();
            return template.templateName.toLowerCase().includes(searchLower) ||
                   template.routineTypeName.toLowerCase().includes(searchLower);
        });
    }, [templates, searchFilter]);

    if (authLoading || !activeMembership) {
        return (
            <div className="flex flex-col min-h-screen">
                <AppHeader />
                <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                    <div className="w-full max-w-5xl space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </main>
            </div>
        );
    }
    
    return (
        <>
            <AlertDialog open={!!templateToDelete} onOpenChange={(isOpen) => !isOpen && setTemplateToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the template "{templateToDelete?.templateName}". This action cannot be undone.
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
                <main className="flex-grow flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
                    <div className="w-full max-w-5xl">
                         <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
                                <p className="text-muted-foreground">Manage your reusable workout templates.</p>
                            </div>
                         </div>
                        <AdminBottomNav />
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Template Library</CardTitle>
                                        <CardDescription>Browse, edit, or delete routine templates.</CardDescription>
                                    </div>
                                    <Button asChild>
                                       <Link href="/coach/create-routine">
                                         <Plus className="mr-2 h-4 w-4" /> Create New
                                       </Link>
                                    </Button>
                                </div>
                                <div className="relative pt-4">
                                     <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                                     <Input 
                                        placeholder="Search by template name or type..." 
                                        value={searchFilter} 
                                        onChange={(e) => setSearchFilter(e.target.value)} 
                                        className="pl-10"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-14 w-full" />
                                        <Skeleton className="h-14 w-full" />
                                        <Skeleton className="h-14 w-full" />
                                    </div>
                                ) : filteredTemplates.length > 0 ? (
                                    <Accordion type="single" collapsible className="w-full space-y-2">
                                        {filteredTemplates.map((template) => (
                                            <AccordionItem value={template.id} key={template.id} className="border rounded-lg">
                                                <div className="flex items-center justify-between w-full px-4 py-3">
                                                    <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline">
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-semibold">{template.templateName}</span>
                                                            <span className="text-sm text-muted-foreground font-normal">
                                                                Type: {template.routineTypeName}
                                                            </span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <div className="flex items-center gap-2 pl-4">
                                                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                                                            <Link href={`/coach/create-routine?template=${template.id}`}>
                                                               <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => setTemplateToDelete(template)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <AccordionContent className="px-4 pb-3">
                                                    <div className="space-y-2 pt-2 border-t">
                                                        {template.blocks.map((block, blockIndex) => (
                                                            <div key={blockIndex} className="p-2 border rounded-md bg-card/50">
                                                                <div className="flex justify-between items-center w-full mb-2">
                                                                    <h4 className="font-semibold text-card-foreground">{block.name}</h4>
                                                                    <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{block.sets}</span>
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
                                        <h3 className="mt-4 text-lg font-semibold">No Templates Found</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {searchFilter ? "Try adjusting your search terms." : "You haven't created any templates yet."}
                                        </p>
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
