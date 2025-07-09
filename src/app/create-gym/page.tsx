'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { runTransaction, doc, collection } from 'firebase/firestore';
import { useEffect } from 'react';

const formSchema = z.object({
  gymName: z.string().min(3, { message: 'Gym name must be at least 3 characters.' }),
});

export default function CreateGymPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    // Redirect if the user is loaded and already has a gym
    if (!loading && userProfile?.gymId) {
      router.push('/');
    }
  }, [userProfile, loading, router]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gymName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a gym.' });
        return;
    }
    
    try {
      const gymCollectionRef = collection(db, 'gyms');
      const newGymRef = doc(gymCollectionRef);
      const userRef = doc(db, 'users', user.uid);
      const logoUrl = `https://placehold.co/100x50.png?text=${encodeURIComponent(values.gymName)}`;

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User profile not found.');
        }
        if (userDoc.data().gymId) {
          throw new Error('User is already part of a gym.');
        }

        transaction.set(newGymRef, {
          name: values.gymName,
          adminUid: user.uid,
          createdAt: new Date(),
          logoUrl: logoUrl,
        });

        transaction.update(userRef, {
          role: 'gym-admin',
          gymId: newGymRef.id,
        });
      });

      toast({ title: 'Success!', description: 'Your gym has been created. Redirecting...' });
    } catch (error: any) {
      console.error("Error creating gym:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || "Could not create gym." });
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Skeleton className="h-96 w-full max-w-lg" /></div>
  }
  
  if (!user) {
    router.push('/login');
    return null;
  }

  if (userProfile?.gymId) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <p>You are already part of a gym. Redirecting to dashboard...</p>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Building className="w-8 h-8 text-primary" />
                <CardTitle className="text-3xl font-headline">Set Up Your Gym</CardTitle>
            </div>
          <CardDescription>Let's get your gym registered on Fitness Flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="gymName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gym Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Downtown Fitness Club" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating Gym...' : 'Create Gym & Continue'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
