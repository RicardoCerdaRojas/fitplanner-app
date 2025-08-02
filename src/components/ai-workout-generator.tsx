
'use client';

// AI Workout Generator Component
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WandSparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateWorkoutRoutine } from '@/ai/flows/generate-workout-routine';
import type { GenerateWorkoutRoutineOutput } from '@/ai/flows/generate-workout-routine';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select your fitness level.',
  }),
  goals: z.string().min(10, 'Please describe your goals in at least 10 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

type AIWorkoutGeneratorProps = {
  onRoutineGenerated: (routine: GenerateWorkoutRoutineOutput | null) => void;
};

export function AIWorkoutGenerator({ onRoutineGenerated }: AIWorkoutGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fitnessLevel: undefined,
      goals: '',
    },
    mode: 'onChange'
  });

  const { fitnessLevel, goals } = form.watch();

  function calculateAge(dob: Date | undefined): number {
    if (!dob) return 30;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    onRoutineGenerated(null);

    const dobDate = userProfile?.dob?.toDate();
    const age = calculateAge(dobDate);

    const routineInput = {
      ...values,
      age: age,
      availableEquipment: 'Standard gym equipment, including free weights, benches, and cardio machines.',
    };

    try {
      const result = await generateWorkoutRoutine(routineInput);
      setIsLoading(false);

      if (result.routine.trim() === '') {
        toast({
          variant: 'destructive',
          title: 'Request out of scope',
          description: "I can only generate workout routines. Please ask something fitness-related.",
        });
        onRoutineGenerated(null);
      } else {
        onRoutineGenerated(result);
      }
    } catch (error: any) {
        setIsLoading(false);
        let errorMessage = 'An unexpected error occurred.';
        // Attempt to parse a more specific error message if available
        if (error && error.message) {
            errorMessage = error.message;
        }
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: errorMessage,
        });
    }
  }

  const handlePresetClick = (goal: string) => {
    form.setValue('goals', goal, { shouldValidate: true });
    setTimeout(() => {
      form.handleSubmit(onSubmit)();
    }, 0);
  };

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
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="fitnessLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. Select Your Fitness Level</FormLabel>
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

              <div className="space-y-2">
                <p className="text-sm font-medium">2. Choose an option</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button 
                        type="button" 
                        variant="outline"
                        disabled={!fitnessLevel || isLoading}
                        onClick={() => handlePresetClick('Generate a full upper body workout routine.')}>
                        Upper Body Routine
                    </Button>
                    <Button 
                        type="button"
                        variant="outline"
                        disabled={!fitnessLevel || isLoading}
                        onClick={() => handlePresetClick('Generate a full lower body workout routine.')}>
                        Lower Body Routine
                    </Button>
                </div>
              </div>

              <div className="relative">
                  <Separator className="my-4" />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-card px-2 text-sm text-muted-foreground">OR</span>
              </div>
              
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3. Describe Your Own Goal</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'A 30-minute cardio session to burn calories' or 'Una rutina para fortalecer la espalda y los hombros'"
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6" disabled={isLoading || !fitnessLevel || !goals || goals.length < 10}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate Custom Workout'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
