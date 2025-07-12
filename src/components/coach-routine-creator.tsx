
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp, doc, updateDoc, onSnapshot, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member } from '@/app/coach/page';
import type { ManagedRoutine } from './coach-routine-management';
import type { RoutineType } from '@/app/admin/routine-types/page';
import { RoutineCreatorNav } from './routine-creator-nav';
import { RoutineCreatorForm } from './routine-creator-form';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { PanelLeft, ArrowLeft } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

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
  routineTypeId: z.string({ required_error: "Please select a routine type." }),
  memberId: z.string({ required_error: "Please select a member." }).min(1, 'Please select a member.'),
  routineDate: z.date({ required_error: "A date for the routine is required." }),
  blocks: z.array(blockSchema).min(1, 'Please add at least one block.'),
});

export type RoutineFormValues = z.infer<typeof routineSchema>;
export type BlockFormValues = z.infer<typeof blockSchema>;
export type ExerciseFormValues = z.infer<typeof exerciseSchema>;

type RoutineCreatorContextType = {
  form: ReturnType<typeof useForm<RoutineFormValues>>;
  activeSelection: { type: 'block' | 'exercise', blockIndex: number, exerciseIndex?: number };
  setActiveSelection: React.Dispatch<React.SetStateAction<{ type: 'block' | 'exercise', blockIndex: number, exerciseIndex?: number }>>;
  members: Member[];
  routineTypes: RoutineType[];
  isEditing: boolean;
  isSubmitting: boolean;
  onCloseNav?: () => void;
  onAddExercise: () => void;
  step: number;
  setStep: (step: number) => void;
  canProceed: boolean;
};

const RoutineCreatorContext = createContext<RoutineCreatorContextType | null>(null);

export function useRoutineCreator() {
  const context = useContext(RoutineCreatorContext);
  if (!context) {
    throw new Error('useRoutineCreator must be used within a RoutineCreatorProvider');
  }
  return context;
}

export const defaultExerciseValues = { 
  name: 'Untitled Exercise', 
  repType: 'reps' as const, 
  reps: '10', 
  duration: undefined,
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
  const [routineToEdit, setRoutineToEdit] = useState<ManagedRoutine | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  const [activeSelection, setActiveSelection] = useState<{ type: 'block' | 'exercise', blockIndex: number, exerciseIndex?: number }>({ type: 'block', blockIndex: 0 });
  const [step, setStep] = useState(1);

  const editRoutineId = searchParams.get('edit');
  const isEditing = !!editRoutineId;

  const defaultValues = useMemo(() => {
    return routineToEdit 
      ? {
          routineTypeId: routineToEdit.routineTypeId || '',
          memberId: routineToEdit.memberId,
          routineDate: routineToEdit.routineDate,
          blocks: routineToEdit.blocks,
        }
      : {
          routineTypeId: '',
          memberId: '',
          routineDate: new Date(),
          blocks: [{ name: 'Warm-up', sets: '1', exercises: [] }],
        };
  }, [routineToEdit]);

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues,
    mode: 'onBlur'
  });

  const { control, watch, trigger } = form;
  const formValues = watch();

  const canProceed = useMemo(() => {
      if (step === 1) {
          return !!formValues.routineTypeId && !!formValues.routineDate;
      }
      return true;
  }, [step, formValues]);


  useEffect(() => {
    if(authLoading || !activeMembership?.gymId) return;

    const gymId = activeMembership.gymId;
    
    // Fetch Members
    const membersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({ 
          uid: doc.id, 
          name: doc.data().name || doc.data().email,
          email: doc.data().email,
        })).filter(m => m.name) as Member[];
      setMembers(fetchedMembers);
    });

    // Fetch Routine Types
    const typesQuery = query(collection(db, 'routineTypes'), where('gymId', '==', gymId), orderBy('name'));
    const unsubscribeTypes = onSnapshot(typesQuery, (snapshot) => {
      const fetchedTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineType));
      setRoutineTypes(fetchedTypes);
    });

    // Fetch routine to edit if ID exists
    const fetchEditData = async () => {
      if (editRoutineId) {
        const routineDoc = await getDoc(doc(db, 'routines', editRoutineId));
        if (routineDoc.exists()) {
          const data = routineDoc.data();
          const managedRoutine: ManagedRoutine = {
              id: routineDoc.id,
              ...data,
              routineDate: (data.routineDate as Timestamp).toDate(),
          } as ManagedRoutine;
          setRoutineToEdit(managedRoutine);
          setStep(2); // Go directly to step 2 if editing
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Routine to edit not found.' });
          router.push('/coach');
        }
      }
    };

    Promise.all([fetchEditData()]).finally(() => setIsDataLoading(false));

    return () => {
      unsubscribeMembers();
      unsubscribeTypes();
    };

  }, [authLoading, activeMembership, editRoutineId, router, toast]);


   const { append } = useFieldArray({
      control,
      name: `blocks.${activeSelection.blockIndex}.exercises`
    });

  useEffect(() => {
      form.reset(defaultValues);
      setActiveSelection({ type: 'block', blockIndex: 0 });
  }, [routineToEdit, form, defaultValues]);
  
  const handleAddExercise = () => {
    const exercises = form.getValues(`blocks.${activeSelection.blockIndex}.exercises`);
    const newExerciseIndex = exercises.length;
    append(defaultExerciseValues);
    setActiveSelection({ type: 'exercise', blockIndex: activeSelection.blockIndex, exerciseIndex: newExerciseIndex });
  };


  async function onSubmit(values: RoutineFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a routine.' });
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
            gymId: activeMembership!.gymId,
            routineDate: Timestamp.fromDate(values.routineDate),
            createdAt: isEditing && routineToEdit ? routineToEdit.createdAt : Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        if(isEditing && routineToEdit) {
            const routineRef = doc(db, 'routines', routineToEdit.id);
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
  }

  const contextValue: RoutineCreatorContextType = {
    form,
    activeSelection,
    setActiveSelection,
    members,
    routineTypes,
    isEditing,
    isSubmitting,
    onCloseNav: () => isMobile && setIsNavOpen(false),
    onAddExercise: handleAddExercise,
    step,
    setStep,
    canProceed
  };
  
  if (isDataLoading) {
      return <Skeleton className="h-[500px] w-full" />
  }

  return (
    <RoutineCreatorContext.Provider value={contextValue}>
      <div>
        <Button variant="ghost" onClick={() => router.push('/coach')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Routines
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 2 ? (
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                {isMobile ? (
                    <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="md:hidden flex items-center gap-2 font-semibold">
                            <PanelLeft />
                            Routine Navigation
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] p-0">
                        <SheetHeader className="p-4 border-b">
                        <SheetTitle>Routine Structure</SheetTitle>
                        </SheetHeader>
                        <RoutineCreatorNav />
                    </SheetContent>
                    </Sheet>
                ) : (
                    <div className="w-full md:w-1/3 lg:w-1/4">
                    <RoutineCreatorNav />
                    </div>
                )}
                
                <div className="flex-1">
                    <RoutineCreatorForm />
                </div>
                </div>
            ) : (
                <RoutineCreatorForm />
            )}
          </form>
        </Form>
      </div>
    </RoutineCreatorContext.Provider>
  );
}
