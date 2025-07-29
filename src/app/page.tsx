"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Check, ChevronDown, ArrowRight, Shield, ClipboardList, Target, Dumbbell, Flame } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import GuestHomepage from '@/components/guest-homepage';

// --- COMPONENTES DE LA PÁGINA (Se omiten por brevedad, pero existen en el archivo) ---
const Header = () => (
    <header className="absolute top-0 left-0 right-0 z-20 p-4 backdrop-blur-sm bg-black/10">
        <div className="container mx-auto flex justify-between items-center">
            <span className="text-2xl font-black text-white tracking-tight">Fit Planner</span>
            <nav className="hidden md:flex items-center gap-6">
                <Link href="#solution" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Soluciones</Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Precios</Link>
                <Link href="#testimonials" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Testimonios</Link>
                <Link href="#faq" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">FAQ</Link>
            </nav>
            <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-white hover:bg-white/10" asChild><Link href="/login">Login</Link></Button>
                <Button className="bg-emerald-400 text-black hover:bg-emerald-500 font-semibold" asChild><Link href="/create-gym">Comenzar Prueba</Link></Button>
            </div>
        </div>
    </header>
);

const Hero = () => (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4 text-center">
        <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight mb-6 text-white">
                Deja de gestionar ausencias.<br/>
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text">
                    Empieza a crear lealtad.
                </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-300 mb-8">
                La plataforma inteligente que combate la principal causa del abandono: la monotonía. Reduce la fuga de miembros con rutinas que evolucionan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-lg py-7 px-8" asChild>
                    <Link href="/create-gym">Prueba 14 Días Gratis <ArrowRight className="w-5 h-5 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="text-white bg-white/5 border-white/20 hover:bg-white/10 text-lg py-7 px-8">
                    Ver una Demo <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
            <div className="relative w-full flex items-center justify-center mt-16">
                 <Image 
                    src="https://placehold.co/1200x750/0a0a0a/111827?text=Fit+Planner+Dashboard" 
                    alt="Dashboard de Fit Planner"
                    width={1200}
                    height={750}
                    className="w-full max-w-4xl rounded-2xl shadow-2xl shadow-emerald-900/40"
                />
            </div>
        </div>
    </section>
);

const SectionWrapper = ({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) => (
    <section id={id} className={cn("py-16 md:py-24", className)}>
        <div className="container mx-auto px-4">
            {children}
        </div>
    </section>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight text-white mb-12">
        {children}
    </h2>
);

const Solution = () => (
    <SectionWrapper id="solution" className="bg-[#111827]">
        <SectionTitle>Un ecosistema. Tres roles. Sincronización perfecta.</SectionTitle>
        <div className="text-center max-w-3xl mx-auto">
            <Image 
                src="https://placehold.co/1000x600/111827/34d399?text=Diagrama+del+Ecosistema"
                alt="Diagrama del ecosistema Fit Planner"
                width={1000}
                height={600}
                className="rounded-lg shadow-xl"
            />
            <p className="text-gray-400 mt-8">Nuestra plataforma conecta a administradores, entrenadores y atletas en un ciclo de retroalimentación continuo que potencia los resultados y la retención.</p>
        </div>
    </SectionWrapper>
);

const Pricing = () => {
    const [isYearly, setIsYearly] = useState(false);
    return(
    <SectionWrapper id="pricing">
        <SectionTitle>Planes diseñados para tu crecimiento</SectionTitle>
         <div className="flex items-center justify-center gap-4 mb-12">
            <span className={cn(isYearly ? 'text-gray-400' : 'text-white font-bold')}>Mensual</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Cambiar a plan anual" />
            <span className={cn(isYearly ? 'text-white font-bold' : 'text-gray-400')}>Anual</span>
            <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">AHORRA 20%</span>
        </div>
        <div className="text-center text-gray-400">
            <p>Aquí irían las tarjetas de precios de Esencial, Profesional y Empresa.</p>
        </div>
    </SectionWrapper>
)};

const Testimonials = () => {
    const testimonials = [
        {
            quote: "Fit Planner revolucionó cómo agendo mis clases. Mis alumnas aman tener sus secuencias en la app y la retención aumentó un 40%. Dejé de ser administradora para volver a ser profesora.",
            name: "Sofia V.",
            role: "Fundadora, Alma Pilates Studio",
            avatar: "https://placehold.co/100x100/34d399/0a0a0a?text=SV"
        },
        {
            quote: "Pasé de un Excel caótico a una plataforma que grita profesionalismo. Mis clientes se sienten atletas de élite y mi negocio creció 60% en 6 meses. La mejor inversión que he hecho.",
            name: "Matias R.",
            role: "Personal Trainer",
            avatar: "https://placehold.co/100x100/3b82f6/0a0a0a?text=MR"
        },
        {
            quote: "Competir con gimnasios low-cost en precio es imposible, pero con Fit Planner, les ganamos en experiencia. Nuestros miembros se quedan porque ven resultados y se sienten cuidados. La IA es un game-changer.",
            name: "Carolina L.",
            role: "Gerente, Fuerza Austral Gym",
            avatar: "https://placehold.co/100x100/8b5cf6/0a0a0a?text=CL"
        }
    ];

    return (
        <SectionWrapper id="testimonials" className="bg-[#111827]">
            <SectionTitle>Líderes del fitness ya están transformando su negocio</SectionTitle>
            <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map(t => (
                    <div key={t.name} className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col">
                        <p className="italic text-gray-300 mb-6 flex-grow">"{t.quote}"</p>
                        <div className="flex items-center gap-4 mt-auto">
                            <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full" />
                            <div>
                                <p className="font-bold text-white">{t.name}</p>
                                <p className="text-sm text-emerald-400">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqItems = [
        { q: "¿Ofrecen una prueba gratuita?", a: "¡Sí! Ofrecemos una prueba gratuita de 14 días en cualquiera de nuestros planes, sin necesidad de tarjeta de crédito." },
        { q: "¿Qué pasa si supero el límite de mi plan?", a: "No te preocupes, tu operación no se detendrá. Te notificaremos para que puedas actualizar fácilmente tu plan desde tu panel de administrador." },
        { q: "¿Necesito instalar algún hardware o torniquetes?", a: "No. Fit Planner es 100% software. Funciona en cualquier dispositivo con internet." },
        { q: "¿Me ayudan a migrar mis datos desde otro sistema?", a: "¡Por supuesto! Nuestro equipo de soporte te ayudará durante el proceso de incorporación." }
    ];

    return (
        <SectionWrapper id="faq" className="bg-[#111827]">
            <SectionTitle>Preguntas Frecuentes</SectionTitle>
            <div className="max-w-3xl mx-auto space-y-4">
                {faqItems.map((item, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex justify-between items-center p-6 text-left font-bold text-lg text-white">
                            <span>{item.q}</span>
                            <ChevronDown className={cn("w-6 h-6 transition-transform", openIndex === index && "rotate-180")} />
                        </button>
                        <div className={cn("grid transition-all duration-300 ease-in-out", openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                            <div className="overflow-hidden"><div className="px-6 pb-6 text-gray-300"><p>{item.a}</p></div></div>
                        </div>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
};

// --- NUEVA SECCIÓN: FINAL CTA ---
const FinalCTA = () => (
    <SectionWrapper id="final-cta" className="text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Es hora de construir un negocio de fitness <br/> a <span className="text-emerald-400">prueba de abandonos.</span>
        </h2>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Únete a la nueva generación de líderes del fitness. Comienza tu transformación hoy.
        </p>
        <Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-xl py-8 px-10 transform hover:scale-105 transition-transform" asChild>
            <Link href="/create-gym">
             Comenzar mi Prueba Gratuita de 14 Días
            </Link>
        </Button>
        <p className="text-gray-500 mt-4 text-sm">Sin compromiso. Sin tarjeta de crédito. Solo resultados.</p>
    </SectionWrapper>
);


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/home');
        }
    }, [user, loading, router]);

    if (loading || user) {
        return <GuestHomepage />;
    }

    return (
        <div className="bg-[#0a0a0a] text-white font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Header />
            <main>
                <Hero />
                <Solution />
                <Pricing />
                <Testimonials />
                <FAQ />
                <FinalCTA />
            </main>
            <footer className="text-center py-12 border-t border-gray-800">
                <p className="text-gray-500">&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
