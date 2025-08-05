
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useTransition, useCallback, useMemo } from 'react';
import { AppHeader } from '@/components/app-header';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Mail, AlertTriangle, User, Lock } from 'lucide-react';
import { debounce } from 'lodash';
import { checkMemberStatus } from '../actions';

const fullSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, { message: 'Tu nombre debe tener al menos 2 caracteres.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type FullFormValues = z.infer<typeof fullSchema>;
type MemberStatus = 'IDLE' | 'CHECKING' | 'VALID' | 'INVALID' | 'REGISTERED' | 'ERROR';

export default function JoinPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [isPending, startTransition] = useTransition();
  const [emailStatus, setEmailStatus] = useState<MemberStatus>('IDLE');
  const [gymName, setGymName] = useState('');

  const form = useForm<FullFormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: { email: '', name: '', password: '' },
  });
  
  const { control, handleSubmit, watch, trigger } = form;
  const emailValue = watch('email');

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  const performEmailCheck = useCallback(async (email: string) => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) {
      setEmailStatus('IDLE');
      return;
    }
    
    setEmailStatus('CHECKING');
    const result = await checkMemberStatus(email);
    
    switch (result.status) {
      case 'INVITED':
        setGymName(result.gymName || '');
        setEmailStatus('VALID');
        break;
      case 'REGISTERED':
        setEmailStatus('REGISTERED');
        break;
      case 'NOT_FOUND':
        setEmailStatus('INVALID');
        break;
      default:
        setEmailStatus('ERROR');
        break;
    }
  }, [trigger]);
  
  const debouncedCheckEmail = useMemo(() => debounce(performEmailCheck, 500), [performEmailCheck]);
  
  useEffect(() => {
      debouncedCheckEmail(emailValue);
  }, [emailValue, debouncedCheckEmail]);

  async function onSubmit(values: FullFormValues) {
    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const authUser = userCredential.user;
        
        const membershipRef = doc(db, 'memberships', `PENDING_${values.email.toLowerCase()}`);
        const membershipSnap = await getDoc(membershipRef);
        
        if (!membershipSnap.exists() || membershipSnap.data().status !== 'pending') {
          throw new Error("Invitation not found or already claimed.");
        }
        
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

        toast({ title: '¡Bienvenido!', description: 'Tu cuenta ha sido creada y vinculada a tu centro.' });
        window.location.href = '/';
        
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error en el Registro',
          description: error.message || 'Ocurrió un error inesperado.',
        });
      }
    });
  }

  const renderEmailStatus = () => {
    switch (emailStatus) {
      case 'CHECKING':
        return <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="animate-spin h-3 w-3 border-b-2 border-current rounded-full"></span> Verificando invitación...</p>;
      case 'VALID':
        return <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> ¡Invitación encontrada para {gymName}!</p>;
      case 'INVALID':
        return <p className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> No se encontró una invitación para este email.</p>;
      case 'REGISTERED':
        return <p className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Este email ya está registrado. Por favor, <Link href="/login" className="underline">inicia sesión</Link>.</p>;
      case 'ERROR':
        return <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Error al verificar el email. Inténtalo de nuevo.</p>;
      default:
        return null;
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
                        Únete a tu Centro
                    </h1>
                </div>
              <CardDescription className="text-gray-400">Ingresa tu email para encontrar tu invitación.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={control}
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
                            disabled={emailStatus === 'VALID'}
                          />
                        </FormControl>
                        <div className="h-4 mt-2">
                          {renderEmailStatus()}
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <AnimatePresence>
                    {emailStatus === 'VALID' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="overflow-hidden space-y-6"
                      >
                         <FormField control={control} name="name" render={({ field }) => (
                            <FormItem><FormLabel className="text-gray-300">Tu Nombre</FormLabel><FormControl><Input placeholder="John Doe" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"/></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={control} name="password" render={({ field }) => (
                            <FormItem><FormLabel className="text-gray-300">Crea una Contraseña</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400"/></FormControl><FormMessage /></FormItem>
                        )}/>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <Button type="submit" className="w-full bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-base py-6" disabled={isPending || emailStatus !== 'VALID'}>
                    {isPending ? 'Creando cuenta...' : 'Completar Registro y Unirme'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-center text-sm">
                <p className="w-full text-gray-400">
                    ¿Ya tienes una cuenta?{' '}
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
