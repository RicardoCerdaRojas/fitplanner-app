'use server';

import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function getSignedUrlAction(gymId: string, fileType: string, fileSize: number, adminUid: string | undefined) {
  if (!gymId) {
    return { failure: 'Missing Gym ID.' };
  }

  // --- Verification Logic ---
  let isAuthorized = false;
  if (adminUid) {
    try {
      const userDoc = await adminDb.collection('users').doc(adminUid).get();
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData?.role === 'gym-admin' && userData?.gymId === gymId) {
          isAuthorized = true;
        } else {
           console.error(`Authorization failed: Role or GymID mismatch. User Role: ${userData?.role}, User GymID: ${userData?.gymId}, Target GymID: ${gymId}`);
        }
      } else {
        console.error(`Authorization failed: User document not found for UID ${adminUid}.`);
      }
    } catch (error) {
      console.error('Error during admin verification inside action:', error);
      isAuthorized = false;
    }
  }
  // --- End Verification ---

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
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("Firebase Storage Bucket name is not configured on the server.");
    }
    const bucket = getStorage().bucket(bucketName);
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
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return { failure: error.message || 'Could not generate upload URL.' };
  }
}
