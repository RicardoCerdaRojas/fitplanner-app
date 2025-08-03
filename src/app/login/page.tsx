
'use client';

import { useState, useTransition, useEffect } from 'react';
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

// Define the schema for the form
const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  name: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

// Define the states for our State Machine
type ViewState = 
  | { state: 'LOGIN' }
  | { state: 'REGISTER_INVITED'; gymName: string; email: string; }
  | { state: 'ERROR'; message: string };

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<ViewState>({ state: 'LOGIN' });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', name: '' },
  });
  
  const { control, handleSubmit, getValues } = form;

  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      if (view.state === 'REGISTER_INVITED') {
        if (!values.name) {
          toast({ variant: "destructive", title: "Nombre requerido", description: "Por favor, introduce tu nombre completo." });
          return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, view.email, values.password);
            const batch = writeBatch(db);
            const newUserRef = doc(db, 'users', userCredential.user.uid);
            const membershipRef = doc(db, 'memberships', `PENDING_${view.email.toLowerCase()}`);
            const membershipSnap = await getDoc(membershipRef);
            if (!membershipSnap.exists()) throw new Error("Invitación no encontrada.");
            
            const { gymId, role } = membershipSnap.data();
            batch.set(newUserRef, { name: values.name, email: view.email.toLowerCase(), createdAt: Timestamp.now(), gymId, role });
            
            // Also create the public email record
            const userEmailRef = doc(db, 'userEmails', view.email.toLowerCase());
            batch.set(userEmailRef, { userId: userCredential.user.uid });

            batch.delete(membershipRef);
            await batch.commit();

            toast({ title: '¡Bienvenido!', description: `Tu cuenta ha sido creada en ${view.gymName}.` });
            router.push('/');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error en el Registro', description: error.message });
        }
        return;
      }
      
      const result = await checkMemberStatus(values.email);
      
      switch (result.status) {
        case 'REGISTERED':
          try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            router.push('/');
          } catch (error) {
            toast({ variant: "destructive", title: "Error de inicio de sesión", description: "Credenciales inválidas. Por favor, revisa tu email y contraseña." });
          }
          break;
        case 'INVITED':
          setView({ state: 'REGISTER_INVITED', gymName: result.gymName || 'tu gimnasio', email: values.email });
          break;
        case 'NOT_FOUND':
          toast({ variant: "destructive", title: "Cuenta no encontrada", description: "El email que introdujiste no está registrado. Si fuiste invitado, usa el enlace de tu email." });
          break;
        default:
          toast({ variant: "destructive", title: "Error", description: "Ha ocurrido un error inesperado." });
      }
    });
  }
  
  const getHeaderDetails = () => {
    if (view.state === 'REGISTER_INVITED') {
      return { title: `¡Bienvenido a ${view.gymName}!`, description: 'Completa tus datos para registrarte.' };
    }
    return { title: 'Bienvenido de Vuelta', description: 'Accede a tu cuenta para continuar.' };
  };

  const { title, description } = getHeaderDetails();

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
                <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text">{title}</h1>
                <CardDescription className="text-gray-400 mt-2">{description}</CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl><Input type="email" placeholder="you@example.com" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" disabled={view.state === 'REGISTER_INVITED'} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <AnimatePresence>
                    {view.state === 'REGISTER_INVITED' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <FormField control={control} name="name" render={({ field }) => (
                          <FormItem><FormLabel className="text-gray-300">Tu Nombre Completo</FormLabel><FormControl><Input placeholder="John Doe" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <FormField control={control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">{view.state === 'REGISTER_INVITED' ? 'Crea una Contraseña' : 'Password'}</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-base py-6" disabled={isPending}>
                    {isPending ? 'Procesando...' : (view.state === 'REGISTER_INVITED' ? 'Completar Registro' : 'Ingresar')}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <AnimatePresence>
              {view.state === 'LOGIN' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <CardFooter className="flex-col text-center text-sm">
                    <p className="w-full text-gray-400">¿Fuiste invitado a un centro?{' '}<Link href="/join" className="text-emerald-400 font-semibold hover:underline">Únete aquí</Link></p>
                    <p className="w-full text-gray-400 mt-2">¿Quieres crear tu propio centro?{' '}<Link href="/create-gym" className="text-emerald-400 font-semibold hover:underline">Comienza tu prueba</Link></p>
                  </CardFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
       </main>
    </div>
  );
}
