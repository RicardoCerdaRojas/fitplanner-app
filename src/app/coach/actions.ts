
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
});

const blockSchema = z.object({
    name: z.string().min(2, 'Block name is required.'),
    sets: z.string().min(1, 'Sets are required.'),
    exercises: z.array(exerciseSchema).min(1, 'Please add at least one exercise to this block.'),
});

const routineSchema = z.object({
  athleteId: z.string().min(1, 'Client ID is required.'),
  userName: z.string().min(2, 'Client name is required.'),
  routineDate: z.date(),
  blocks: z.array(blockSchema).min(1),
  coachId: z.string().min(1, 'Coach ID is required.'),
  gymId: z.string().min(1, 'Gym ID is required.'),
});

export async function saveRoutineAction(routineData: z.infer<typeof routineSchema>) {
    const validation = routineSchema.safeParse(routineData);

    if (!validation.success) {
        return { success: false, error: "Invalid routine data provided." };
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
    } catch (error) {
        console.error("Error saving routine:", error);
        return { success: false, error: "Could not save the routine to the database." };
    }
}
