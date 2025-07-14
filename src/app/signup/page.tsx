
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  dob: z.date({ required_error: 'Date of birth is required.' }),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Please select a gender.' }),
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
      gender: undefined,
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
        gender: values.gender,
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
     <div className="relative flex flex-col min-h-screen bg-black text-white isolate">
       <div className="absolute inset-0 -z-10 h-full w-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15),transparent_70%)]"></div>
      </div>

       <AppHeader />

      <main className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto bg-gray-900/40 border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-900/20">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text">
                        Crea tu Cuenta
                    </h1>
                </div>
              <CardDescription className="text-gray-400">Únete a Fit Planner para empezar tu viaje.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Nombre Completo</FormLabel>
                        <FormControl>
                           <Input 
                            placeholder="John Doe" 
                            {...field}
                            className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"
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
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                           <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            {...field}
                            className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="dob" render={({ field }) => (
                      <FormItem className="flex flex-col">
                          <FormLabel className="text-gray-300">Fecha de Nacimiento</FormLabel>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <FormControl>
                                      <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 hover:bg-gray-700/50 hover:text-white", !field.value && "text-gray-400")}>
                                          {field.value ? format(field.value, "PPP") : <span>Elige una fecha</span>}
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-gray-300">Género</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1 pt-2"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="male" className="border-gray-400 focus:ring-emerald-400" /></FormControl>
                              <FormLabel className="font-normal text-gray-300">Hombre</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="female" className="border-gray-400 focus:ring-emerald-400" /></FormControl>
                              <FormLabel className="font-normal text-gray-300">Mujer</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="other" className="border-gray-400 focus:ring-emerald-400" /></FormControl>
                              <FormLabel className="font-normal text-gray-300">Otro</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Contraseña</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field}
                            className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-base py-6" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-center text-sm">
                <p className="w-full text-gray-400">
                    Ya tienes una cuenta?{' '}
                    <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
                        Ingresa
                    </Link>
                </p>
            </CardFooter>
          </Card>
      </main>
    </div>
  );
}
