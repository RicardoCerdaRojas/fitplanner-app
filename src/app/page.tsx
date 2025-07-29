
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ChevronDown, Dumbbell, Zap, LineChart, Shield, Star, Award } from 'lucide-react';
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
                <Link href="#testimonials" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Testimonios</Link>
            </nav>
            <Button className="bg-emerald-400 text-black hover:bg-emerald-500 font-semibold" asChild>
                <Link href="/create-gym">Comenzar Prueba</Link>
            </Button>
        </div>
    </header>
);

// --- SECCIÓN 1: EL HÉROE (RUTAS LOCALES) ---
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
                            <Button size="lg" variant="outline" className="text-white bg-white/5 border-white/20 hover:bg-white/10 text-lg py-7 px-8 backdrop-blur-sm">
                                Ver Ecosistema en Acción
                            </Button>
                        </div>
                    </div>
                    <div className="relative h-[600px] hidden md:block" style={{ perspective: '1000px' }}>
                        <motion.div style={{ transform: 'translateZ(0px) scale(1)' }} className="absolute inset-0 flex items-center justify-center">
                            <Image src="https://placehold.co/800x500.png" alt="Dashboard Conceptual del Coach" width={800} height={500} data-ai-hint="dashboard screen" className="w-full max-w-5xl opacity-30 rounded-2xl" />
                        </motion.div>
                        <motion.div style={{ y: graphY, transform: 'translateZ(200px) scale(0.8)' }} className="absolute inset-0 flex items-center justify-center">
                            <Image src="https://placehold.co/640x400.png" alt="Gráfico de Retención y Progreso" width={640} height={400} data-ai-hint="analytics graph" className="w-full max-w-3xl opacity-70" />
                        </motion.div>
                        <motion.div style={{ y: appY, transform: 'translateZ(400px) scale(0.6)' }} className="absolute inset-0 flex items-center justify-center">
                            <Image src="https://placehold.co/240x480.png" alt="App Premium para Miembros" width={240} height={480} data-ai-hint="phone app" className="rounded-3xl border-4 border-gray-700 shadow-2xl" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- SECCIÓN 2: LA SOLUCIÓN (RUTAS LOCALES) ---
const Solution = () => {
     const features = [
        { icon: Dumbbell, title: "Planificación Inteligente", visual: "https://placehold.co/1000x800.png" },
        { icon: Zap, title: "Seguimiento que Inspira", visual: "https://placehold.co/1000x800.png" },
        { icon: LineChart, title: "Resultados que Fidelizan", visual: "https://placehold.co/1000x800.png" }
    ];
    return(
        <Section id="solution" className="bg-[#050505]">
            <SectionTitle className="mb-20">Un Ecosistema de Lealtad en 3 Actos</SectionTitle>
            <div className="space-y-32">
            {features.map((feature, index) => (
                <div key={feature.title} className={cn("grid md:grid-cols-2 gap-16 items-center", index % 2 === 1 && "md:grid-flow-row-dense md:grid-cols-2")}>
                    <div className={cn("md:pr-12", index % 2 === 1 && "md:order-2 md:pl-12 md:pr-0")}>
                        <div className="inline-block bg-emerald-400/10 p-3 rounded-xl mb-4 border border-emerald-400/20"><feature.icon className="w-8 h-8 text-emerald-400" /></div>
                        <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
                        {/* Descripción omitida por brevedad */}
                    </div>
                    <div className="bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl"><Image src={feature.visual} alt={feature.title} width={1000} height={800} data-ai-hint="app screenshot" className="rounded-lg" /></div>
                </div>
            ))}
            </div>
        </Section>
    )
};

// --- SECCIÓN 3: SEGMENTACIÓN DE AUDIENCIA ---
const AudienceSegmentation = () => {
    const audiences = [
        { icon: Shield, title: "Dueños de Gimnasio", benefits: ["Visión 360°", "Métricas de retención", "Gestión de staff", "Optimización"] },
        { icon: Star, title: "Coaches Independientes", benefits: ["Marca personal pro", "Clientes ilimitados", "Ahorra horas", "Escala tu negocio"] },
        { icon: Award, title: "Estudios Boutique", benefits: ["Experiencia premium", "Gestiona clases y secuencias", "Fideliza tu comunidad", "Marca blanca"] }
    ];
    return (
        <Section id="audience" className="bg-black">
            <SectionTitle className="mb-20">Diseñado para tus Ambiciones</SectionTitle>
            <div className="grid md:grid-cols-3 gap-8">
                {audiences.map(audience => (
                    <div key={audience.title} className="bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20"><audience.icon className="w-8 h-8 text-emerald-400" /></div>
                            <h3 className="text-2xl font-bold text-white">{audience.title}</h3>
                        </div>
                        <ul className="space-y-3 text-gray-300 flex-grow">
                            {audience.benefits.map(benefit => (
                                <li key={benefit} className="flex items-start"><Check className="w-5 h-5 text-emerald-400 mr-3 mt-1 shrink-0" /><span>{benefit}</span></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Section>
    );
};

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
                <Solution />
                <AudienceSegmentation />
            </main>
             <footer className="text-center py-12 border-t border-white/10 mt-20">
                <p className="text-gray-500">&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
