
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
import { auth, db } from '@/lib/firebase/client'; // Correctly import from the new client file
import { doc, getDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { checkMemberStatus } from '../actions'; 
import { AnimatePresence, motion } from 'framer-motion';

// --- State Machine Definition ---
type ViewState = 
  | { name: 'IDENTIFY' }
  | { name: 'LOGIN'; email: string; }
  | { name: 'REGISTER'; email: string; gymName: string; };

// --- Zod Schema Definition ---
const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().optional(),
  name: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<ViewState>({ name: 'IDENTIFY' });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', name: '' },
  });
  
  const { control, handleSubmit, setError, trigger } = form;

  // --- The Core State Machine Logic ---
  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      if (view.name === 'IDENTIFY') {
        const isValid = await trigger("email");
        if (!isValid) return;

        const result = await checkMemberStatus(values.email);
        switch (result.status) {
          case 'REGISTERED':
            setView({ name: 'LOGIN', email: values.email });
            break;
          case 'INVITED':
            setView({ name: 'REGISTER', email: values.email, gymName: result.gymName || 'tu gimnasio' });
            break;
          case 'NOT_FOUND':
            setError("email", { type: "manual", message: "No se encontró una cuenta con este email." });
            break;
          case 'ERROR':
            // Display the detailed diagnostic message from the backend
            toast({ variant: "destructive", title: "Error de Configuración del Backend", description: result.message, duration: 10000 });
            break;
          default:
            toast({ variant: "destructive", title: "Error", description: "Ha ocurrido un error inesperado." });
        }
        return;
      }
      
      if (view.name === 'LOGIN') {
        if (!values.password) {
          setError("password", { type: "manual", message: "La contraseña es requerida." });
          return;
        }
        try {
          await signInWithEmailAndPassword(auth, view.email, values.password);
          router.push('/');
        } catch (error) {
          setError("password", { type: "manual", message: "La contraseña es incorrecta." });
        }
        return;
      }

      if (view.name === 'REGISTER') {
         if (!values.password || !values.name) {
            if(!values.name) setError("name", { type: "manual", message: "El nombre es requerido." });
            if(!values.password) setError("password", { type: "manual", message: "La contraseña es requerida." });
            return;
         }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, view.email, values.password);
            const batch = writeBatch(db);
            const newUserRef = doc(db, 'users', userCredential.user.uid);
            const userEmailRef = doc(db, 'userEmails', view.email.toLowerCase());
            const membershipRef = doc(db, 'memberships', `PENDING_${view.email.toLowerCase()}`);
            const membershipSnap = await getDoc(membershipRef);

            if (!membershipSnap.exists()) throw new Error("Invitación no encontrada.");
            
            const { gymId, role } = membershipSnap.data();
            batch.set(newUserRef, { name: values.name, email: view.email.toLowerCase(), createdAt: Timestamp.now(), gymId, role });
            batch.set(userEmailRef, { userId: userCredential.user.uid });
            batch.delete(membershipRef);
            await batch.commit();

            toast({ title: '¡Bienvenido!', description: `Tu cuenta ha sido creada en ${view.gymName}.` });
            router.push('/');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error en el Registro', description: error.message });
        }
      }
    });
  }

  // --- Dynamic UI Rendering based on State ---
  const getHeaderDetails = () => {
    switch (view.name) {
      case 'LOGIN': return { title: 'Ingresa tu Contraseña', description: `Iniciando sesión como ${view.email}` };
      case 'REGISTER': return { title: `¡Bienvenido a ${view.gymName}!`, description: 'Completa tus datos para registrarte.' };
      default: return { title: 'Bienvenido', description: 'Accede o crea tu cuenta para continuar.' };
    }
  };

  const getButtonText = () => {
    switch (view.name) {
      case 'LOGIN': return 'Ingresar';
      case 'REGISTER': return 'Completar Registro';
      default: return 'Continuar';
    }
  };

  const { title, description } = getHeaderDetails();

  return (
    <div className="relative flex flex-col min-h-screen bg-black text-white isolate">
      <div className="absolute inset-0 -z-10 h-full w-full bg-black"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div><div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15),transparent_70%)]"></div></div>
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
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" disabled={view.name !== 'IDENTIFY'} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <AnimatePresence>
                  {view.name === 'REGISTER' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <FormField control={control} name="name" render={({ field }) => (
                        <FormItem><FormLabel className="text-gray-300">Tu Nombre Completo</FormLabel><FormControl><Input placeholder="John Doe" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" /></FormControl><FormMessage /></FormItem>
                      )}/>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {(view.name === 'LOGIN' || view.name === 'REGISTER') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <FormField control={control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">{view.name === 'REGISTER' ? 'Crea una Contraseña' : 'Password'}</FormLabel>
                          <FormControl><Input type="password" placeholder="••••••••" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button type="submit" className="w-full bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-base py-6" disabled={isPending}>
                  {isPending ? 'Procesando...' : getButtonText()}
                </Button>
              </form>
            </Form>
          </CardContent>
          <AnimatePresence>
            {view.name === 'IDENTIFY' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
