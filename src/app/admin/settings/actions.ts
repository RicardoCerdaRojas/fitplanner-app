'use server';

import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

async function verifyAdmin(gymId: string, adminUid: string | undefined): Promise<boolean> {
  if (!adminUid) {
    console.error('Authentication check failed: No current user UID provided.');
    return false;
  }

  try {
    const userDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!userDoc.exists) {
      console.error(`Admin verification failed: User document not found for UID ${adminUid}.`);
      return false;
    }
    const userData = userDoc.data();
    if (userData?.role === 'gym-admin' && userData?.gymId === gymId) {
      return true;
    }
    console.error(`Admin verification failed: User ${adminUid} is not an admin for gym ${gymId}. Role: ${userData?.role}, GymID: ${userData?.gymId}`);
    return false;
  } catch (error) {
    console.error('Error during admin verification:', error);
    return false;
  }
}

export async function getSignedUrlAction(gymId: string, fileType: string, fileSize: number, adminUid: string | undefined) {
  if (!gymId) {
    return { failure: 'Missing Gym ID.' };
  }

  const isAuthorized = await verifyAdmin(gymId, adminUid);
  if (!isAuthorized) {
    return { failure: 'User is not authorized to upload to this gym.' };
  }
  
  if (!fileType.startsWith('image/')) {
    return { failure: 'Invalid file type. Only images are allowed.' };
  }
  if (fileSize > 5 * 1024 * 1024) { // 5MB limit
    return { failure: 'File size exceeds the 5MB limit.' };
  }

  try {
    const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileName = `${uuidv4()}`;
    const filePath = `logos/${gymId}/${fileName}`;
    
    const file = bucket.file(filePath);

    const options = {
      version: 'v4' as const,
      action: 'write' as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    };

    const [url] = await file.getSignedUrl(options);
    
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    return { success: { signedUrl: url, publicUrl: publicUrl } };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return { failure: 'Could not generate upload URL.' };
  }
}
