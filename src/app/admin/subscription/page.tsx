
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, XCircle, Calendar, Sparkles } from 'lucide-react';
import { createCustomerPortalSession } from '@/app/stripe/actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useTransition } from 'react';
import { SubscriptionButton } from '@/components/subscription-button';
import { differenceInCalendarDays, format } from 'date-fns';
import { confirmSubscription } from '@/app/admin/actions';


function ProcessingPayment() {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="bg-green-500/10 p-4 rounded-full border border-green-500/20">
                    <CheckCircle className="h-12 w-12 text-green-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold">¡Pago Exitoso!</h2>
                <p className="text-lg text-muted-foreground">Estamos confirmando y actualizando tu suscripción. Esto puede tardar unos segundos...</p>
                 <div className="flex items-center gap-2 mt-4">
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Confirmando con Stripe... No cierres esta ventana.</span>
                </div>
            </div>
        </div>
    )
}


export default function SubscriptionPage() {
    const { toast } = useToast();
    const { activeMembership, gymProfile, user, userProfile, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    const [isPending, startTransition] = useTransition();

    const fromCheckout = searchParams.get('from_checkout');
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (fromCheckout && sessionId && user) {
            startTransition(async () => {
                const result = await confirmSubscription(sessionId, user.uid);
                
                if (result.error) {
                    toast({
                        variant: 'destructive',
                        title: 'Error de Confirmación',
                        description: `No se pudo confirmar tu suscripción: ${result.error}`,
                    });
                    router.replace('/admin/subscription');
                } else {
                    toast({
                        title: '¡Suscripción Confirmada!',
                        description: `Tu estado ahora es: ${result.status}`,
                    });
                    router.replace('/admin/subscription');
                    router.refresh(); 
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromCheckout, sessionId, user]);

    useEffect(() => {
        if (!loading && (!activeMembership || activeMembership.role !== 'gym-admin')) {
            router.push('/');
        }
    }, [loading, activeMembership, router]);


    const handleManageSubscription = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
            return;
        }

        setIsRedirecting(true);
        const { url, error } = await createCustomerPortalSession(user.uid);

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
            setIsRedirecting(false);
            return;
        }

        if (url) {
            window.location.href = url;
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not retrieve the customer portal URL.',
            });
            setIsRedirecting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-6xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                 <p className='mt-8 text-lg text-muted-foreground'>Cargando detalles de suscripción...</p>
            </div>
        );
    }
    
    if (isPending) {
        return <ProcessingPayment />;
    }

    const isSubscribed = userProfile?.stripeSubscriptionStatus === 'active' || userProfile?.stripeSubscriptionStatus === 'trialing';
    const trialEndsAt = gymProfile?.trialEndsAt?.toDate();
    const trialDaysLeft = trialEndsAt ? differenceInCalendarDays(trialEndsAt, new Date()) : 0;
    
    const renderSubscriptionStatus = () => {
        if (isSubscribed) {
             return (
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Suscripción Activa ({userProfile?.stripeSubscriptionStatus})</span>
                </div>
            );
        }
        if (trialDaysLeft > 0) {
             return (
                <div className="flex items-center gap-2 text-blue-600">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-semibold">
                       Período de Prueba ({trialDaysLeft} días restantes)
                    </span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Inactiva / Prueba Terminada</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-28 md:pb-8">
                 <div className="w-full max-w-2xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                    <AdminBottomNav />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Suscripción</CardTitle>
                            <CardDescription>Ve tu plan actual, estado de prueba y gestiona tu información de facturación.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Nombre del Gimnasio</span>
                                    <span className="font-semibold">{gymProfile?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Estado</span>
                                    {renderSubscriptionStatus()}
                                </div>
                                {!isSubscribed && trialEndsAt && trialDaysLeft > 0 && (
                                     <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">La prueba termina el</span>
                                        <span className="font-semibold flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {format(trialEndsAt, 'PPP')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {isSubscribed ? (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Tienes una suscripción activa. Puedes gestionar tus detalles de facturación, cambiar tu plan o cancelar tu suscripción en cualquier momento a través de nuestro portal de facturación seguro.
                                    </p>
                                    <Button onClick={handleManageSubscription} className="w-full" disabled={isRedirecting}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {isRedirecting ? 'Redirigiendo...' : 'Gestionar Facturación y Suscripción'}
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                     <p className="text-sm text-muted-foreground mb-4">
                                        {trialDaysLeft > 0 
                                            ? "Tu prueba está activa. Elige un plan a continuación para continuar con tu servicio después de que finalice la prueba. No se te cobrará hasta que termine tu prueba."
                                            : "Tu prueba ha finalizado. Elige un plan para seguir usando Fit Planner."
                                        }
                                    </p>
                                    <div className="space-y-2">
                                        <SubscriptionButton plan="TRAINER" />
                                        <SubscriptionButton plan="STUDIO" popular={true}/>
                                        <SubscriptionButton plan="GYM"/>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                 </div>
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
