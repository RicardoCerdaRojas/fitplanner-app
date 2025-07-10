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
  routine: z.string().describe('The generated workout routine in Markdown format.'),
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
  prompt: `You are an expert fitness trainer AI. Your ONLY purpose is to generate workout routines.

You MUST follow these rules strictly:
1.  ONLY respond to requests for workout routines. If the user asks about anything else (e.g., 'what is the capital of France?', 'tell me a joke'), you MUST return an empty string for the 'routine' field.
2.  Respond in the EXACT same language as the user's 'Goals'.
3.  Format the output in Markdown using the following strict hierarchy and format. Do NOT add any extra text, introduction, or conclusion.

**Block Name (e.g., Warm-up, Upper Body, Cool-down)**
*Exercise Name*
- Sets: Number of sets (e.g., 3)
- Reps: Repetition range (e.g., 8-12) or "As many as possible"
- Duration: Duration in minutes or seconds (e.g., 3 minutes, 30 seconds)
- Weight: Recommended weight (e.g., 50kg, Bodyweight, Light)

Here is a clear example of the required format:

**Warm-up**
*Jumping Jacks*
- Sets: 1
- Duration: 3 minutes

**Main Workout: Block A**
*Bench Press*
- Sets: 3
- Reps: 8-12
- Weight: 60kg

*Squats*
- Sets: 3
- Reps: 10
- Weight: Bodyweight

**Cool-down**
*Quad Stretch*
- Sets: 1
- Duration: 30 seconds per side

Now, generate a workout routine based on the user's information.

User Information:
- Age: {{{age}}}
- Fitness Level: {{{fitnessLevel}}}
- Goals: {{{goals}}}
- Available Equipment: {{{availableEquipment}}}

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
