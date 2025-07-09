'use server';

/**
 * @fileOverview An AI agent for generating workout routines based on user input.
 *
 * - generateWorkoutRoutine - A function that generates a workout routine.
 * - GenerateWorkoutRoutineInput - The input type for the generateWorkoutRoutine function.
 * - GenerateWorkoutRoutineOutput - The return type for the generateWorkoutRoutine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorkoutRoutineInputSchema = z.object({
  fitnessLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The fitness level of the user.'),
  goals: z
    .string()
    .describe(
      'The goals of the user, e.g., lose weight, gain muscle, improve endurance.'
    ),
  availableEquipment:
    z.string().describe('The equipment available to the user.'),
  age: z.number().describe('The age of the user.'),
});
export type GenerateWorkoutRoutineInput = z.infer<
  typeof GenerateWorkoutRoutineInputSchema
>;

const GenerateWorkoutRoutineOutputSchema = z.object({
  routine: z.string().describe('The generated workout routine.'),
});
export type GenerateWorkoutRoutineOutput = z.infer<
  typeof GenerateWorkoutRoutineOutputSchema
>;

export async function generateWorkoutRoutine(
  input: GenerateWorkoutRoutineInput
): Promise<GenerateWorkoutRoutineOutput> {
  return generateWorkoutRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkoutRoutinePrompt',
  input: {schema: GenerateWorkoutRoutineInputSchema},
  output: {schema: GenerateWorkoutRoutineOutputSchema},
  prompt: `You are an expert fitness trainer. Generate a workout routine based on the user's age, fitness level, goals, and available equipment.

Age: {{{age}}}
Fitness Level: {{{fitnessLevel}}}
Goals: {{{goals}}}
Available Equipment: {{{availableEquipment}}}

Workout Routine:`,
});

const generateWorkoutRoutineFlow = ai.defineFlow(
  {
    name: 'generateWorkoutRoutineFlow',
    inputSchema: GenerateWorkoutRoutineInputSchema,
    outputSchema: GenerateWorkoutRoutineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
