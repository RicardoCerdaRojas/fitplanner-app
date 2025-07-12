
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect, createContext, useContext, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp, doc, updateDoc, onSnapshot, getDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member } from '@/app/coach/page';
import type { ManagedRoutine } from './coach-routine-management';
import type { RoutineType } from '@/app/admin/routine-types/page';
import { Skeleton } from './ui/skeleton';
import { RoutineCreatorForm, TemplateLoader } from './routine-creator-form';
import { RoutineCreatorNav } from './routine-creator-nav';
import { Button } from './ui/button';
import { RoutineCreatorLayout } from './routine-creator-layout';
import { useFieldArray } from 'react-hook-form';
import type { RoutineTemplate } from '@/app/coach/templates/page';


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
    name: z.string().min(2, 'Block name is required.'),
    sets: z.string().min(1, 'Sets are required.'),
    exercises: z.array(exerciseSchema).min(1, 'Please add at least one exercise.'),
});

export const routineSchema = z.object({
  routineTypeId: z.string({ required_error: "Please select a routine type." }).min(1, 'Please select a routine type.'),
  memberId: z.string().optional(),
  routineDate: z.date().optional(),
  blocks: z.array(blockSchema).min(1, 'Please add at least one block.'),
  templateName: z.string().optional(), // For saving as a new template
});

export type RoutineFormValues = z.infer<typeof routineSchema>;
export type BlockFormValues = z.infer<typeof blockSchema>;
export type ExerciseFormValues = z.infer<typeof exerciseSchema>;
export type ActiveSelection = { type: 'details' } | { type: 'block', index: number } | { type: 'exercise', blockIndex: number, exerciseIndex: number };


type RoutineCreatorContextType = {
  form: ReturnType<typeof useForm<RoutineFormValues>>;
  members: Member[];
  routineTypes: RoutineType[];
  isEditing: boolean;
  isSubmitting: boolean;
  activeSelection: ActiveSelection;
  setActiveSelection: React.Dispatch<React.SetStateAction<ActiveSelection>>;
  blockFields: ReturnType<typeof useFieldArray>['fields'];
  appendBlock: (block: Partial<BlockFormValues>) => void;
  removeBlock: (index: number) => void;
  appendExercise: (blockIndex: number) => void;
  removeExercise: (blockIndex: number, exerciseIndex: number) => void;
  onFormSubmit: () => void;
  loadTemplate: (template: RoutineTemplate) => void;
};

const RoutineCreatorContext = createContext<RoutineCreatorContextType | null>(null);

export function useRoutineCreator() {
  const context = useContext(RoutineCreatorContext);
  if (!context) {
    throw new Error('useRoutineCreator must be used within a RoutineCreatorProvider');
  }
  return context;
}

export const defaultExerciseValues: Omit<ExerciseFormValues, 'name'> = { 
  repType: 'reps' as const, 
  reps: '10', 
  duration: '',
  weight: '5', 
  videoUrl: '' 
};

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
  
  const editRoutineId = searchParams.get('edit');
  const templateId = searchParams.get('template');
  const isEditing = !!editRoutineId || !!templateId;

  const [activeSelection, setActiveSelection] = useState<ActiveSelection>({ type: 'details' });

  const defaultValues = useMemo(() => {
    if (dataToEdit) {
      const isRoutine = 'memberId' in dataToEdit;
      return {
        routineTypeId: dataToEdit.routineTypeId || '',
        memberId: isRoutine ? dataToEdit.memberId : '',
        routineDate: isRoutine ? dataToEdit.routineDate : new Date(),
        blocks: dataToEdit.blocks,
        templateName: isRoutine ? '' : dataToEdit.templateName,
      }
    }
    return {
      routineTypeId: '',
      memberId: '',
      routineDate: new Date(),
      blocks: [{ name: 'Warm-up', sets: '1', exercises: [] }],
      templateName: ''
    };
  }, [dataToEdit]);

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues,
    mode: 'onBlur'
  });

  const { control, getValues, setValue, handleSubmit, reset } = form;

  const { fields: blockFields, append, remove, update } = useFieldArray({
    control,
    name: 'blocks',
  });

  const appendBlock = useCallback((block: Partial<BlockFormValues>) => {
    append(block);
    setActiveSelection({ type: 'block', index: blockFields.length });
  }, [append, blockFields.length]);

  const removeBlock = useCallback((index: number) => {
    remove(index);
    if ((activeSelection.type === 'block' && activeSelection.index === index) || (activeSelection.type === 'exercise' && activeSelection.blockIndex === index)) {
        setActiveSelection({ type: 'details' });
    } else if ((activeSelection.type === 'block' && activeSelection.index > index) || (activeSelection.type === 'exercise' && activeSelection.blockIndex > index)) {
        if (activeSelection.type === 'block') {
            setActiveSelection({ type: 'block', index: activeSelection.index - 1 });
        }
        if (activeSelection.type === 'exercise') {
            setActiveSelection({ type: 'exercise', blockIndex: activeSelection.blockIndex - 1, exerciseIndex: activeSelection.exerciseIndex });
        }
    }
  }, [remove, activeSelection]);
  
  const appendExercise = useCallback((blockIndex: number) => {
    const currentBlock = getValues(`blocks.${blockIndex}`);
    const newExerciseName = `Exercise ${currentBlock.exercises.length + 1}`;
    const newExercise: ExerciseFormValues = { name: newExerciseName, ...defaultExerciseValues };
    
    const updatedExercises = [...currentBlock.exercises, newExercise];
    const updatedBlock = { ...currentBlock, exercises: updatedExercises };
    update(blockIndex, updatedBlock);

    setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: currentBlock.exercises.length });
  }, [getValues, update]);

  const removeExercise = useCallback((blockIndex: number, exerciseIndex: number) => {
    const currentBlock = getValues(`blocks.${blockIndex}`);
    const newExercises = currentBlock.exercises.filter((_, i) => i !== exerciseIndex);
    const updatedBlock = { ...currentBlock, exercises: newExercises };
    update(blockIndex, updatedBlock);
    
    if (newExercises.length > 0) {
        setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: Math.max(0, exerciseIndex - 1) });
    } else {
        setActiveSelection({ type: 'block', index: blockIndex });
    }
  }, [getValues, update]);

  const loadTemplate = useCallback((template: RoutineTemplate) => {
      reset({
          routineTypeId: template.routineTypeId,
          blocks: template.blocks,
          templateName: template.templateName,
          memberId: '',
          routineDate: new Date(),
      });
      setActiveSelection({type: 'details'});
      toast({title: "Template Loaded", description: `"${template.templateName}" has been loaded into the editor.`});
  }, [reset, toast]);

  
  const onFormSubmit = handleSubmit(async (values) => {
    if (!user || !activeMembership?.gymId) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a routine.' });
      return;
    }

    if (!values.memberId || !values.routineDate) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a member and a date to assign the routine.' });
        return;
    }

    const selectedMember = members.find((a) => a.uid === values.memberId);
    if (!selectedMember) {
      toast({ variant: 'destructive', title: 'Invalid Member', description: 'Please select a member for this routine.' });
      return;
    }
    
    const selectedRoutineType = routineTypes.find((rt) => rt.id === values.routineTypeId);
    if (!selectedRoutineType) {
        toast({ variant: 'destructive', title: 'Invalid Routine Type', description: 'Please select a valid routine type.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const cleanedBlocks = values.blocks.map(block => ({
            ...block,
            exercises: block.exercises.map(exercise => {
                const cleanedExercise: Partial<ExerciseFormValues> = { ...exercise };
                if (cleanedExercise.repType === 'reps') {
                    delete cleanedExercise.duration;
                } else if (cleanedExercise.repType === 'duration') {
                    delete cleanedExercise.reps;
                }
                return cleanedExercise as ExerciseFormValues;
            })
        }));

        const routineData = {
            ...values,
            blocks: cleanedBlocks,
            routineTypeName: selectedRoutineType.name,
            userName: selectedMember.name,
            coachId: user.uid,
            gymId: activeMembership.gymId,
            routineDate: Timestamp.fromDate(values.routineDate),
            createdAt: (editRoutineId && 'createdAt' in dataToEdit!) ? dataToEdit.createdAt : Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
        delete routineData.templateName;

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
        let collectionName: 'routines' | 'routineTemplates' = 'routines';
        if (editRoutineId) {
            docRef = doc(db, 'routines', editRoutineId);
        } else if (templateId) {
            collectionName = 'routineTemplates';
            docRef = doc(db, 'routineTemplates', templateId);
        } else {
            return;
        }

        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const loadedData = {
                id: docSnap.id,
                ...data,
                // Ensure date is a Date object if it exists
                ...((data.routineDate instanceof Timestamp) && { routineDate: data.routineDate.toDate() }),
            } as ManagedRoutine | RoutineTemplate;
            setDataToEdit(loadedData);
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

    return () => {
      unsubscribeMembers();
      unsubscribeTypes();
    };

  }, [authLoading, activeMembership, editRoutineId, templateId, router, toast]);

  useEffect(() => {
      reset(defaultValues);
  }, [dataToEdit, reset, defaultValues]);
  

  const contextValue: RoutineCreatorContextType = {
    form,
    members,
    routineTypes,
    isEditing,
    isSubmitting,
    activeSelection,
    setActiveSelection,
    blockFields: blockFields as any,
    appendBlock,
    removeBlock,
    appendExercise,
    removeExercise,
    onFormSubmit,
    loadTemplate,
  };
  
  if (isDataLoading || authLoading) {
      return (
        <RoutineCreatorLayout
          sidebar={<Skeleton className="h-full w-full" />}
        >
          <div className="space-y-4 h-full">
             <Skeleton className="h-full w-full" />
          </div>
        </RoutineCreatorLayout>
      )
  }

  return (
    <RoutineCreatorContext.Provider value={contextValue}>
       <FormProvider {...form}>
        <RoutineCreatorLayout
            sidebar={<RoutineCreatorNav />}
        >
            <div className="h-full flex flex-col">
                <div className="flex-grow">
                    <RoutineCreatorForm />
                </div>
                <div className="flex justify-end pt-4 mt-auto gap-2">
                    <TemplateLoader />
                    <Button type="button" onClick={onFormSubmit} size="lg" className="w-auto" disabled={isSubmitting}>
                        {isSubmitting ? 'Assigning...' : 'Assign to Member'}
                    </Button>
                </div>
            </div>
        </RoutineCreatorLayout>
       </FormProvider>
    </RoutineCreatorContext.Provider>
  );
}
