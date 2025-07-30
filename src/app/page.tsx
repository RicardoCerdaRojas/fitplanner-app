"use client";

import { useState, useEffect, useRef } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Check, Dumbbell, Zap, LineChart, Shield, Star, Award, Bot, Heart, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import GuestHomepage from '@/components/guest-homepage';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';

// --- COMPONENTES DE UTILIDAD Y DISEÑO ---
const Section = ({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) => (
    <section id={id} className={cn("py-24 md:py-32", className)}>
        <div className="container mx-auto px-4">{children}</div>
    </section>
);
const SectionTitle = ({ children, subTitle, className }: { children: React.ReactNode; subTitle?: string; className?: string }) => (
    <div className="text-center mb-20">
        <h2 className={cn("text-4xl md:text-5xl font-bold tracking-tighter text-white", className)}>{children}</h2>
        {subTitle && <p className="max-w-3xl mx-auto text-lg text-gray-400 mt-4">{subTitle}</p>}
    </div>
);
const Header = () => (
    <header className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="container mx-auto flex justify-between items-center">
            <span className="text-xl font-bold text-white tracking-tight">FitPlanner</span>
            <nav className="hidden md:flex items-center gap-6">
                <Link href="#solution" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">La Solución</Link>
                <Link href="#audience" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Para Ti</Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Precios</Link>
                <Link href="#testimonials" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Testimonios</Link>
            </nav>
            <Link href="/create-gym" className={cn(buttonVariants({}), "bg-emerald-400 text-black hover:bg-emerald-500 font-semibold")}>
                Comenzar Prueba
            </Link>
        </div>
    </header>
);

// --- DIORAMAS DE UI ---
const AppPreview = () => ( <div className="w-[240px] h-[480px] rounded-3xl border-4 border-gray-700 bg-gray-900/40 p-4 backdrop-blur-xl shadow-2xl flex flex-col"> <div className="flex items-center gap-2 mb-4"> <div className="w-8 h-8 rounded-lg bg-emerald-400/20"></div> <div className="h-4 w-24 bg-gray-600 rounded-full"></div> </div> <div className="space-y-3"> {[...Array(4)].map((_, i) => ( <div key={i} className="bg-black/20 p-3 rounded-lg"> <div className="h-3 w-3/4 bg-gray-700 rounded-full mb-2"></div> <div className="h-2 w-full bg-gray-800 rounded-full relative"> <div className="absolute top-0 left-0 h-full bg-emerald-400 rounded-full" style={{ width: `${Math.random() * 80 + 20}%`}}></div> </div> </div> ))} </div> </div> );
const GraphPreview = () => ( <div className="w-[640px] h-[400px] rounded-2xl bg-gray-900/40 p-6 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col"> <div className="h-4 w-32 bg-gray-600 rounded-full mb-4"></div> <div className="flex-grow flex items-end gap-2"> {[...Array(12)].map((_, i) => ( <div key={i} className="w-full bg-emerald-400/20 rounded-t-lg" style={{ height: `${Math.random() * 80 + 10}%`}}></div> ))} </div> </div> );
const DashboardPreview = () => ( <div className="w-[800px] h-[500px] rounded-2xl bg-gray-900/40 p-6 backdrop-blur-xl border border-white/10 shadow-2xl opacity-80"> <div className="h-5 w-48 bg-gray-600 rounded-full mb-6"></div> <div className="grid grid-cols-3 gap-4 h-full"> <div className="col-span-2 bg-black/20 rounded-lg p-4"> <div className="h-4 w-3/4 bg-gray-700 rounded-full mb-4"></div> <div className="h-2/3 w-full bg-gray-800 rounded-md"></div> </div> <div className="col-span-1 bg-black/20 rounded-lg p-4 space-y-3"> <div className="h-3 w-full bg-gray-700 rounded-full"></div> <div className="h-3 w-5/6 bg-gray-700 rounded-full"></div> <div className="h-3 w-full bg-gray-700 rounded-full"></div> </div> </div> </div> );
const PlannerDiorama = () => ( <div className="w-full h-full bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl flex justify-center items-center"> <div className="w-full h-full grid grid-cols-7 grid-rows-5 gap-3"> {[...Array(35)].map((_, i) => (<div key={i} className={cn("rounded-md", i % 6 === 1 || i === 15 ? "bg-emerald-400/40 col-span-2" : "bg-black/20")}></div>))} </div> </div> );
const SessionDiorama = () => ( <div className="w-full h-full bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl flex justify-center items-center"> <div className="w-48 h-48 rounded-full border-8 border-emerald-400 flex items-center justify-center"> <div className="text-4xl font-bold text-white">45:00</div> </div> </div> );
const AnalyticsDiorama = () => ( <div className="w-full h-full bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col"> <div className="h-4 w-32 bg-gray-600 rounded-full mb-4"></div> <div className="flex-grow flex items-end gap-2"> {[...Array(12)].map((_, i) => (<div key={i} className="w-full bg-emerald-400/20 rounded-t-lg" style={{ height: `${Math.sin(i / 11 * Math.PI) * 80 + 10}%`}}></div>))} </div> </div> );

// --- SECCIÓN 1: EL HÉROE ---
const Hero = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const appY = useTransform(scrollYProgress, [0, 1], ['0%', '150%']);
    const graphY = useTransform(scrollYProgress, [0, 1], ['0%', '75%']);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (!heroRef.current) return;
            const { clientX, clientY } = event;
            heroRef.current.style.setProperty('--mouse-x', `${clientX}px`);
            heroRef.current.style.setProperty('--mouse-y', `${clientY}px`);
        };
        const container = heroRef.current;
        container?.addEventListener('mousemove', handleMouseMove);
        return () => container?.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section ref={heroRef} className="relative h-[150vh]">
            <div className="sticky top-0 h-screen flex items-center overflow-hidden">
                <div className="absolute inset-0 -z-20 bg-black" />
                <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808011_1px,transparent_1px),linear-gradient(to_bottom,#80808011_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_400px_at_var(--mouse-x)_var(--mouse-y),rgba(29,78,216,0.15),transparent)] transition-all duration-300 ease-out"></div>
                <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
                    <div className="relative z-10 text-left"><h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6">Mucho mas que Gestión.<br/><span className="bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text">estamos creando Fidelidad.</span></h1><p className="max-w-xl text-lg md:text-xl text-gray-300 mb-8">FitPlanner es un ecosistema de lealtad. Convierte a tus miembros en tu comunidad más fiel a través de planificación inteligente, seguimiento en vivo y motivación personalizada.</p><div className="flex gap-4"><Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-lg py-7 px-8" asChild><Link href="/create-gym">Comenzar Prueba Gratuita</Link></Button></div></div>
                    <div className="relative h-[600px] hidden md:block" style={{ perspective: '1000px' }}><motion.div style={{ transform: 'translateZ(0px) scale(1)' }} className="absolute inset-0 flex items-center justify-center"><DashboardPreview /></motion.div><motion.div style={{ y: graphY, transform: 'translateZ(200px) scale(0.8)' }} className="absolute inset-0 flex items-center justify-center"><GraphPreview /></motion.div><motion.div style={{ y: appY, transform: 'translateZ(400px) scale(0.6)' }} className="absolute inset-0 flex items-center justify-center"><AppPreview /></motion.div></div>
                </div>
            </div>
        </section>
    );
};

// --- SECCIÓN 2: LA SOLUCIÓN ---
const Solution = () => {
    const features = [{ icon: Dumbbell, title: "Planificación Inteligente", description: "Crea planes personalizados en minutos. O deja que nuestra IA genere programas optimizados para cualquier objetivo.", Diorama: PlannerDiorama }, { icon: Zap, title: "Seguimiento que Inspira", description: "Tus miembros ven su progreso en tiempo real a través de una app móvil que los mantiene motivados y enfocados.", Diorama: SessionDiorama }, { icon: LineChart, title: "Resultados que Fidelizan", description: "El progreso demostrado es la mejor herramienta de retención. Ten una visión 360° del avance de tus miembros.", Diorama: AnalyticsDiorama }];
    return(<Section id="solution" className="bg-[#050505]"><SectionTitle>Un Ecosistema de Lealtad en 3 Actos</SectionTitle><div className="space-y-32">{features.map((feature, index) => (<div key={feature.title} className={cn("grid md:grid-cols-2 gap-16 items-center", index % 2 === 1 && "md:grid-flow-row-dense md:grid-cols-2")}><div className={cn("md:pr-12", index % 2 === 1 && "md:order-2 md:pl-12 md:pr-0")}><div className="inline-block bg-emerald-400/10 p-3 rounded-xl mb-4 border border-emerald-400/20"><feature.icon className="w-8 h-8 text-emerald-400" /></div><h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3><p className="text-lg text-gray-400">{feature.description}</p></div><div className="h-[400px]"><feature.Diorama /></div></div>))}</div></Section>);
};

// --- SECCIÓN 3: SEGMENTACIÓN DE AUDIENCIA ---
const AudienceSegmentation = () => {
    const audiences = [{ icon: Shield, title: "Dueños de Gimnasio", benefits: ["Visión 360° del negocio", "Métricas de retención", "Gestión de staff", "Optimización"] }, { icon: Star, title: "Coaches Independientes", benefits: ["Marca personal pro", "Clientes ilimitados", "Ahorra horas", "Escala tu negocio"] }, { icon: Award, title: "Estudios Boutique", benefits: ["Experiencia premium", "Gestiona clases y secuencias", "Fideliza tu comunidad", "Marca blanca"] }];
    return (<Section id="audience" className="bg-black"><SectionTitle>Diseñado para tus Ambiciones</SectionTitle><div className="grid md:grid-cols-3 gap-8">{audiences.map(audience => (<div key={audience.title} className="bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col h-full"><div className="flex items-center gap-4 mb-6"><div className="bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20"><audience.icon className="w-8 h-8 text-emerald-400" /></div><h3 className="text-2xl font-bold text-white">{audience.title}</h3></div><ul className="space-y-3 text-gray-300 flex-grow">{audience.benefits.map(benefit => (<li key={benefit} className="flex items-start"><Check className="w-5 h-5 text-emerald-400 mr-3 mt-1 shrink-0" /><span>{benefit}</span></li>))}</ul></div>))}</div></Section>);
};

// --- SECCIÓN 4: DEMO INTERACTIVA DE IA ---
const AIInteraction = () => {
    const [goal, setGoal] = useState('muscle'); const [level, setLevel] = useState('intermediate'); const [isGenerating, setIsGenerating] = useState(false); const [routine, setRoutine] = useState<any[]>([]);
    const goals = [ { id: 'muscle', label: 'Músculo', icon: Dumbbell }, { id: 'fat-loss', label: 'Grasa', icon: Zap }, { id: 'health', label: 'Salud', icon: Heart } ];
    const levels = [ { id: 'beginner', label: 'Principiante', icon: User }, { id: 'intermediate', label: 'Intermedio', icon: User }, { id: 'advanced', label: 'Avanzado', icon: User } ];
    const routinesDb: any = { muscle: { beginner: ["Press de Banca 3x10", "Sentadillas 3x12", "Remo con Mancuerna 3x10"], intermediate: ["Press de Banca 4x8", "Sentadillas 4x8", "Dominadas 4xAMRAP"], advanced: ["Sentadillas 5x5", "Peso Muerto 3x5", "Press Militar 5x5"] }, 'fat-loss': { beginner: ["Caminata Inclinada 30min", "Plancha 3x45s", "Circuitos"], intermediate: ["Sprints HIIT 10x30s", "Burpees 4x15", "Kettlebell Swings"], advanced: ["Sprints en Cuesta", "Complejos con Barra", "Battle Ropes"] }, health: { beginner: ["Yoga/Pilates", "Caminata Ligera 30min", "Estiramientos"], intermediate: ["Trote Ligero 3-5km", "Nado 30min", "Entrenamiento Funcional"], advanced: ["Trail Running", "Movilidad Avanzada", "Calistenia"] } };
    const handleGenerate = () => { setIsGenerating(true); setRoutine([]); setTimeout(() => { setRoutine(routinesDb[goal][level]); setIsGenerating(false); }, 1500); };
    return (<Section id="ai-demo" className="bg-[#050505]"><SectionTitle subTitle="Selecciona tus parámetros y observa cómo nuestra inteligencia artificial diseña un plan de entrenamiento base en segundos.">Experimenta la Magia de la IA</SectionTitle><div className="grid md:grid-cols-12 gap-8 max-w-6xl mx-auto"><div className="md:col-span-4 bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl h-full flex flex-col"><div><h3 className="text-lg font-semibold text-white mb-4">1. Elige un Objetivo</h3><div className="grid grid-cols-3 gap-2">{goals.map(g => <Button key={g.id} onClick={() => setGoal(g.id)} variant={goal === g.id ? 'default' : 'secondary'} className={cn("flex-col h-20", goal === g.id && "bg-emerald-500 hover:bg-emerald-600")}><g.icon className="w-5 h-5 mb-1" />{g.label}</Button>)}</div></div><div className="mt-6"><h3 className="text-lg font-semibold text-white mb-4">2. Selecciona tu Nivel</h3><div className="flex flex-col space-y-2">{levels.map(l => <Button key={l.id} onClick={() => setLevel(l.id)} variant={level === l.id ? 'default' : 'secondary'} className={cn("w-full justify-start", level === l.id && "bg-emerald-500 hover:bg-emerald-600")}><l.icon className="w-4 h-4 mr-2" />{l.label}</Button>)}</div></div><div className="flex-grow"></div><Button onClick={handleGenerate} size="lg" className="w-full bg-emerald-400 text-black font-bold hover:bg-emerald-500 mt-8 text-lg py-7"><Bot className="w-6 h-6 mr-3" /> Generar Plan</Button></div><div className="md:col-span-8 bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl min-h-[400px] flex flex-col justify-center"><AnimatePresence mode="wait">{isGenerating ? <motion.div key="generating" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-center text-gray-400 space-y-4"><Bot className="w-12 h-12 mx-auto animate-pulse text-emerald-400" /><p className="font-semibold">Analizando tus parámetros...</p></motion.div> : routine.length > 0 ? <motion.div key="results" initial={{opacity: 0}} animate={{opacity: 1}} className="w-full"><h3 className="text-2xl font-bold text-white mb-6 text-center">Aquí tienes tu Plan Base:</h3><div className="space-y-3">{routine.map((item, i) => ( <motion.div key={item} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: i * 0.15}} className="flex justify-between items-center bg-black/20 p-4 rounded-lg"><span className="font-semibold text-white">{item.split(" ")[0]} {item.split(" ")[1]}</span><span className="text-emerald-400 font-mono text-lg">{item.split(" ")[2]}</span></motion.div>))}</div></motion.div> : <motion.div key="initial" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-center text-gray-500"><p>Tu rutina generada aparecerá aquí.</p></motion.div>}</AnimatePresence></div></div></Section>);
};

// --- SECCIÓN 5: PRECIOS ---
const Pricing = () => {
    const [isYearly, setIsYearly] = useState(false);
    const plans = [
        { name: "TRAINER", members: "Hasta 25 miembros", price: { monthly: 19990 }, features: ["Miembros Activos", "Generador IA Básico", "App para Atletas", "Soporte por Email"], recommended: false },
        { name: "STUDIO", members: "Hasta 100 miembros", price: { monthly: 49990 }, features: ["Todo en Trainer +", "Coaches Ilimitados", "Personalización de Marca", "Analíticas Avanzadas"], recommended: true },
        { name: "GYM", members: "Hasta 300 miembros", price: { monthly: 89990 }, features: ["Todo en Studio +", "API de Integración", "Soporte Prioritario", "Onboarding Personalizado"], recommended: false }
    ];
    const formatPrice = (price: number) => price.toLocaleString('de-DE');
    return( <Section id="pricing" className="bg-black"><SectionTitle subTitle="Comienza gratis por 14 días. Sin tarjeta de crédito. Cambia de plan cuando quieras.">Planes diseñados para tu crecimiento</SectionTitle><div className="flex items-center justify-center gap-4 mb-12"><span className={cn(isYearly ? 'text-gray-400' : 'text-white font-bold')}>Mensual</span><Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Cambiar a plan anual" /><span className={cn(isYearly ? 'text-white font-bold' : 'text-gray-400')}>Anual</span><span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">AHORRA 20%</span></div><div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">{plans.map(plan => { const yearlyPrice = Math.round(plan.price.monthly * 0.8); const displayPrice = isYearly ? yearlyPrice : plan.price.monthly; return ( <div key={plan.name} className={cn("bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col h-full", plan.recommended && "border-emerald-400/50")}>{plan.recommended && <div className="text-center mb-4"><span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">MÁS POPULAR</span></div>}<h3 className="text-2xl font-bold text-white text-center">{plan.name}</h3><p className="text-center text-gray-400 mt-2 h-6">{plan.members}</p><div className="text-center my-6"><span className="text-5xl font-extrabold text-white">${formatPrice(displayPrice)}</span><span className="text-gray-400">/mes</span></div><p className="text-center text-xs text-gray-500 mb-8">Cancela en cualquier momento</p><Button size="lg" className={cn("w-full text-lg py-7", !plan.recommended && "bg-white/10 text-white hover:bg-white/20", plan.recommended && "bg-emerald-400 text-black hover:bg-emerald-500")}>Empezar con {plan.name}</Button><ul className="space-y-3 text-gray-300 mt-8 flex-grow">{plan.features.map(feat => <li key={feat} className="flex items-start"><Check className="w-5 h-5 text-emerald-400 mr-3 mt-1 shrink-0" /><span>{feat}</span></li>)}</ul></div> )})}</div></Section> );
};

// --- SECCIÓN 6: TESTIMONIOS ---
const Testimonials = () => {
    const testimonials = [{ quote: "Pasé de un Excel caótico a una plataforma que grita profesionalismo. Mis clientes se sienten atletas de élite y mi negocio creció 60% en 6 meses.", name: "Matias R.", role: "Personal Trainer" }, { quote: "Competir con gimnasios low-cost en precio es imposible, pero con FitPlanner, les ganamos en experiencia. Nuestros miembros se quedan porque ven resultados y se sienten cuidados.", name: "Carolina L.", role: "Gerente, Fuerza Austral Gym" }, { quote: "Revolucionó cómo agendo mis clases. Mis alumnas aman tener sus secuencias en la app y la retención aumentó un 40%.", name: "Sofia V.", role: "Fundadora, Alma Pilates Studio" }];
    return (<Section id="testimonials" className="bg-[#050505]"><SectionTitle subTitle="Líderes del fitness ya están usando FitPlanner para transformar su negocio y fidelizar a sus miembros.">Resultados Reales, Clientes Reales</SectionTitle><div className="grid md:grid-cols-3 gap-8">{testimonials.map(t => (<div key={t.name} className="bg-gray-900/40 p-8 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col h-full"><p className="italic text-gray-300 mb-6 flex-grow text-lg">"{t.quote}"</p><div className="flex items-center gap-4 mt-auto"><div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20"><User className="w-6 h-6 text-emerald-400"/></div><div><p className="font-bold text-white">{t.name}</p><p className="text-sm text-emerald-400">{t.role}</p></div></div></div>))}</div></Section>);
};

// --- SECCIÓN 7: FAQ ---
const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const faqItems = [{ q: "¿Necesito instalar algún hardware?", a: "No. FitPlanner es 100% software. Funciona en cualquier dispositivo con internet." }, { q: "¿Me ayudan a migrar mis datos?", a: "¡Por supuesto! Nuestro equipo de soporte te ayudará durante el proceso de incorporación." }, { q: "¿Qué pasa si supero el límite de mi plan?", a: "No te preocupes, tu operación no se detendrá. Te notificaremos para que puedas actualizar fácilmente tu plan." }, { q: "¿Ofrecen una prueba gratuita?", a: "¡Sí! Ofrecemos una prueba gratuita de 14 días en todos los planes, sin necesidad de tarjeta de crédito." }];
    return (<Section id="faq" className="bg-black"><SectionTitle>Preguntas Frecuentes</SectionTitle><div className="max-w-3xl mx-auto space-y-4">{faqItems.map((item, index) => (<div key={index} className="bg-gray-900/40 rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden"><button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex justify-between items-center p-6 text-left font-bold text-lg text-white"><span>{item.q}</span><ChevronDown className={cn("w-6 h-6 transition-transform", openIndex === index && "rotate-180")} /></button><div className={cn("grid transition-all duration-300 ease-in-out", openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><div className="overflow-hidden"><div className="px-6 pb-6 text-gray-300"><p>{item.a}</p></div></div></div></div>))}</div></Section>);
};

// --- SECCIÓN 8: CTA FINAL ---
const FinalCTA = () => (
    <Section id="final-cta" className="text-center bg-[#050505]">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Es hora de construir un negocio de fitness<br/>a <span className="text-emerald-400">prueba de abandonos.</span></h2>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">Únete a la nueva generación de líderes del fitness. Comienza tu transformación hoy.</p>
        <Link href="/create-gym" className={cn(buttonVariants({ size: "lg" }), "bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-xl py-8 px-10")}>
            Comenzar mi Prueba Gratuita
        </Link>
    </Section>
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    useEffect(() => { if (!loading && user) { router.replace('/home'); } }, [user, loading, router]);
    if (loading || user) { return <GuestHomepage />; }

    return (
        <div className="bg-black text-white font-sans" style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }}>
            <Header />
            <main>
                <Hero />
                <Solution />
                <AudienceSegmentation />
                <AIInteraction />
                <Pricing />
                <Testimonials />
                <FAQ />
                <FinalCTA />
            </main>
             <footer className="text-center py-12 border-t border-white/10 mt-20">
                <p className="text-gray-500">&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
