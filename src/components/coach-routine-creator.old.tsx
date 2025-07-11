'use client';

import { useForm, useFieldArray, useWatch, Control, useController, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from "date-fns";
import { Plus, ClipboardPlus, Calendar as CalendarIcon, Edit, X, Minus, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Member } from '@/app/coach/page';
import { addDoc, collection, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ManagedRoutine } from './coach-routine-management';
import type { RoutineType } from '@/app/admin/routine-types/page';


const exerciseSchema = z.object({
  name: z.string().min(2, 'Exercise name is required.'),
  repType: z.enum(['reps', 'duration']),
  reps: z.string().optional(),
  duration: z.string().optional(),
  weight: z.string().optional(),
  videoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.repType === 'reps' && (!data.reps || data.reps.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reps are required.",
            path: ['reps'],
        });
    }
    if (data.repType === 'duration' && (!data.duration || data.duration.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duration is required.",
            path: ['duration'],
        });
    }
});

const blockSchema = z.object({
    name: z.string().min(2, 'Block name is required.'),
    sets: z.string().min(1, 'Sets are required.'),
    exercises: z.array(exerciseSchema).min(1, 'Please add at least one exercise to this block.'),
});

const routineSchema = z.object({
  routineTypeId: z.string({ required_error: "Please select a routine type." }),
  memberId: z.string({ required_error: "Please select a client." }).min(1, 'Please select a client.'),
  routineDate: z.date({
    required_error: "A date for the routine is required.",
  }),
  blocks: z.array(blockSchema).min(1, 'Please add at least one block to the routine.'),
});

type FormValues = z.infer<typeof routineSchema>;

type CoachRoutineCreatorProps = {
  members: Member[];
  routineTypes: RoutineType[];
  gymId: string;
  routineToEdit?: ManagedRoutine | null;
  onRoutineSaved: () => void;
};

export function CoachRoutineCreator({ members, routineTypes, gymId, routineToEdit, onRoutineSaved }: CoachRoutineCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  
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
          blocks: [{ name: 'Warm-up', sets: '3 Sets', exercises: [{ name: '', repType: 'reps', reps: '12', duration: '10', weight: '', videoUrl: '' }] }],
        };
  }, [routineToEdit]);

  const form = useForm<FormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues,
  });

  const { fields: blockFields, append: appendBlock, remove: removeBlock } = useFieldArray({
    control: form.control,
    name: 'blocks',
  });
  
  const handleAddBlock = () => {
    appendBlock({ name: `Block ${blockFields.length + 1}`, sets: '3 Sets', exercises: [{ name: '', repType: 'reps', reps: '12', duration: '10', weight: '', videoUrl: '' }] });
  };


  async function onSubmit(values: FormValues) {
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
    
    const routineData = {
        ...values,
        routineTypeName: selectedRoutineType.name,
        userName: isEditing && routineToEdit ? routineToEdit.userName : selectedMember!.name,
        coachId: user.uid,
        gymId: gymId,
    };

    const docToWrite = {
        ...routineData,
        routineDate: Timestamp.fromDate(routineData.routineDate),
        createdAt: isEditing && routineToEdit ? routineToEdit.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
    };
    delete (docToWrite as any).id;

    setIsSubmitting(true);
    try {
        if(isEditing && routineToEdit) {
            const routineRef = doc(db, 'routines', routineToEdit.id);
            await updateDoc(routineRef, docToWrite);
            toast({ title: 'Routine Updated!', description: `The routine for ${routineData.userName} has been updated.` });
        } else {
            await addDoc(collection(db, 'routines'), docToWrite);
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

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4 shadow-lg border-0 bg-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          {isEditing ? <Edit className="w-8 h-8 text-primary" /> : <ClipboardPlus className="w-8 h-8 text-primary" />}
          <div>
            <CardTitle className="font-headline text-2xl">{isEditing ? 'Edit Routine' : 'Create a New Routine'}</CardTitle>
            <CardDescription>{isEditing && routineToEdit ? `You are editing a routine for ${routineToEdit.userName}.` : 'Design a personalized workout session for a client.'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start p-4 border rounded-lg bg-card/60">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client's Name</FormLabel>
                       {isEditing && routineToEdit ? (
                        <FormControl>
                          <Input
                            value={routineToEdit.userName}
                            disabled
                            className="font-semibold h-10"
                          />
                        </FormControl>
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members.length === 0 ? (
                              <SelectItem value="none" disabled>No members found</SelectItem>
                            ) : (
                              members.map(member => (
                                <SelectItem key={member.uid} value={member.uid}>{member.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="routineTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routine Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a routine type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {routineTypes.length === 0 ? (
                              <SelectItem value="none" disabled>No routine types found</SelectItem>
                            ) : (
                              routineTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                              ))
                            )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                <FormField
                  control={form.control}
                  name="routineDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routine Date</FormLabel>
                      <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                                if (date) {
                                  field.onChange(date);
                                }
                                setCalendarOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="pt-4 space-y-4">
              <FormLabel>Workout Blocks</FormLabel>
               <Accordion type="multiple" className="w-full space-y-4" defaultValue={blockFields.map(field => field.id)}>
                {blockFields.map((field, index) => (
                    <AccordionItem value={field.id} key={field.id} className='bg-card/60 border-2 rounded-lg data-[state=open]:border-primary/50 border-b-2'>
                        <AccordionTrigger className='px-4 py-2 hover:no-underline'>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex-1 mr-4">
                                     <FormField control={form.control} name={`blocks.${index}.name`} render={({ field }) => (<FormItem><FormControl><Input placeholder="e.g., Warm-up" {...field} className="text-lg font-bold font-headline border-0 bg-transparent shadow-none px-0 h-auto focus-visible:ring-0" /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                {blockFields.length > 1 && (
                                <Button type="button" size="icon" variant="ghost" className='text-muted-foreground hover:text-destructive hover:bg-destructive/10' onClick={() => removeBlock(index)}>
                                    <Trash2 className='w-4 h-4' />
                                </Button>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className='px-4 pb-4'>
                            <div className="space-y-4 pt-4 border-t">
                                <FormField control={form.control} name={`blocks.${index}.sets`} render={({ field }) => (<FormItem className="max-w-xs"><FormLabel>Sets / Rounds</FormLabel><FormControl><Input placeholder="e.g., 3 Sets" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <ExerciseList blockIndex={index} control={form.control} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
               </Accordion>
                <Button type="button" size="lg" variant="outline" className="w-full border-dashed" onClick={handleAddBlock}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Block
                </Button>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t">
              {isEditing && (<Button type="button" variant="outline" onClick={onRoutineSaved}>Cancel Edit</Button>)}
              <Button type="submit" size="lg" className="w-auto bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Routine' : 'Create and Save Routine')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


function ExerciseList({ blockIndex, control }: { blockIndex: number, control: Control<FormValues> }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `blocks.${blockIndex}.exercises`,
  });

  const watchRepType = useWatch({
    control,
    name: `blocks.${blockIndex}.exercises`,
  });

  const handleAddExercise = () => {
    append({ name: '', repType: 'reps', reps: '12', duration: '10', weight: '', videoUrl: '' });
  };
  
  return (
    <div className='space-y-4 pt-6 border-t mt-4'>
      <FormLabel>Exercises</FormLabel>
      <div className="space-y-3">
        {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-4 bg-background/50 relative">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                </Button>
                <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.repType`} render={({ field }) => (
                    <FormItem className="space-y-2"><FormLabel>Repetitions or Duration?</FormLabel>
                    <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="reps" /></FormControl><FormLabel className="font-normal">Reps</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="duration" /></FormControl><FormLabel className="font-normal">Duration</FormLabel></FormItem>
                    </RadioGroup></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {watchRepType[index]?.repType === 'reps' ? (
                        <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.reps`} render={() => (
                            <FormItem>
                                <FormLabel>Reps</FormLabel>
                                <FormControl>
                                    <StepperInput control={control} name={`blocks.${blockIndex}.exercises.${index}.reps`} placeholder="12" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    ) : (
                        <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.duration`} render={() => (
                            <FormItem>
                                <FormLabel>Duration</FormLabel>
                                <FormControl>
                                    <StepperInput control={control} name={`blocks.${blockIndex}.exercises.${index}.duration`} placeholder="e.g. 30 seconds" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.weight`} render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder="e.g., 50kg or Bodyweight" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.videoUrl`} render={({ field }) => (<FormItem><FormLabel>Example Video URL</FormLabel><FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" className="w-full" onClick={handleAddExercise}>
        <Plus className="mr-2 h-4 w-4" /> Add Exercise
      </Button>
    </div>
  )
}

const StepperInput = ({ control, name, ...props }: { control: Control<FormValues>; name: FieldPath<FormValues>; [key: string]: any }) => {
  const { field } = useController({
    name,
    control,
  });

  const handleStep = (amount: number) => {
    // This stepper now handles both numbers and strings like "8-12"
    const currentValue = field.value || '0';
    if (typeof currentValue === 'string' && currentValue.includes('-')) {
        // if it's a range, do nothing with steppers
        return;
    }
    const numericValue = parseInt(currentValue, 10);
    const stepValue = isNaN(numericValue) ? 0 : numericValue;
    const newValue = stepValue + amount;

    if (newValue >= 0) {
      field.onChange(String(newValue));
    }
  };

  return (
    <div className="relative flex items-center">
      <Input
        {...field}
        {...props}
        className="h-10 text-center font-semibold text-base pr-8"
        onFocus={(e) => e.target.select()}
      />
      <div className="absolute right-1 flex flex-col h-full justify-center">
          <Button type="button" variant="ghost" className="h-4 w-6 p-0 rounded-b-none" onClick={() => handleStep(1)} aria-label="Increment"><Plus className="h-3 w-3" /></Button>
          <Button type="button" variant="ghost" className="h-4 w-6 p-0 rounded-t-none" onClick={() => handleStep(-1)} aria-label="Decrement"><Minus className="h-3 w-3" /></Button>
      </div>
    </div>
  );
};
