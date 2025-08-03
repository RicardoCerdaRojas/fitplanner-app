'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { z } from 'zod';

const emailSchema = z.string().email();

export async function checkMemberStatus(email: string) {
  const validation = emailSchema.safeParse(email);
  if (!validation.success) {
    return { status: 'INVALID_EMAIL_FORMAT' };
  }

  const lowercasedEmail = email.toLowerCase();

  try {
    // 1. Check for a pending invitation first.
    const membershipRef = doc(db, 'memberships', `PENDING_${lowercasedEmail}`);
    const membershipSnap = await getDoc(membershipRef);

    if (membershipSnap.exists() && membershipSnap.data().status === 'pending') {
      return {
        status: 'INVITED',
        gymName: membershipSnap.data().gymName || 'your gym',
      };
    }

    // 2. If no invitation, check the public userEmails collection to see if the user is already registered.
    const userEmailRef = doc(db, "userEmails", lowercasedEmail);
    const userEmailSnap = await getDoc(userEmailRef);

    if (userEmailSnap.exists()) {
      return { status: 'REGISTERED' };
    }

    // 3. If neither, the user is not found.
    return { status: 'NOT_FOUND' };

  } catch (error) {
    console.error("Error in checkMemberStatus:", error);
    return { status: 'ERROR', message: 'An unexpected error occurred.' };
  }
}
