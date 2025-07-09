'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Trash2, ClipboardCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CoachRoutine } from './coach-workout-display';

const exerciseSchema = z.object({
  name: z.string().min(2, 'Exercise name is required.'),
  repType: z.enum(['reps', 'duration']),
  reps: z.string().optional(),
  duration: z.string().optional(),
  weight: z.string().optional(),
  videoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
}).refine(data => {
    if (data.repType === 'reps' && !data.reps) return false;
    if (data.repType === 'duration' && !data.duration) return false;
    return true;
}, {
    message: "Please specify reps or duration.",
    path: ['reps'],
});

const routineSchema = z.object({
  userName: z.string().min(2, 'Client name is required.'),
  routineName: z.string().min(3, 'Routine name is required.'),
  exercises: z.array(exerciseSchema).min(1, 'Please add at least one exercise.'),
});

type FormValues = z.infer<typeof routineSchema>;

type CoachRoutineCreatorProps = {
  onRoutineCreated: (routine: CoachRoutine | null) => void;
};

export function CoachRoutineCreator({ onRoutineCreated }: CoachRoutineCreatorProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      userName: '',
      routineName: '',
      exercises: [{ name: '', repType: 'reps', reps: '', duration: '', weight: '', videoUrl: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'exercises',
  });

  function onSubmit(values: FormValues) {
    onRoutineCreated(values);
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl">Create a New Routine</CardTitle>
            <CardDescription>Design a personalized workout for a client.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Client's Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="routineName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Routine Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Full Body Strength" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Exercises</h3>
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <h4 className="font-semibold">Exercise #{index + 1}</h4>
                        <FormField
                            control={form.control}
                            name={`exercises.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Exercise Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Bench Press" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`exercises.${index}.repType`}
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Repetitions or Duration?</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex gap-4"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl><RadioGroupItem value="reps" /></FormControl>
                                            <FormLabel className="font-normal">Reps</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl><RadioGroupItem value="duration" /></FormControl>
                                            <FormLabel className="font-normal">Duration (minutes)</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {form.watch(`exercises.${index}.repType`) === 'reps' && (
                                <FormField control={form.control} name={`exercises.${index}.reps`} render={({ field }) => (<FormItem><FormLabel>Reps</FormLabel><FormControl><Input placeholder="e.g., 3x12" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            )}
                            {form.watch(`exercises.${index}.repType`) === 'duration' && (
                                <FormField control={form.control} name={`exercises.${index}.duration`} render={({ field }) => (<FormItem><FormLabel>Duration (minutes)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            )}
                             <FormField control={form.control} name={`exercises.${index}.weight`} render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder="e.g., 50kg or Bodyweight" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>

                        <FormField
                            control={form.control}
                            name={`exercises.${index}.videoUrl`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Example Video URL</FormLabel>
                                    <FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => append({ name: '', repType: 'reps', reps: '', duration: '', weight: '', videoUrl: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise
              </Button>
              <Button type="submit" className="w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6">
                Create Routine
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
