
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
import { Building, Palette, User, Mail, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { db, auth } from '@/lib/firebase';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { themes } from '@/lib/themes';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { addDays } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Tu nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, ingresa un email válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  gymName: z.string().min(3, { message: 'El nombre del centro debe tener al menos 3 caracteres.' }),
  theme: z.string({ required_error: 'Por favor, selecciona un tema.' }),
});

export default function CreateGymPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading, activeMembership } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      gymName: '',
      theme: 'slate-mint',
    },
  });

  useEffect(() => {
    if (!loading && activeMembership) {
      router.push('/');
    }
  }, [loading, activeMembership, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedTheme = themes.find(t => t.id === values.theme);
    if (!selectedTheme) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un tema válido.' });
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const authUser = userCredential.user;

        const batch = writeBatch(db);
        const trialEndDate = addDays(new Date(), 14);
        
        const gymRef = doc(collection(db, 'gyms'));
        batch.set(gymRef, {
            name: values.gymName,
            adminUid: authUser.uid,
            createdAt: Timestamp.now(),
            trialEndsAt: Timestamp.fromDate(trialEndDate),
            logoUrl: `https://placehold.co/100x50.png?text=${encodeURIComponent(values.gymName)}`,
            theme: selectedTheme.colors,
        });

        const membershipId = `${authUser.uid}_${gymRef.id}`;
        const membershipRef = doc(db, 'memberships', membershipId); 
        batch.set(membershipRef, {
            userId: authUser.uid,
            gymId: gymRef.id,
            role: 'gym-admin',
            userName: values.name,
            gymName: values.gymName,
            status: 'active'
        });
        
        const userRef = doc(db, 'users', authUser.uid);
        batch.set(userRef, {
            name: values.name,
            email: values.email.toLowerCase(),
            createdAt: Timestamp.now(),
            gymId: gymRef.id,
            role: 'gym-admin'
        });

        await batch.commit();
        
        toast({ title: '¡Éxito!', description: 'Tu centro ha sido creado. Redirigiendo...' });
        
        window.location.href = '/';

    } catch (error: any) {
      console.error("Error creating gym:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || "No se pudo crear el centro." });
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
            <p className="text-lg text-muted-foreground">Verificando tu cuenta...</p>
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
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-lg mx-auto bg-gray-900/40 border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-900/20">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <Building className="w-8 h-8 text-emerald-400" />
                    <CardTitle className="text-3xl font-headline text-white">Configura tu Centro</CardTitle>
                </div>
            <CardDescription className="text-gray-400">Vamos a registrar tu centro o negocio en Fit Planner.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel className="text-gray-300">Tu Nombre</FormLabel><FormControl><Input placeholder="John Doe" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"/></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel className="text-gray-300">Tu Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"/></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel className="text-gray-300">Tu Contraseña</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"/></FormControl><FormMessage /></FormItem>
                )}/>

                <hr className="border-white/10" />

                <FormField control={form.control} name="gymName" render={({ field }) => (
                    <FormItem><FormLabel className="text-gray-300">Nombre del Centro</FormLabel><FormControl><Input placeholder="Ej: 'Gimnasio Power', 'Estudio Pilates Zen'" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"/></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="theme" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2 text-gray-300"><Palette/> Selecciona un Tema</FormLabel>
                        <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 gap-4">
                            {themes.map(theme => (
                                <FormItem key={theme.id} className="w-full">
                                    <FormControl><RadioGroupItem value={theme.id} id={theme.id} className="sr-only" /></FormControl>
                                    <FormLabel htmlFor={theme.id} className={cn("flex flex-col items-start w-full p-4 rounded-lg border-2 cursor-pointer transition-all bg-gray-800/20", field.value === theme.id ? "border-emerald-400 shadow-md" : "border-white/10")}>
                                        <div className="flex justify-between items-center w-full">
                                            <div className="font-bold text-white">{theme.name}</div>
                                            <div className="flex items-center gap-2"><div className="h-5 w-5 rounded-full" style={{backgroundColor: `hsl(${theme.colors.primary})`}}/><div className="h-5 w-5 rounded-full" style={{backgroundColor: `hsl(${theme.colors.accent})`}}/></div>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{theme.description}</p>
                                    </FormLabel>
                                </FormItem>
                            ))}
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <Button type="submit" className="w-full bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-base py-6" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creando...' : 'Crear Centro y Continuar'}
                </Button>
                </form>
            </Form>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
