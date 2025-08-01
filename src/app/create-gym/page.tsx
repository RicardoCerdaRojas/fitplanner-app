
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { CreateGymForm } from './components/create-gym-form';

export default function CreateGymPage() {
  const router = useRouter();
  const { loading, activeMembership } = useAuth();

  useEffect(() => {
    if (!loading && activeMembership) {
      router.push('/');
    }
  }, [loading, activeMembership, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <AppHeader />
        <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-muted-foreground">Verifying your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-black text-white isolate">
      <div className="absolute inset-0 -z-10 h-full w-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15),transparent_70%)]"></div>
      </div>
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-xl mx-auto bg-gray-900/40 border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-900/20">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <Building className="w-8 h-8 text-emerald-400" />
                    <CardTitle className="text-3xl font-headline text-white">Set Up Your Gym</CardTitle>
                </div>
            <CardDescription className="text-gray-400">Let's get your gym or business registered on Fit Planner.</CardDescription>
            </CardHeader>
            <CardContent>
                <CreateGymForm />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
