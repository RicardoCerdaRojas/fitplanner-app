'use server';

import { adminDb } from '@/lib/firebase'; // Use the server-side adminDb
import { collection, doc, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import { getApp } from 'firebase-admin/app';

const emailSchema = z.string().email();

export async function checkMemberStatus(email: string) {
  const validation = emailSchema.safeParse(email);
  if (!validation.success) {
    return { status: 'INVALID_EMAIL_FORMAT' };
  }

  const lowercasedEmail = email.toLowerCase();

  try {
    const membershipsRef = adminDb.collection('memberships');
    const membershipRef = membershipsRef.doc(`PENDING_${lowercasedEmail}`);
    const membershipSnap = await membershipRef.get();

    if (membershipSnap.exists && membershipSnap.data()?.status === 'pending') {
      return {
        status: 'INVITED',
        gymName: membershipSnap.data()?.gymName || 'your gym',
      };
    }

    const userEmailsRef = adminDb.collection('userEmails');
    const userEmailRef = userEmailsRef.doc(lowercasedEmail);
    const userEmailSnap = await userEmailRef.get();

    if (userEmailSnap.exists) {
      return { status: 'REGISTERED' };
    }

    return { status: 'NOT_FOUND' };

  } catch (error: any) {
    let projectId = 'Not available';
    try {
      projectId = getApp().options.projectId || 'Not found';
    } catch (e) {
      projectId = 'Firebase Admin not initialized';
    }
    
    console.error("CRITICAL ERROR in checkMemberStatus:", error);
    
    return { 
      status: 'ERROR', 
      message: `El backend falló al contactar la base de datos. Proyecto: [${projectId}]. Error: ${error.message}`
    };
  }
}
