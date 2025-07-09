'use server';

import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

const addUserSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  role: z.enum(['coach', 'athlete']),
  gymId: z.string().min(1, 'Gym ID is required.'),
});

export async function addUserAction(values: z.infer<typeof addUserSchema>) {
  const validation = addUserSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Invalid data provided.' };
  }

  const { email, role, gymId } = validation.data;
  
  try {
    // Transaction to ensure atomicity
    await adminDb.runTransaction(async (transaction) => {
        const lowerCaseEmail = email.toLowerCase();
        const userQuery = adminDb.collection('users').where('email', '==', lowerCaseEmail);
        const userSnapshot = await transaction.get(userQuery);

        if (!userSnapshot.empty) {
            throw new Error('A user with this email already exists.');
        }

        const inviteRef = adminDb.collection('invites').doc(lowerCaseEmail);
        const inviteSnapshot = await transaction.get(inviteRef);

        if (inviteSnapshot.exists) {
            throw new Error('An invitation for this email already exists.');
        }

        transaction.set(inviteRef, {
            email: lowerCaseEmail,
            role,
            gymId,
            createdAt: FieldValue.serverTimestamp(),
        });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error adding user invite:', error);
    return { success: false, error: error.message || 'Could not send invitation.' };
  }
}

export async function getGymUsersAction(gymId: string) {
    if (!gymId) {
        return { success: false, error: "Gym ID is required." };
    }
    try {
        const usersSnapshot = await adminDb.collection('users')
            .where('gymId', '==', gymId)
            .get();

        if (usersSnapshot.empty) {
            return { success: true, data: [] };
        }
        
        const users = (usersSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(user => user.role && user.role !== null)) // Filter out users pending gym creation
            as { id: string, email: string, role: 'athlete' | 'coach' | 'gym-admin', status?: string }[];

        return { success: true, data: users };
    } catch (error) {
        console.error("Error fetching gym users:", error);
        return { success: false, error: "Could not fetch gym users." };
    }
}
