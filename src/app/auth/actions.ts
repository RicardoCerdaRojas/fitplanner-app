'use server';

import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const roleSchema = z.object({
    uid: z.string(),
    role: z.enum(['athlete', 'coach']),
});

export async function setUserRoleAction(data: { uid: string; role: 'athlete' | 'coach' }) {
    const validation = roleSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        await adminDb.collection('users').doc(validation.data.uid).set({
            role: validation.data.role,
        });
        return { success: true };
    } catch (error) {
        console.error("Error setting user role:", error);
        return { success: false, error: "Could not set user role." };
    }
}
