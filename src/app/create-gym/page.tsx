
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
import { Building, Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { themes } from '@/lib/themes';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app-header';

const formSchema = z.object({
  gymName: z.string().min(3, { message: 'Gym name must be at least 3 characters.' }),
  theme: z.string({ required_error: 'Please select a theme for your gym.' }),
});

export default function CreateGymPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, userProfile, loading, activeMembership } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gymName: '',
      theme: 'slate-mint',
    },
  });

  useEffect(() => {
    // Redirect away if the user already has a gym
    if (!loading && activeMembership) {
      router.push('/');
    }
  }, [loading, activeMembership, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a gym.' });
        return;
    }
    
    const selectedTheme = themes.find(t => t.id === values.theme);
    if (!selectedTheme) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid theme.' });
        return;
    }

    try {
        const batch = writeBatch(db);
        
        const gymRef = doc(collection(db, 'gyms'));
        batch.set(gymRef, {
            name: values.gymName,
            adminUid: user.uid,
            createdAt: new Date(),
            logoUrl: `https://placehold.co/100x50.png?text=${encodeURIComponent(values.gymName)}`,
            theme: selectedTheme.colors,
        });

        const membershipId = `${user.uid}_${gymRef.id}`;
        const membershipRef = doc(db, 'memberships', membershipId); 
        batch.set(membershipRef, {
            userId: user.uid,
            gymId: gymRef.id,
            role: 'gym-admin',
            userName: userProfile.name || user.email,
            gymName: values.gymName,
            status: 'active'
        });

        await batch.commit();
        
        toast({ title: 'Success!', description: 'Your gym has been created. Redirecting...' });
        
        window.location.href = '/';

    } catch (error: any) {
      console.error("Error creating gym:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || "Could not create gym." });
    }
  }
  
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <AppHeader />
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

              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center gap-2"><Palette/> Select a Theme</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-4"
                      >
                        {themes.map(theme => (
                            <FormItem key={theme.id} className="w-full">
                                <FormControl>
                                <RadioGroupItem value={theme.id} id={theme.id} className="sr-only" />
                                </FormControl>
                                <FormLabel 
                                    htmlFor={theme.id}
                                    className={cn(
                                        "flex flex-col items-start w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
                                        field.value === theme.id ? "border-primary shadow-md" : "border-muted"
                                    )}
                                >
                                     <div className="flex justify-between items-center w-full">
                                        <div className="font-bold text-card-foreground">{theme.name}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded-full" style={{backgroundColor: `hsl(${theme.colors.primary})`}}/>
                                            <div className="h-5 w-5 rounded-full" style={{backgroundColor: `hsl(${theme.colors.accent})`}}/>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
                                </FormLabel>
                            </FormItem>
                        ))}
                      </RadioGroup>
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
