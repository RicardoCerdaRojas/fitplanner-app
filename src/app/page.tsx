"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Check, Dumbbell, Zap, LineChart, Shield, Star, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import GuestHomepage from '@/components/guest-homepage';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- COMPONENTES DE UTILIDAD Y DISEÑO ---
const Section = ({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) => (
    <section id={id} className={cn("py-24 md:py-32", className)}>
        <div className="container mx-auto px-4">{children}</div>
    </section>
);

const SectionTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={cn("text-4xl md:text-5xl font-bold tracking-tighter text-center text-white", className)}>
        {children}
    </h2>
);

const Header = () => (
    <header className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="container mx-auto flex justify-between items-center">
            <span className="text-xl font-bold text-white tracking-tight">FitPlanner</span>
            <nav className="hidden md:flex items-center gap-6">
                <Link href="#solution" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">La Solución</Link>
                <Link href="#audience" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Para Ti</Link>
            </nav>
            <Button className="bg-emerald-400 text-black hover:bg-emerald-500 font-semibold" asChild>
                <Link href="/create-gym">Comenzar Prueba</Link>
            </Button>
        </div>
    </header>
);

// --- COMPONENTES DE UI PARA EL DIORAMA DEL HERO ---
const AppPreview = () => (
    <div className="w-[240px] h-[480px] rounded-3xl border-4 border-gray-700 bg-gray-900/40 p-4 backdrop-blur-xl shadow-2xl flex flex-col">
        <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-400/20"></div>
            <div className="h-4 w-24 bg-gray-600 rounded-full"></div>
        </div>
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-black/20 p-3 rounded-lg">
                    <div className="h-3 w-3/4 bg-gray-700 rounded-full mb-2"></div>
                    <div className="h-2 w-full bg-gray-800 rounded-full relative">
                        <div className="absolute top-0 left-0 h-full bg-emerald-400 rounded-full" style={{ width: `${Math.random() * 80 + 20}%`}}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const GraphPreview = () => (
    <div className="w-[640px] h-[400px] rounded-2xl bg-gray-900/40 p-6 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col">
        <div className="h-4 w-32 bg-gray-600 rounded-full mb-4"></div>
        <div className="flex-grow flex items-end gap-2">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full bg-emerald-400/20 rounded-t-lg" style={{ height: `${Math.random() * 80 + 10}%`}}></div>
            ))}
        </div>
    </div>
);

const DashboardPreview = () => (
     <div className="w-[800px] h-[500px] rounded-2xl bg-gray-900/40 p-6 backdrop-blur-xl border border-white/10 shadow-2xl opacity-80">
        <div className="h-5 w-48 bg-gray-600 rounded-full mb-6"></div>
        <div className="grid grid-cols-3 gap-4 h-full">
            <div className="col-span-2 bg-black/20 rounded-lg p-4">
                <div className="h-4 w-3/4 bg-gray-700 rounded-full mb-4"></div>
                <div className="h-2/3 w-full bg-gray-800 rounded-md"></div>
            </div>
            <div className="col-span-1 bg-black/20 rounded-lg p-4 space-y-3">
                <div className="h-3 w-full bg-gray-700 rounded-full"></div>
                <div className="h-3 w-5/6 bg-gray-700 rounded-full"></div>
                <div className="h-3 w-full bg-gray-700 rounded-full"></div>
            </div>
        </div>
    </div>
);


// --- SECCIÓN 1: EL HÉROE (RECONSTRUIDO CON COMPONENTES DE UI) ---
const Hero = () => {
    const heroRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const appY = useTransform(scrollYProgress, [0, 1], ['0%', '150%']);
    const graphY = useTransform(scrollYProgress, [0, 1], ['0%', '75%']);

    return (
        <section ref={heroRef} className="relative h-[150vh]">
            <div className="sticky top-0 h-screen flex items-center overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-black" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_800px_at_75%_30%,#3b82f61a,transparent)]" />
                
                <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
                    <div className="relative z-10 text-left">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6">
                            Más Allá de la Gestión.<br/>
                            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text">
                                Hacia la Transformación.
                            </span>
                        </h1>
                        <p className="max-w-xl text-lg md:text-xl text-gray-300 mb-8">
                            FitPlanner es un ecosistema de lealtad. Convierte a tus miembros en tu comunidad más fiel a través de planificación inteligente, seguimiento en vivo y motivación personalizada.
                        </p>
                        <div className="flex gap-4">
                             <Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-lg py-7 px-8" asChild>
                                <Link href="/create-gym">Comenzar Prueba Gratuita</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative h-[600px] hidden md:block" style={{ perspective: '1000px' }}>
                        <motion.div style={{ transform: 'translateZ(0px) scale(1)' }} className="absolute inset-0 flex items-center justify-center">
                            <DashboardPreview />
                        </motion.div>
                        <motion.div style={{ y: graphY, transform: 'translateZ(200px) scale(0.8)' }} className="absolute inset-0 flex items-center justify-center">
                            <GraphPreview />
                        </motion.div>
                        <motion.div style={{ y: appY, transform: 'translateZ(400px) scale(0.6)' }} className="absolute inset-0 flex items-center justify-center">
                            <AppPreview />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- EL RESTO DE LA PÁGINA ---
// (Se omiten para el ejemplo, pero deberían ser restauradas después)
const Solution = () => null;
const AudienceSegmentation = () => null;

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) { router.replace('/home'); }
    }, [user, loading, router]);

    if (loading || user) { return <GuestHomepage />; }

    return (
        <div className="bg-black text-white font-sans" style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }}>
            <Header />
            <main>
                <Hero />
                {/* <Solution /> */}
                {/* <AudienceSegmentation /> */}
            </main>
             <footer className="text-center py-12 border-t border-white/10 mt-20">
                <p className="text-gray-500">&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
