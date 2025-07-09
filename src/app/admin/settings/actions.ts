'use server';

import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

// Helper function to verify if the current user is the admin of the specified gym.
// This is a crucial security check before generating a signed URL.
async function verifyAdmin(gymId: string): Promise<boolean> {
  const adminUid = auth.currentUser?.uid;
  if (!adminUid) {
    console.error('Authentication check failed: No current user.');
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
    console.error(`Admin verification failed: User ${adminUid} is not an admin for gym ${gymId}.`);
    return false;
  } catch (error) {
    console.error('Error during admin verification:', error);
    return false;
  }
}

// This server action generates a secure, short-lived URL that the client can use
// to upload the gym logo directly to Firebase Storage.
export async function getSignedUrlAction(gymId: string, fileType: string, fileSize: number) {
  if (!gymId) {
    return { failure: 'Missing Gym ID.' };
  }

  // Security Check: Ensure the user requesting the URL is the admin of the gym.
  const isAuthorized = await verifyAdmin(gymId);
  if (!isAuthorized) {
    return { failure: 'User is not authorized to upload to this gym.' };
  }
  
  // File validation
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
    
    // Construct the public URL that will be stored in Firestore after the upload is complete.
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    return { success: { signedUrl: url, publicUrl: publicUrl } };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return { failure: 'Could not generate upload URL.' };
  }
}
