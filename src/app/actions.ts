"use server";

import { generateWorkoutRoutine, type GenerateWorkoutRoutineInput } from "@/ai/flows/generate-workout-routine";
import { z } from "zod";

const inputSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.string().min(10, "Please describe your goals in more detail."),
  availableEquipment: z.string().min(3, "Please list your available equipment."),
  age: z.number().positive(),
});

export async function generateRoutineAction(values: GenerateWorkoutRoutineInput) {
  const validatedInput = inputSchema.safeParse(values);
  if (!validatedInput.success) {
    return {
      success: false,
      error: validatedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generateWorkoutRoutine(validatedInput.data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: { _errors: ["An unexpected error occurred while generating the routine. Please try again."] },
    };
  }
}
