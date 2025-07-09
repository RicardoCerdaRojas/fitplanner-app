'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

// Self-contained Firebase Admin initialization
// This ensures a reliable connection within the server action environment.
if (getApps().length === 0) {
  // When running on App Hosting, initializeApp() discovers credentials automatically.
  // For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
  // to point to your service account key file.
  initializeApp();
}

const adminDb = getFirestore();

export async function getSignedUrlAction(gymId: string, fileType: string, fileSize: number, adminUid: string | undefined) {
  if (!gymId) {
    return { failure: 'Missing Gym ID.' };
  }
  
  if (!adminUid) {
    return { failure: 'User is not authenticated.' };
  }

  // --- Verification Logic ---
  try {
    const userDoc = await adminDb.collection('users').doc(adminUid).get();
    
    if (!userDoc.exists) {
      return { failure: `Authorization failed: User document not found for UID ${adminUid}.` };
    }
    
    const userData = userDoc.data();
    if (userData?.role !== 'gym-admin' || userData?.gymId !== gymId) {
      return { failure: 'User is not authorized to upload to this gym.' };
    }
  } catch (error: any) {
    console.error('Error during admin verification inside action:', error);
    // Provide a more detailed error message to the client for debugging.
    return { failure: `An unexpected error occurred during verification: ${error.message}` };
  }
  // --- End Verification ---
  
  if (!fileType.startsWith('image/')) {
    return { failure: 'Invalid file type. Only images are allowed.' };
  }
  if (fileSize > 5 * 1024 * 1024) { // 5MB limit
    return { failure: 'File size exceeds the 5MB limit.' };
  }

  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("Firebase Storage Bucket name is not configured on the server.");
    }
    const bucket = getStorage().bucket(bucketName);
    // Use a unique name for the file to prevent conflicts
    const fileName = `${uuidv4()}-${fileType.split('/')[1]}`;
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
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return { failure: `Could not generate upload URL: ${error.message}` };
  }
}
