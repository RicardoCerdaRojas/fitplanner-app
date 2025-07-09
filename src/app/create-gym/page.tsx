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
import { runTransaction, doc, collection } from 'firebase/firestore';
import { useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const themes = [
    {
        id: 'slate-mint',
        name: 'Slate & Mint',
        description: 'Calm, focused, and modern, with a fresh accent.',
        colors: {
            background: '0 0% 100%',
            foreground: '224 71% 4%',
            card: '220 13% 98%',
            primary: '221 39% 28%',
            'primary-foreground': '160 76% 97%',
            accent: '160 76% 59%',
            'accent-foreground': '221 39% 28%',
            border: '214 32% 91%',
            input: '214 32% 91%',
            ring: '160 76% 59%',
        },
    },
    {
        id: 'ebony-gold',
        name: 'Ebony & Gold',
        description: 'Elegant and powerful, for a premium, exclusive feel.',
        colors: {
            background: '40 33% 97%',
            foreground: '240 10% 3.9%',
            card: '0 0% 100%',
            primary: '220 17% 20%',
            'primary-foreground': '45 86% 96%',
            accent: '45 86% 51%',
            'accent-foreground': '240 10% 3.9%',
            border: '214 32% 91%',
            input: '214 32% 91%',
            ring: '45 86% 51%',
        },
    },
    {
        id: 'steel-amber',
        name: 'Steel & Amber',
        description: 'A dynamic and energetic theme for a modern club.',
        colors: {
            background: '210 40% 98%',
            foreground: '222 47% 11%',
            card: '0 0% 100%',
            primary: '215 39% 35%',
            'primary-foreground': '210 40% 98%',
            accent: '25 95% 53%',
            'accent-foreground': '0 0% 100%',
            border: '214 32% 91%',
            input: '214 32% 91%',
            ring: '25 95% 53%',
        },
    },
];

const formSchema = z.object({
  gymName: z.string().min(3, { message: 'Gym name must be at least 3 characters.' }),
  theme: z.string({ required_error: 'Please select a theme for your gym.' }),
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
      theme: 'slate-mint',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a gym.' });
        return;
    }
    
    const selectedTheme = themes.find(t => t.id === values.theme);
    if (!selectedTheme) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid theme.' });
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
          theme: selectedTheme.colors,
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
                                <RadioGroupItem value={theme.id} className="sr-only" />
                                </FormControl>
                                <FormLabel 
                                    htmlFor={field.name + theme.id}
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
