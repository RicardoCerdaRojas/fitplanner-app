'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect, createContext, useContext } from 'react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member } from '@/app/coach/page';
import type { ManagedRoutine } from './coach-routine-management';
import type { RoutineType } from '@/app/admin/routine-types/page';
import { RoutineCreatorNav } from './routine-creator-nav';
import { RoutineCreatorForm } from './routine-creator-form';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { PanelLeft } from 'lucide-react';

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
  memberId: z.string({ required_error: "Please select a client." }).min(1, 'Please select a client.'),
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
  routineToEdit?: ManagedRoutine | null;
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onCloseNav?: () => void;
};

const RoutineCreatorContext = createContext<RoutineCreatorContextType | null>(null);

export function useRoutineCreator() {
  const context = useContext(RoutineCreatorContext);
  if (!context) {
    throw new Error('useRoutineCreator must be used within a RoutineCreatorProvider');
  }
  return context;
}

type CoachRoutineCreatorProps = {
  members: Member[];
  routineTypes: RoutineType[];
  gymId: string;
  routineToEdit?: ManagedRoutine | null;
  onRoutineSaved: () => void;
};

export const defaultExerciseValues = { 
  name: '', 
  repType: 'reps' as const, 
  reps: '10', 
  duration: '1', 
  weight: '5', 
  videoUrl: '' 
};

export function CoachRoutineCreator({ members, routineTypes, gymId, routineToEdit, onRoutineSaved }: CoachRoutineCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  const [activeSelection, setActiveSelection] = useState<{ type: 'block' | 'exercise', blockIndex: number, exerciseIndex?: number }>({ type: 'block', blockIndex: 0 });
  
  const isEditing = !!routineToEdit;

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
          blocks: [{ name: 'Warm-up', sets: '3', exercises: [] }],
        };
  }, [routineToEdit]);

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues,
    mode: 'onBlur'
  });
  
  useEffect(() => {
      form.reset(defaultValues);
      setActiveSelection({ type: 'block', blockIndex: 0 });
  }, [routineToEdit, form, defaultValues]);

  async function onSubmit(values: RoutineFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a routine.' });
      return;
    }

    const selectedMember = members.find((a) => a.uid === values.memberId);
    if (!selectedMember && !isEditing) {
      toast({ variant: 'destructive', title: 'Invalid Client', description: 'The selected client could not be found.' });
      return;
    }
    
    const selectedRoutineType = routineTypes.find((rt) => rt.id === values.routineTypeId);
    if (!selectedRoutineType) {
        toast({ variant: 'destructive', title: 'Invalid Routine Type', description: 'Please select a valid routine type.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const routineData = {
            ...values,
            routineTypeName: selectedRoutineType.name,
            userName: isEditing && routineToEdit ? routineToEdit.userName : selectedMember!.name,
            coachId: user.uid,
            gymId: gymId,
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
      onRoutineSaved();
    } catch (error: any) {
      console.error('Error saving routine:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const contextValue = {
    form,
    activeSelection,
    setActiveSelection,
    members,
    routineTypes,
    routineToEdit,
    isEditing,
    isSubmitting,
    onCancel: onRoutineSaved,
    onCloseNav: () => isMobile && setIsNavOpen(false),
  };

  return (
    <RoutineCreatorContext.Provider value={contextValue}>
      <div className="mt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          </form>
        </Form>
      </div>
    </RoutineCreatorContext.Provider>
  );
}
