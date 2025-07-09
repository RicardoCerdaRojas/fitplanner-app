'use server';

import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const createGymSchema = z.object({
  gymName: z.string().min(3, 'Gym name must be at least 3 characters.'),
});

export async function createGymAction(values: z.infer<typeof createGymSchema>, uid: string) {
  const validation = createGymSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided." };
  }

  if (!uid) {
    return { success: false, error: "User is not authenticated." };
  }

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const gymRef = adminDb.collection('gyms').doc();

    const userData = (await userRef.get()).data();
    if (!userData) {
      return { success: false, error: 'User profile not found.' };
    }
     if (userData.gymId) {
      return { success: false, error: 'User is already part of a gym.' };
    }

    const logoUrl = `https://placehold.co/100x50.png?text=${encodeURIComponent(validation.data.gymName)}`;

    await adminDb.runTransaction(async (transaction) => {
      // Create the new gym
      transaction.set(gymRef, {
        name: validation.data.gymName,
        adminUid: uid,
        createdAt: new Date(),
        logoUrl: logoUrl,
      });

      // Update the user's profile to be the admin of this new gym
      transaction.update(userRef, {
        role: 'gym-admin',
        gymId: gymRef.id,
      });
    });

    return { success: true, gymId: gymRef.id };
  } catch (error: any) {
    console.error("Error creating gym:", error);
    // Firestore can throw an error if the data URL is too large for an indexed field.
    if (error.message?.includes('exceeds the maximum allowed size')) {
      return { success: false, error: 'The logo image is too large. Please use a smaller file.' };
    }
    return { success: false, error: error.message || "Could not create gym." };
  }
}
