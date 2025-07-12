
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UserPlus, Calendar as CalendarIcon } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  dob: z.date({ required_error: 'Date of birth is required.' }),
});

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      dob: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const lowerCaseEmail = values.email.toLowerCase();

    try {
      // Step 0: Check if a pending membership exists for this email.
      const pendingMembershipRef = doc(db, 'memberships', lowerCaseEmail);
      const pendingSnap = await getDoc(pendingMembershipRef);

      if (!pendingSnap.exists() || pendingSnap.data().status !== 'pending') {
          toast({
              variant: 'destructive',
              title: 'Registration Not Allowed',
              description: 'This email does not have a pending membership. Please contact your gym administrator.',
          });
          return;
      }

      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, lowerCaseEmail, values.password);
      const { user } = userCredential;

      // Step 2: Create a user profile in Firestore with all details.
      await setDoc(doc(db, 'users', user.uid), {
        name: values.name,
        email: lowerCaseEmail,
        dob: Timestamp.fromDate(values.dob),
        createdAt: Timestamp.now(),
        gymId: null, // gymId will be set by the auth context trigger
      });
      
      // Redirect to home, where logic in AuthContext will handle claiming the membership.
      router.push('/');

    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already registered. Please login or use a different email.';
      } else {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-3 mb-2">
                    <UserPlus className="w-8 h-8 text-primary" />
                    <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
                </div>
              <CardDescription>Join Fitness Flow to start your journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                           <Input 
                            placeholder="John Doe" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                           <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name="dob" render={({ field }) => (
                      <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <FormControl>
                                      <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                  </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      captionLayout="dropdown"
                                      fromYear={1940}
                                      toYear={new Date().getFullYear()}
                                      disabled={(date) =>
                                          date > new Date() || date < new Date("1940-01-01")
                                      }
                                      initialFocus
                                  />
                              </PopoverContent>
                          </Popover>
                          <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-center text-sm">
                <p className="w-full text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline">
                        Login
                    </Link>
                </p>
            </CardFooter>
          </Card>
      </main>
    </div>
  );
}
