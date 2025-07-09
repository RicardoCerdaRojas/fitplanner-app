
'use client';

import { useForm, useFieldArray, useWatch, Control, useController, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from "date-fns";
import { Plus, ClipboardPlus, Calendar as CalendarIcon, Edit, X, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Athlete } from '@/app/coach/page';
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
  athleteId: z.string({ required_error: "Please select a client." }).min(1, 'Please select a client.'),
  routineDate: z.date({
    required_error: "A date for the routine is required.",
  }),
  blocks: z.array(blockSchema).min(1, 'Please add at least one block to the routine.'),
});

type FormValues = z.infer<typeof routineSchema>;

type CoachRoutineCreatorProps = {
  athletes: Athlete[];
  routineTypes: RoutineType[];
  gymId: string;
  routineToEdit?: ManagedRoutine | null;
  onRoutineSaved: () => void;
};

const defaultFormValues = {
  routineTypeId: '',
  athleteId: '',
  routineDate: new Date(),
  blocks: [{ name: 'Warm-up', sets: '3 Sets', exercises: [{ name: '', repType: 'reps', reps: '12', duration: '10', weight: '', videoUrl: '' }] }],
};

export function CoachRoutineCreator({ athletes, routineTypes, gymId, routineToEdit, onRoutineSaved }: CoachRoutineCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isEditing = !!routineToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: defaultFormValues,
  });

  const { fields: blockFields, append: appendBlock, remove: removeBlock } = useFieldArray({
    control: form.control,
    name: 'blocks',
  });
  
  const [activeBlockId, setActiveBlockId] = useState<string | undefined>(blockFields[0]?.id);
  const [lastBlockCount, setLastBlockCount] = useState(blockFields.length);

  useEffect(() => {
    if (routineToEdit) {
        form.reset({
            routineTypeId: routineToEdit.routineTypeId || '',
            athleteId: routineToEdit.athleteId,
            routineDate: routineToEdit.routineDate,
            blocks: routineToEdit.blocks,
        });
        setActiveBlockId(routineToEdit.blocks[0] ? `block-${routineToEdit.blocks[0].name}` : undefined);
    } else {
        form.reset(defaultFormValues);
        setActiveBlockId(defaultFormValues.blocks[0] ? `block-${defaultFormValues.blocks[0].name}` : undefined);
    }
  }, [routineToEdit, form]);
  
  useEffect(() => {
    if (blockFields.length > lastBlockCount) {
        setActiveBlockId(blockFields[blockFields.length - 1].id);
    }
    setLastBlockCount(blockFields.length);

    if (activeBlockId && !blockFields.some(field => field.id === activeBlockId)) {
      setActiveBlockId(blockFields[Math.max(0, blockFields.length - 1)]?.id);
    }

  }, [blockFields, lastBlockCount, activeBlockId]);


  const handleAddBlock = () => {
    appendBlock({ name: `Block ${blockFields.length + 1}`, sets: '3 Sets', exercises: [{ name: '', repType: 'reps', reps: '12', duration: '10', weight: '', videoUrl: '' }] });
  };


  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a routine.' });
      return;
    }

    const selectedAthlete = athletes.find((a) => a.uid === values.athleteId);
    if (!selectedAthlete && !isEditing) {
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
        userName: isEditing && routineToEdit ? routineToEdit.userName : selectedAthlete!.name,
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <FormField
                  control={form.control}
                  name="athleteId"
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
                            {athletes.length === 0 ? (
                              <SelectItem value="none" disabled>No athletes found</SelectItem>
                            ) : (
                              athletes.map(athlete => (
                                <SelectItem key={athlete.uid} value={athlete.uid}>{athlete.name}</SelectItem>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="pt-4 border-t">
              <FormLabel>Workout Blocks</FormLabel>
              <Tabs value={activeBlockId} onValueChange={setActiveBlockId} className="w-full mt-2">
                <div className="flex items-center gap-2 pb-2 mb-4 overflow-x-auto border-b">
                    <TabsList className="relative bg-transparent p-0 gap-2">
                        {blockFields.map((field, index) => (
                            <TabsTrigger key={field.id} value={field.id} className="relative pr-8 border border-input data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-primary rounded-md">
                                Block {index + 1}
                                {blockFields.length > 1 && (
                                    <div role="button" aria-label={`Remove Block ${index + 1}`} onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeBlock(index);}} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive cursor-pointer">
                                        <X className="h-3 w-3" />
                                    </div>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={handleAddBlock}>
                        <Plus className="mr-2 h-4 w-4" /> Add Block
                    </Button>
                </div>

                {blockFields.map((field, index) => (
                    <TabsContent key={field.id} value={field.id} className="mt-0">
                        <div className="p-4 border rounded-lg bg-card/60 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`blocks.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Block Name</FormLabel><FormControl><Input placeholder="e.g., Warm-up" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`blocks.${index}.sets`} render={({ field }) => (<FormItem><FormLabel>Sets / Rounds</FormLabel><FormControl><Input placeholder="e.g., 3 Sets" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                          <ExerciseEditor blockIndex={index} control={form.control} watch={form.watch} />
                        </div>
                    </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t">
              {isEditing && (<Button type="button" variant="outline" onClick={onRoutineSaved}>Cancel Edit</Button>)}
              <Button type="submit" className="w-auto bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Routine' : 'Create and Save Routine')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


function ExerciseEditor({ blockIndex, control, watch }: { blockIndex: number, control: Control<FormValues>, watch: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `blocks.${blockIndex}.exercises`,
  });

  const [activeExerciseId, setActiveExerciseId] = useState<string | undefined>(fields[0]?.id);
  const [lastExerciseCount, setLastExerciseCount] = useState(fields.length);

  useEffect(() => {
    if (activeExerciseId === undefined && fields.length > 0) {
      setActiveExerciseId(fields[0].id);
    } else if (activeExerciseId && !fields.some(field => field.id === activeExerciseId)) {
      setActiveExerciseId(fields[Math.max(0, fields.length - 1)]?.id);
    }
  }, [fields, activeExerciseId]);
  
  useEffect(() => {
    if (fields.length > lastExerciseCount) {
        setActiveExerciseId(fields[fields.length - 1].id);
    }
    setLastExerciseCount(fields.length);
  }, [fields, lastExerciseCount]);

  const handleAddExercise = () => {
    append({ name: '', repType: 'reps', reps: '12', duration: '10', weight: '', videoUrl: '' });
  };
  
  if (fields.length === 0) {
      return (
          <div className="text-center p-4 border-t pt-6 mt-4">
              <p className="text-muted-foreground mb-2">This block has no exercises.</p>
              <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={handleAddExercise}>
                <Plus className="mr-2 h-4 w-4" /> Add First Exercise
              </Button>
          </div>
      )
  }

  return (
    <div className='space-y-4 pt-6 border-t mt-4'>
      <FormLabel>Exercises</FormLabel>
      <Tabs value={activeExerciseId} onValueChange={setActiveExerciseId} className="w-full">
        <div className="flex items-center gap-2 pb-2 mb-2 overflow-x-auto">
            <TabsList className="relative bg-transparent p-0 gap-2">
                {fields.map((field, index) => (
                    <TabsTrigger key={field.id} value={field.id} className="relative pr-8 border border-input data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-primary rounded-md">
                        Exercise {index + 1}
                        {fields.length > 1 && (
                             <div role="button" aria-label={`Remove Exercise ${index + 1}`} onClick={(e) => { e.stopPropagation(); e.preventDefault(); remove(index);}} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive cursor-pointer">
                                <X className="h-3 w-3" />
                            </div>
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
             <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={handleAddExercise}>
                <Plus className="mr-2 h-4 w-4" /> Add Exercise
            </Button>
        </div>

         {fields.map((field, index) => (
            <TabsContent key={field.id} value={field.id} className="mt-0">
                <div className="p-4 border rounded-md space-y-4 bg-background/50">
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.repType`} render={({ field }) => (
                        <FormItem className="space-y-2"><FormLabel>Repetitions or Duration?</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="reps" /></FormControl><FormLabel className="font-normal">Reps</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="duration" /></FormControl><FormLabel className="font-normal">Duration (minutes)</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {watch(`blocks.${blockIndex}.exercises.${index}.repType`) === 'reps' ? (
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
                                    <FormLabel>Duration (minutes)</FormLabel>
                                    <FormControl>
                                        <StepperInput control={control} name={`blocks.${blockIndex}.exercises.${index}.duration`} placeholder="10" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                         <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.weight`} render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder="e.g., 50kg or Bodyweight" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${index}.videoUrl`} render={({ field }) => (<FormItem><FormLabel>Example Video URL</FormLabel><FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
            </TabsContent>
         ))}
      </Tabs>
    </div>
  )
}

const StepperInput = ({ control, name, ...props }: { control: Control<FormValues>; name: FieldPath<FormValues>; [key: string]: any }) => {
  const { field } = useController({
    name,
    control,
  });

  const handleStep = (amount: number) => {
    const currentValue = parseInt(field.value, 10);
    const numericValue = isNaN(currentValue) ? 0 : currentValue;
    const newValue = numericValue + amount;
    if (newValue >= 0) {
      field.onChange(String(newValue));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => handleStep(-1)} aria-label="Decrement">
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        {...field}
        {...props}
        className="h-10 text-center font-semibold text-base"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        onFocus={(e) => e.target.select()}
      />
      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => handleStep(1)} aria-label="Increment">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
