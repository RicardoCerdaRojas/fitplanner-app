
'use client';

// This page is deprecated and its content has been moved.
// For gym owners, the new flow is at /src/app/create-gym/page.tsx.
// For invited members, the new flow is at /src/app/join/page.tsx.
// This file can be safely removed in a future cleanup.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/create-gym');
  }, [router]);

  return null;
}
