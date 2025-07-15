
'use client';

import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp, doc, updateDoc, onSnapshot, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member } from '@/app/coach/page';
import type { ManagedRoutine } from './coach-routine-management';
import type { RoutineType } from '@/app/admin/routine-types/page';
import { Skeleton } from './ui/skeleton';
import { RoutineCreatorForm, TemplateLoader, SaveTemplateDialog } from './routine-creator-form';
import { Button } from './ui/button';
import type { RoutineTemplate } from '@/app/coach/templates/page';
import { ArrowLeft, Save, MoreVertical, Library, Send } from 'lucide-react';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const exerciseSchema = z.object({
  name: z.string().min(2, 'Exercise name is required.'),
  repType: z.enum(['reps', 'duration']),
  reps: z.string().optional(),
  duration: z.string().optional(),
  weight: z.string().optional(),
  videoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.repType === 'reps' && (!data.reps || data.reps.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reps are required.", path: ['reps'] });
    }
    if (data.repType === 'duration' && (!data.duration || data.duration.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration is required.", path: ['duration'] });
    }
});

const blockSchema = z.object({
    id: z.string(),
    name: z.string().min(2, 'Block name is required.'),
    sets: z.string().min(1, 'Sets are required.'),
    exercises: z.array(exerciseSchema).min(1, 'Please add at least one exercise.'),
});

const routineDetailsSchema = z.object({
  routineTypeId: z.string({ required_error: "Please select a routine type." }).min(1, 'Please select a routine type.'),
  memberId: z.string().optional(),
  routineDate: z.date().optional(),
});

export type RoutineFormValues = {
  details: z.infer<typeof routineDetailsSchema>;
  blocks: z.infer<typeof blockSchema>[];
}
export type BlockFormValues = z.infer<typeof blockSchema>;
export type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export const defaultExerciseValues: ExerciseFormValues = { 
  name: 'New Exercise',
  repType: 'reps' as const, 
  reps: '10', 
  duration: '',
  weight: '5', 
  videoUrl: '' 
};

function RoutineDetailsSection({ members, routineTypes }: { members: Member[], routineTypes: RoutineType[] }) {
    const { control } = useFormContext<z.infer<typeof routineDetailsSchema>>();

    return (
        <div className="space-y-6">
            <FormField control={control} name="memberId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Member</FormLabel>
                    <MemberCombobox members={members} value={field.value ?? ''} onChange={field.onChange} />
                    <FormMessage/>
                </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={control} name="routineTypeId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Routine Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {routineTypes.map(rt => (<SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="routineDate" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Routine Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        </div>
    );
}

export function CoachRoutineCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, activeMembership, loading: authLoading } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [routineTypes, setRoutineTypes] = useState<RoutineType[]>([]);
  const [dataToEdit, setDataToEdit] = useState<ManagedRoutine | RoutineTemplate | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blocks, setBlocks] = useState<BlockFormValues[]>([]);
  
  const editRoutineId = searchParams.get('edit');
  const templateId = searchParams.get('template');
  const isEditing = !!editRoutineId || !!templateId;

  const defaultDetails = useMemo(() => {
    if (dataToEdit) {
      const isRoutine = 'memberId' in dataToEdit;
      return {
        routineTypeId: dataToEdit.routineTypeId || '',
        memberId: isRoutine ? dataToEdit.memberId : '',
        routineDate: isRoutine ? dataToEdit.routineDate : new Date(),
      }
    }
    return {
      routineTypeId: '',
      memberId: '',
      routineDate: new Date(),
    };
  }, [dataToEdit]);

  const form = useForm<z.infer<typeof routineDetailsSchema>>({
    resolver: zodResolver(routineDetailsSchema),
    defaultValues: defaultDetails,
    mode: 'onBlur'
  });

  const { getValues, handleSubmit, reset } = form;

  const loadTemplate = useCallback((template: RoutineTemplate) => {
      reset({
          routineTypeId: template.routineTypeId,
          memberId: '',
          routineDate: new Date(),
      });
      setBlocks(template.blocks.map(b => ({...b, id: crypto.randomUUID()})));
      toast({title: "Template Loaded", description: `"${template.templateName}" has been loaded into the editor.`});
  }, [reset, toast]);
  
  const onFormSubmit = handleSubmit(async (details) => {
    if (!user || !activeMembership?.gymId) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a routine.' });
      return;
    }

    if (!details.memberId || !details.routineDate) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a member and a date to assign the routine.' });
        return;
    }

    const selectedMember = members.find((a) => a.uid === details.memberId);
    if (!selectedMember) {
      toast({ variant: 'destructive', title: 'Invalid Member', description: 'Please select a member for this routine.' });
      return;
    }
    
    const selectedRoutineType = routineTypes.find((rt) => rt.id === details.routineTypeId);
    if (!selectedRoutineType) {
        toast({ variant: 'destructive', title: 'Invalid Routine Type', description: 'Please select a valid routine type.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const cleanedBlocks = blocks.map(block => {
            const { id, ...restOfBlock } = block;
            return {
                ...restOfBlock,
                exercises: block.exercises.map(exercise => {
                    const cleanedExercise: Partial<ExerciseFormValues> = { ...exercise };
                    if (cleanedExercise.repType === 'reps') delete cleanedExercise.duration;
                    else if (cleanedExercise.repType === 'duration') delete cleanedExercise.reps;
                    return cleanedExercise as ExerciseFormValues;
                })
            };
        });
        
        const routineData = {
            ...details,
            blocks: cleanedBlocks,
            routineTypeName: selectedRoutineType.name,
            userName: selectedMember.name,
            coachId: user.uid,
            gymId: activeMembership.gymId,
            routineDate: Timestamp.fromDate(details.routineDate),
            createdAt: (editRoutineId && dataToEdit && 'createdAt' in dataToEdit) ? dataToEdit.createdAt : Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        if(editRoutineId && dataToEdit) {
            const routineRef = doc(db, 'routines', dataToEdit.id);
            await updateDoc(routineRef, routineData);
            toast({ title: 'Routine Updated!', description: `The routine for ${routineData.userName} has been updated.` });
        } else {
            await addDoc(collection(db, 'routines'), routineData);
            toast({ title: 'Routine Saved!', description: `The routine for ${routineData.userName} has been saved successfully.` });
        }
      router.push('/coach');
    } catch (error: any) {
      console.error('Error saving routine:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  });

  const handleSaveAsTemplate = async (templateName: string) => {
    if (!user || !activeMembership?.gymId) {
      toast({ variant: 'destructive', title: 'Not Authenticated' });
      return;
    }

    const details = getValues();
    const selectedRoutineType = routineTypes.find((rt) => rt.id === details.routineTypeId);

    if (!selectedRoutineType) {
      toast({ variant: 'destructive', title: 'Invalid Routine Type', description: 'Please select a type for the template.' });
      return;
    }

    const cleanedBlocks = blocks.map(block => {
        const { id, ...restOfBlock } = block;
        return {
            ...restOfBlock,
            exercises: block.exercises.map(ex => {
              const cleanedEx: Partial<ExerciseFormValues> = { ...ex };
              if (cleanedEx.repType === 'reps') delete cleanedEx.duration;
              else delete cleanedEx.reps;
              return cleanedEx;
            })
        };
    });

    const dataToSave = {
      templateName,
      routineTypeId: details.routineTypeId,
      routineTypeName: selectedRoutineType.name,
      blocks: cleanedBlocks,
      gymId: activeMembership.gymId,
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, 'routineTemplates'), dataToSave);
      toast({ title: 'Template Saved!', description: `"${templateName}" is now in your library.` });
      router.push('/coach/templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };

  const handleAddBlock = () => {
    setBlocks(prev => [...prev, { id: crypto.randomUUID(), name: `Block ${prev.length + 1}`, sets: '4', exercises: [] }]);
  };

  const handleUpdateBlock = (blockId: string, updatedFields: Partial<BlockFormValues>) => {
    setBlocks(prev => prev.map(b => (b.id === blockId ? { ...b, ...updatedFields } : b)));
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const handleDuplicateBlock = (blockId: string) => {
    setBlocks(prev => {
      const blockToDuplicate = prev.find(b => b.id === blockId);
      if (!blockToDuplicate) return prev;
      const newBlock = { ...blockToDuplicate, id: crypto.randomUUID() };
      const index = prev.findIndex(b => b.id === blockId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  };

  const handleAddExercise = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return { ...b, exercises: [...b.exercises, { ...defaultExerciseValues, name: `New Exercise ${b.exercises.length + 1}` }] };
      }
      return b;
    }));
  };

  const handleRemoveExercise = (blockId: string, exerciseIndex: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newExercises = [...b.exercises];
        newExercises.splice(exerciseIndex, 1);
        return { ...b, exercises: newExercises };
      }
      return b;
    }));
  };

  const handleSaveExercise = (blockId: string, exerciseIndex: number, updatedExercise: ExerciseFormValues) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newExercises = [...b.exercises];
        newExercises[exerciseIndex] = updatedExercise;
        return { ...b, exercises: newExercises };
      }
      return b;
    }));
  };

  const handleIncrementSets = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
        if (b.id === blockId) {
            const currentSets = parseInt(b.sets, 10);
            return { ...b, sets: String(currentSets + 1) };
        }
        return b;
    }));
  };
    
  const handleDecrementSets = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
        if (b.id === blockId) {
            const currentSets = parseInt(b.sets, 10);
            if (currentSets > 1) {
                return { ...b, sets: String(currentSets - 1) };
            }
        }
        return b;
    }));
  };

  useEffect(() => {
    if(authLoading || !activeMembership?.gymId) return;

    const gymId = activeMembership.gymId;
    let membersLoaded = false;
    let typesLoaded = false;
    let editDataLoaded = !editRoutineId && !templateId;

    const checkLoadingState = () => {
        if (membersLoaded && typesLoaded && editDataLoaded) {
            setIsDataLoading(false);
        }
    };
    
    const membersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({ 
          uid: doc.id, 
          name: doc.data().name || doc.data().email,
          email: doc.data().email,
        })).filter(m => m.name) as Member[];
      setMembers(fetchedMembers);
      membersLoaded = true;
      checkLoadingState();
    });

    const typesQuery = query(collection(db, 'routineTypes'), where('gymId', '==', gymId), orderBy('name'));
    const unsubscribeTypes = onSnapshot(typesQuery, (snapshot) => {
      const fetchedTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineType));
      setRoutineTypes(fetchedTypes);
      typesLoaded = true;
      checkLoadingState();
    });

    const fetchEditData = async () => {
        let docRef;
        if (editRoutineId) docRef = doc(db, 'routines', editRoutineId);
        else if (templateId) docRef = doc(db, 'routineTemplates', templateId);
        else return;

        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const loadedData = {
                id: docSnap.id,
                ...data,
                ...((data.routineDate instanceof Timestamp) && { routineDate: data.routineDate.toDate() }),
            } as ManagedRoutine | RoutineTemplate;
            setDataToEdit(loadedData);
            if (data.blocks) {
                setBlocks(data.blocks.map((b: any) => ({...b, id: crypto.randomUUID()})));
            }
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Item to edit not found.' });
            router.push('/coach');
          }
        } catch (e) {
            console.error(e)
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
            router.push('/coach');
        } finally {
            editDataLoaded = true;
            checkLoadingState();
        }
    };

    fetchEditData();
    if (!isEditing) {
        setBlocks([{ name: 'Warm-up', sets: '4', exercises: [], id: crypto.randomUUID() }]);
    }

    return () => {
      unsubscribeMembers();
      unsubscribeTypes();
    };

  }, [authLoading, activeMembership, editRoutineId, templateId, router, toast, isEditing]);

  useEffect(() => {
      reset(defaultDetails);
  }, [dataToEdit, reset, defaultDetails]);
  
  if (isDataLoading || authLoading) {
      return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      )
  }

  return (
      <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b bg-background">
              <Button variant="ghost" size="sm" onClick={() => router.push('/coach')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <h1 className="text-lg font-bold font-headline text-center">
                  {isEditing ? 'Edit Routine' : 'Create Routine'}
              </h1>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-9 h-9">
                          <MoreVertical className="h-5 w-5" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <TemplateLoader onTemplateLoad={loadTemplate} />
                      </DropdownMenuItem>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <SaveTemplateDialog onSave={handleSaveAsTemplate} />
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
          
          <Tabs defaultValue="details" className="flex-grow flex flex-col">
            <TabsList className="w-full rounded-none justify-start px-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="blocks">Blocks</TabsTrigger>
            </TabsList>
            
            <FormProvider {...form}>
                 <TabsContent value="details" className="flex-grow p-4">
                    <RoutineDetailsSection members={members} routineTypes={routineTypes} />
                </TabsContent>
            </FormProvider>

            <TabsContent value="blocks" className="flex-grow p-4 bg-muted/30">
                <RoutineCreatorForm 
                    blocks={blocks}
                    onUpdateBlock={handleUpdateBlock}
                    onAddBlock={handleAddBlock}
                    onRemoveBlock={handleRemoveBlock}
                    onDuplicateBlock={handleDuplicateBlock}
                    onAddExercise={handleAddExercise}
                    onRemoveExercise={handleRemoveExercise}
                    onSaveExercise={handleSaveExercise}
                    onIncrementSets={handleIncrementSets}
                    onDecrementSets={handleDecrementSets}
                />
            </TabsContent>
          </Tabs>
          

          <div className="p-4 bg-background/80 border-t backdrop-blur-sm">
              <Button onClick={onFormSubmit} size="lg" className="w-full" disabled={isSubmitting}>
                  <Send className="mr-2 h-5 w-5" />
                  <span className="text-lg">
                    {isSubmitting ? 'Assigning...' : (isEditing && editRoutineId ? 'Update Routine' : 'Assign to Member')}
                  </span>
              </Button>
          </div>
      </div>
  );
}
