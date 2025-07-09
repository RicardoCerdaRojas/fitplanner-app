'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WandSparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateRoutineAction } from '@/app/actions';
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';

const formSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select your fitness level.',
  }),
  goals: z.string().min(10, 'Please describe your goals in at least 10 characters.'),
  availableEquipment: z.string().min(3, 'Please list at least one piece of equipment.'),
});

type FormValues = z.infer<typeof formSchema>;

type AIWorkoutGeneratorProps = {
  onRoutineGenerated: (routine: GenerateWorkoutRoutineOutput) => void;
};

export function AIWorkoutGenerator({ onRoutineGenerated }: AIWorkoutGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fitnessLevel: undefined,
      goals: '',
      availableEquipment: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    onRoutineGenerated(null); // Clear previous routine
    const result = await generateRoutineAction(values);
    setIsLoading(false);

    if (result.success && result.data) {
      onRoutineGenerated(result.data);
    } else {
      const errorMessage = result.error?._errors?.join(', ') || 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: errorMessage,
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <WandSparkles className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl">AI Workout Generator</CardTitle>
            <CardDescription>Let our AI create a personalized workout for you.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fitnessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fitness Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your current fitness level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Fitness Goals</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lose weight, build muscle, improve cardio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availableEquipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Equipment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Dumbbells, resistance bands, treadmill, or just bodyweight"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate Workout'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
