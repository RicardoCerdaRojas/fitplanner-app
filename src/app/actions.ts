'use server';

import { db } from '@/lib/firebase';
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
    const membershipRef = doc(db, 'memberships', `PENDING_${lowercasedEmail}`);
    const membershipSnap = await getDoc(membershipRef);

    if (membershipSnap.exists() && membershipSnap.data().status === 'pending') {
      return {
        status: 'INVITED',
        gymName: membershipSnap.data().gymName || 'your gym',
      };
    }

    const userEmailRef = doc(db, "userEmails", lowercasedEmail);
    const userEmailSnap = await getDoc(userEmailRef);

    if (userEmailSnap.exists()) {
      return { status: 'REGISTERED' };
    }

    return { status: 'NOT_FOUND' };

  } catch (error: any) {
    // --- Definitive Diagnostic Logging ---
    // This will tell us exactly what project the backend is trying to connect to.
    let projectId = 'Not available';
    try {
      // getApp() will throw if Firebase Admin is not initialized.
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
