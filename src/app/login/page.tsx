
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app-header';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
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
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please check your email and password.',
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
                      Bienvenido de Vuelta
                    </h1>
                </div>
              <CardDescription className="text-gray-400">Accede a tu cuenta para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Password</FormLabel>
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
                    {form.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex-col text-center text-sm">
                <p className="w-full text-gray-400">
                    ¿Fuiste invitado a un centro?{' '}
                    <Link href="/join" className="text-emerald-400 font-semibold hover:underline">
                        Únete aquí
                    </Link>
                </p>
                 <p className="w-full text-gray-400 mt-2">
                    ¿Quieres crear tu propio centro?{' '}
                    <Link href="/create-gym" className="text-emerald-400 font-semibold hover:underline">
                        Comienza tu prueba
                    </Link>
                </p>
            </CardFooter>
          </Card>
      </main>
    </div>
  );
}
