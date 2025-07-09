'use client';

import { useState } from 'react';
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
import { createGymAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  gymName: z.string().min(3, { message: 'Gym name must be at least 3 characters.' }),
});

export default function CreateGymPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();

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
    
    const result = await createGymAction(values, user.uid);
    
    if (result.success) {
        toast({ title: 'Success!', description: 'Your gym has been created.' });
        router.push('/');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Skeleton className="h-96 w-full max-w-lg" /></div>
  }
  
  if (!user) {
    router.push('/login');
    return null;
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
