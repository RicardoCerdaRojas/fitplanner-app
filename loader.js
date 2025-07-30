'use client';

// Official Firebase App Hosting Image Loader
// https://firebase.google.com/docs/hosting/frameworks/nextjs#image-optimization
export default function firebaseImageLoader({ src, width, quality }) {
  const params = new URLSearchParams();
  params.set('src', src);
  params.set('w', width);
  params.set('q', quality || 75);
  return `/_fah/image/process?${params.toString()}`;
}
