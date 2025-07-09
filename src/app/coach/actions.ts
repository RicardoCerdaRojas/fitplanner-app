
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

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
  athleteId: z.string().min(1, 'Client ID is required.'),
  userName: z.string().min(2, 'Client name is required.'),
  routineDate: z.coerce.date(),
  blocks: z.array(blockSchema).min(1),
  coachId: z.string().min(1, 'Coach ID is required.'),
  gymId: z.string().min(1, 'Gym ID is required.'),
});

export async function saveRoutineAction(routineData: any) {
    const validation = routineSchema.safeParse(routineData);

    if (!validation.success) {
        console.error("Server validation failed:", validation.error.flatten());
        return { success: false, error: "Invalid routine data provided. Please check your inputs." };
    }

    try {
        const { routineDate, ...restOfData } = validation.data;
        const docToWrite = {
            ...restOfData,
            routineDate: Timestamp.fromDate(routineDate),
            createdAt: Timestamp.now(),
        };
        await adminDb.collection('routines').add(docToWrite);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving routine:", error);
        return { success: false, error: error.message || "An unknown error occurred while saving the routine." };
    }
}
