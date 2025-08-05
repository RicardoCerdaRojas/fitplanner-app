'use server';

import { adminDb } from '@/lib/firebase/admin'; // Correctly import from the server-side admin file
import { z } from 'zod';

const emailSchema = z.string().email();

export async function checkMemberStatus(email: string) {
  const validation = emailSchema.safeParse(email);
  if (!validation.success) {
    return { status: 'INVALID_EMAIL_FORMAT' };
  }

  const lowercasedEmail = email.toLowerCase();

  try {
    const membershipRef = adminDb.collection('memberships').doc(`PENDING_${lowercasedEmail}`);
    const membershipSnap = await membershipRef.get();

    if (membershipSnap.exists && membershipSnap.data()?.status === 'pending') {
      return {
        status: 'INVITED',
        gymName: membershipSnap.data()?.gymName || 'your gym',
      };
    }

    const userEmailRef = adminDb.collection('userEmails').doc(lowercasedEmail);
    const userEmailSnap = await userEmailRef.get();

    if (userEmailSnap.exists) {
      return { status: 'REGISTERED' };
    }

    return { status: 'NOT_FOUND' };

  } catch (error: any) {
    // We keep the diagnostic logging for now, just in case.
    let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not found in env';
    console.error("CRITICAL ERROR in checkMemberStatus:", error);
    return { 
      status: 'ERROR', 
      message: `El backend falló al contactar la base de datos. Proyecto: [${projectId}]. Error: ${error.message}`
    };
  }
}
