'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from "date-fns";
import { PlusCircle, Trash2, ClipboardCheck, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CoachRoutine } from './coach-workout-display';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Athlete } from '@/app/coach/page';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  athleteId: z.string({ required_error: "Please select a client." }).min(1, 'Please select a client.'),
  routineDate: z.date({
    required_error: "A date for the routine is required.",
  }),
  blocks: z.array(blockSchema).min(1, 'Please add at least one block to the routine.'),
});

type FormValues = z.infer<typeof routineSchema>;

type CoachRoutineCreatorProps = {
  onRoutineCreated: (routine: CoachRoutine | null) => void;
  athletes: Athlete[];
  gymId: string;
};

export function CoachRoutineCreator({ onRoutineCreated, athletes, gymId }: CoachRoutineCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      athleteId: '',
      routineDate: new Date(),
      blocks: [{ name: 'Block A', sets: '3 Sets', exercises: [{ name: '', repType: 'reps', reps: '12', duration: '', weight: '', videoUrl: '' }] }],
    },
  });

  const { fields: blockFields, append: appendBlock, remove: removeBlock } = useFieldArray({
    control: form.control,
    name: 'blocks',
  });

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in as a coach to save a routine.',
      });
      return;
    }

    const selectedAthlete = athletes.find((a) => a.uid === values.athleteId);
    if (!selectedAthlete) {
      toast({
        variant: 'destructive',
        title: 'Invalid Client',
        description: 'The selected client could not be found.',
      });
      return;
    }
    
    const routineData = {
        ...values,
        userName: selectedAthlete.name,
        coachId: user.uid,
        gymId: gymId,
    };
    
    // The preview component expects a standard Date object.
    onRoutineCreated(routineData);

    const docToWrite = {
        ...routineData,
        routineDate: Timestamp.fromDate(routineData.routineDate),
        createdAt: Timestamp.now(),
    };

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'routines'), docToWrite);

      setIsSubmitting(false);

      toast({
        title: 'Routine Saved!',
        description: `The routine for ${routineData.userName} has been saved successfully.`,
      });
      form.reset({
        athleteId: '',
        routineDate: new Date(),
        blocks: [
          {
            name: 'Block A',
            sets: '3 Sets',
            exercises: [
              { name: '', repType: 'reps', reps: '12', duration: '', weight: '', videoUrl: '' },
            ],
          },
        ],
      });
      onRoutineCreated(null);
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Error saving routine:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description:
          error.message ||
          'An unexpected error occurred while saving the routine.',
      });
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl">Create a New Routine</CardTitle>
            <CardDescription>Design a personalized workout session for a client.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="athleteId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Client's Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a client to assign the routine" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {athletes.length === 0 ? (
                                <SelectItem value="none" disabled>No athletes found in your gym</SelectItem>
                            ) : (
                                athletes.map(athlete => (
                                    <SelectItem key={athlete.uid} value={athlete.uid}>{athlete.name}</SelectItem>
                                ))
                            )}
                            </SelectContent>
                        </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="routineDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Routine Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="space-y-6">
                <h3 className="text-xl font-medium">Workout Blocks</h3>
                {blockFields.map((blockField, blockIndex) => (
                    <Card key={blockField.id} className="p-4 bg-card/60 relative">
                        <CardHeader className='p-2'>
                          <div className='flex justify-between items-center'>
                            <CardTitle>Block #{blockIndex + 1}</CardTitle>
                            {blockFields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeBlock(blockIndex)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className='p-2 space-y-4'>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`blocks.${blockIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Block Name</FormLabel><FormControl><Input placeholder="e.g., Warm-up" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`blocks.${blockIndex}.sets`} render={({ field }) => (<FormItem><FormLabel>Sets / Rounds</FormLabel><FormControl><Input placeholder="e.g., 3 Sets" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                          
                          <ExercisesArray blockIndex={blockIndex} form={form} />
                        </CardContent>
                    </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendBlock({ name: `Block ${blockFields.length + 1}`, sets: '3 Sets', exercises: [{ name: '', repType: 'reps', reps: '12', duration: '', weight: '', videoUrl: '' }] })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Block
                </Button>
            </div>

            <div className="flex justify-end items-center">
              <Button type="submit" className="w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? 'Saving Routine...' : 'Create and Save Routine'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


function ExercisesArray({ blockIndex, form }: { blockIndex: number, form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `blocks.${blockIndex}.exercises`,
  });

  return (
    <div className='space-y-4 pl-4 border-l-2 border-primary/20'>
      <h4 className="text-md font-medium">Exercises</h4>
      {fields.map((field, index) => (
        <div key={field.id} className="p-3 border rounded-md space-y-4 relative bg-background/50">
           <div className='flex justify-between items-center'>
            <h5 className="font-semibold text-sm">Exercise #{index + 1}</h5>
            {fields.length > 1 && (
                <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
           </div>
            <FormField
                control={form.control} name={`blocks.${blockIndex}.exercises.${index}.name`}
                render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} /></FormControl><FormMessage /></FormItem>)}
            />
            <FormField
                control={form.control} name={`blocks.${blockIndex}.exercises.${index}.repType`}
                render={({ field }) => (
                    <FormItem className="space-y-2"><FormLabel>Repetitions or Duration?</FormLabel>
                    <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="reps" /></FormControl><FormLabel className="font-normal">Reps</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="duration" /></FormControl><FormLabel className="font-normal">Duration (minutes)</FormLabel></FormItem>
                    </RadioGroup></FormControl><FormMessage /></FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.watch(`blocks.${blockIndex}.exercises.${index}.repType`) === 'reps' && (
                    <FormField control={form.control} name={`blocks.${blockIndex}.exercises.${index}.reps`} render={({ field }) => (<FormItem><FormLabel>Reps</FormLabel><FormControl><Input placeholder="e.g., 3x12" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                {form.watch(`blocks.${blockIndex}.exercises.${index}.repType`) === 'duration' && (
                    <FormField control={form.control} name={`blocks.${blockIndex}.exercises.${index}.duration`} render={({ field }) => (<FormItem><FormLabel>Duration (minutes)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                 <FormField control={form.control} name={`blocks.${blockIndex}.exercises.${index}.weight`} render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder="e.g., 50kg or Bodyweight" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField
                control={form.control} name={`blocks.${blockIndex}.exercises.${index}.videoUrl`}
                render={({ field }) => (<FormItem><FormLabel>Example Video URL</FormLabel><FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl><FormMessage /></FormItem>)}
            />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', repType: 'reps', reps: '12', duration: '', weight: '', videoUrl: '' })}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise to Block
      </Button>
    </div>
  )
}
