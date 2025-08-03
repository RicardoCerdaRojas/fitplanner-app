
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { checkMemberStatus } from '../actions'; 
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  name: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type MemberStatus = 'IDLE' | 'CHECKING' | 'INVITED' | 'REGISTERED' | 'NOT_FOUND' | 'ERROR';

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isInvited, setIsInvited] = useState(false);
  const [gymName, setGymName] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', name: '' },
  });
  
  const { control, handleSubmit } = form;

  async function onSubmit(values: FormValues) {
    startTransition(async () => {
        const result = await checkMemberStatus(values.email);
        
        if (result.status === 'INVITED') {
            setIsInvited(true);
            setGymName(result.gymName || '');
            
            // If the user hasn't provided a name yet, we stop here to let them fill it.
            if (!values.name) {
                toast({ title: 'Completa tu perfil', description: 'Por favor, introduce tu nombre para continuar.' });
                return;
            }

            // If we have the name, proceed with registration
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
                const authUser = userCredential.user;
                
                const membershipRef = doc(db, 'memberships', `PENDING_${values.email.toLowerCase()}`);
                const membershipSnap = await getDoc(membershipRef);

                if (!membershipSnap.exists()) throw new Error("Invitation not found.");

                const pendingData = membershipSnap.data();
                const batch = writeBatch(db);

                const newUserRef = doc(db, 'users', authUser.uid);
                batch.set(newUserRef, {
                    name: values.name,
                    email: values.email.toLowerCase(),
                    createdAt: Timestamp.now(),
                    gymId: pendingData.gymId,
                    role: pendingData.role,
                });
                batch.delete(membershipRef);
                await batch.commit();

                toast({ title: '¡Bienvenido!', description: `Tu cuenta ha sido creada en ${gymName}.` });
                router.push('/');

            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error en el Registro', description: error.message });
            }
        } else if (result.status === 'REGISTERED') {
            try {
                await signInWithEmailAndPassword(auth, values.email, values.password);
                router.push('/');
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid credentials. Please check your email and password.' });
            }
        } else if (result.status === 'NOT_FOUND') {
            toast({ variant: 'destructive', title: 'Cuenta no encontrada', description: 'No existe una cuenta con este correo electrónico.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.' });
        }
    });
  }
  
  const renderHeader = () => {
    if (isInvited) {
      return {
        title: `¡Bienvenido a ${gymName}!`,
        description: 'Crea tu cuenta para unirte al centro.'
      };
    }
    return {
      title: 'Bienvenido de Vuelta',
      description: 'Accede a tu cuenta para continuar'
    };
  };

  const { title, description } = renderHeader();

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
                <motion.div key={title} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text">
                      {title}
                    </h1>
                    <CardDescription className="text-gray-400 mt-2">{description}</CardDescription>
                </motion.div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" disabled={isInvited} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AnimatePresence>
                  {isInvited && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                       <FormField control={control} name="name" render={({ field }) => (
                            <FormItem><FormLabel className="text-gray-300">Tu Nombre Completo</FormLabel><FormControl><Input placeholder="John Doe" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </motion.div>
                  )}
                  </AnimatePresence>
                  <FormField control={control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">{isInvited ? 'Crea una Contraseña' : 'Password'}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-base py-6" disabled={isPending}>
                    {isPending ? 'Procesando...' : (isInvited ? 'Completar Registro' : 'Ingresar')}
                  </Button>
                </form>
              </Form>
            </CardContent>
             <AnimatePresence>
                {!isInvited && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
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
                    </motion.div>
                )}
            </AnimatePresence>
          </Card>
      </main>
    </div>
  );
}
