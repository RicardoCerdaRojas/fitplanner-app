
'use client';

import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Rocket } from 'lucide-react';

export function TrialEnded() {
    const router = useRouter();
    
    return (
        <div className="relative flex flex-col min-h-screen bg-black text-white isolate">
            <div className="absolute inset-0 -z-10 h-full w-full bg-black">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15),transparent_70%)]"></div>
            </div>
            
            <AppHeader />
            
            <main className="flex-grow flex items-center justify-center p-4">
                <Card className="w-full max-w-lg text-center bg-gray-900/40 border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-900/20">
                    <CardHeader className="items-center">
                        <div className="bg-emerald-400/10 text-emerald-400 p-4 rounded-full w-fit mb-4 border border-emerald-400/20">
                            <Rocket className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-3xl font-headline text-white">
                            Es hora de llevar tu negocio al siguiente nivel
                        </CardTitle>
                        <CardDescription className="text-gray-400 pt-2 text-base">
                            Disfrutaste de 14 días de crecimiento y eficiencia. Elige un plan para continuar transformando tu negocio y reteniendo a tus miembros.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            size="lg" 
                            onClick={() => router.push('/admin/subscription')}
                            className="w-full sm:w-auto bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-lg py-6 px-8"
                        >
                            Ver Planes y Suscribirse
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
