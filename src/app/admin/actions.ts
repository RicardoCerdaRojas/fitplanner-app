
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';

export async function backfillUserGenders() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('gender', '==', null));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, updatedCount: 0, message: 'No users needed updating.' };
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      const userRef = doc.ref;
      batch.update(userRef, { gender: 'male' });
    });

    await batch.commit();

    return { success: true, updatedCount: querySnapshot.size };
  } catch (error) {
    console.error("Error backfilling user genders:", error);
    return { success: false, error: "An unexpected error occurred during the update." };
  }
}
