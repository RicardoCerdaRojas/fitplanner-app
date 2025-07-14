

// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { 
    BarChart2, 
    Zap, 
    TrendingDown, 
    FileText, 
    Users, 
    ChevronRight, 
    Check, 
    Heart, 
    BrainCircuit,
    ChevronDown,
    ArrowRight,
    Repeat,
    Clock,
    UserX,
    MoveHorizontal,
    Shield,
    ClipboardList,
    Target,
    Dumbbell,
    Flame
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AppDashboardIllustration } from '@/components/ui/app-dashboard-illustration';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Autoplay from 'embla-carousel-autoplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ReactPlayer from 'react-player/lazy';


// --- Sub-components for better structure ---

const Section = ({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return (
        <section
            id={id}
            ref={ref}
            className={cn(
                "transition-opacity duration-1000 ease-out",
                isVisible ? "opacity-100 animate-fade-in-up" : "opacity-0",
                className
            )}
        >
            {children}
        </section>
    );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight text-white mb-12 relative">
        {children}
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-green-400"></span>
    </h2>
);

const HeroV2 = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const illustrationRef = useRef<HTMLDivElement>(null);
    const [showDemoModal, setShowDemoModal] = useState(false);

    useEffect(() => {
        const hero = heroRef.current;
        const illustration = illustrationRef.current;
        if (!hero || !illustration) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = hero;
            
            const xPos = (clientX / offsetWidth);
            const yPos = (clientY / offsetHeight);
            hero.style.setProperty('--mouse-x', `${xPos * 100}%`);
            hero.style.setProperty('--mouse-y', `${yPos * 100}%`);

            const rect = illustration.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const rotateX = (clientY - centerY) / 40; 
            const rotateY = (clientX - centerX) / -40;

            illustration.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        const handleMouseLeave = () => {
             if (illustration) {
                illustration.style.transform = `rotateX(0deg) rotateY(0deg)`;
            }
        }
        
        hero.addEventListener('mousemove', handleMouseMove);
        hero.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
            if (hero) {
                hero.removeEventListener('mousemove', handleMouseMove);
                hero.removeEventListener('mouseleave', handleMouseLeave);
            }
        }
    }, []);

    return (
        <>
        <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
            <DialogContent className="max-w-3xl p-0 border-0">
                 <DialogHeader className="sr-only">
                    <DialogTitle>Video de Demostración de Fit Planner</DialogTitle>
                    <DialogDescription>Un video corto que muestra las características principales de la aplicación Fit Planner.</DialogDescription>
                </DialogHeader>
                <div className="aspect-video">
                    <ReactPlayer
                        url='https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                        playing={showDemoModal}
                        controls
                        width="100%"
                        height="100%"
                    />
                </div>
            </DialogContent>
        </Dialog>
        <div ref={heroRef} className="group relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4 isolate">
            <div className="absolute inset-0 -z-10 h-full w-full bg-black">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_500px_at_var(--mouse-x)_var(--mouse-y),#3b82f633,transparent)] transition-all duration-500 ease-out"></div>
            </div>
            
            <header className="absolute top-0 left-0 right-0 z-20 p-4 backdrop-blur-sm bg-black/10">
                <div className="container mx-auto flex justify-between items-center">
                    <span className="text-2xl font-black text-white tracking-tight">Fit Planner</span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild><Link href="/login">Ingresar</Link></Button>
                        <Button className="bg-white text-black hover:bg-gray-200 font-semibold" asChild><Link href="/signup">Comenzar Prueba</Link></Button>
                    </div>
                </div>
            </header>

            <div className="relative z-10 flex flex-col items-center text-center container mx-auto pt-20 md:pt-0">
                 <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-emerald-400 mb-2">
                      Fit Planner
                    </h2>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight mb-6">
                        <span className="animate-stagger-in block" style={{"--stagger-delay": "0.4s"} as React.CSSProperties}>Deja de gestionar ausencias.</span>
                        <span className="animate-stagger-in block bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text" style={{"--stagger-delay": "0.6s"} as React.CSSProperties}>
                            Empieza a crear lealtad.
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-300 mb-8">
                        La plataforma inteligente que combate la principal causa del abandono: la monotonía. Reduce la fuga de miembros con rutinas que evolucionan.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-lg py-7 px-8 transform hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20" asChild>
                            <Link href="/signup">
                                Prueba 14 Días Gratis <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                        <Button onClick={() => setShowDemoModal(true)} size="lg" variant="outline" className="text-white bg-white/5 border-white/20 hover:bg-white/10 text-lg py-7 px-8 backdrop-blur-sm transition-all">
                            Ver una demo <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
                
                <div className="relative w-full flex items-center justify-center mt-12 animate-fade-in [perspective:1000px]" style={{ animationDelay: '0.8s' }}>
                    <div ref={illustrationRef} className="hero-illustration transition-transform duration-300 ease-out">
                         <AppDashboardIllustration className="w-full max-w-4xl shadow-2xl shadow-emerald-900/40 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

const ImageComparisonSlider = ({ before, after, beforeHint, afterHint }: { before: string, after: string, beforeHint: string, afterHint: string }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        setSliderPos(percentage);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        e.preventDefault();
    };
    
    const handleMouseUp = (e: React.MouseEvent) => {
        isDragging.current = false;
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        handleMove(e.clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
        const currentContainer = containerRef.current;
        const handleMouseUpWindow = () => { isDragging.current = false; };
        
        window.addEventListener('mouseup', handleMouseUpWindow);
        currentContainer?.addEventListener('touchmove', handleTouchMove, { passive: true });

        return () => {
            window.removeEventListener('mouseup', handleMouseUpWindow);
            currentContainer?.removeEventListener('touchmove', handleTouchMove);
        }
    }, [handleTouchMove]);
    
    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-[4/3] max-w-xl mx-auto rounded-lg overflow-hidden select-none cursor-ew-resize group"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <Image
                src={before}
                alt="El caos de la gestión manual"
                width={600}
                height={450}
                className="absolute inset-0 w-full h-full object-cover"
                data-ai-hint={beforeHint}
            />
            <div 
                className="absolute inset-0 w-full h-full overflow-hidden" 
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <Image
                    src={after}
                    alt="El orden y la claridad de Fit Planner"
                    width={600}
                    height={450}
                    className="absolute inset-0 w-full h-full object-cover"
                    data-ai-hint={afterHint}
                />
            </div>
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white/50 group-hover:bg-white transition-colors duration-200"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
            >
                <div 
                    className="absolute top-1/2 -translate-y-1/2 -left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white/50 group-hover:bg-white transition-colors duration-200 flex items-center justify-center backdrop-blur-sm border-2 border-white/30"
                    onMouseDown={handleMouseDown}
                >
                    <MoveHorizontal className="w-5 h-5 text-black" />
                </div>
            </div>
        </div>
    );
};

const AIPoweredGeneratorSection = () => {
    const routines = {
        upper: {
            title: "Rutina de Tren Superior",
            exercises: [
                { name: "Press de Banca", sets: 4, reps: 8, weight: "75kg" },
                { name: "Dominadas", sets: 4, reps: 10, weight: "BW" },
                { name: "Remo con Barra", sets: 3, reps: 12, weight: "60kg" },
            ],
        },
        lower: {
            title: "Rutina de Tren Inferior",
            exercises: [
                { name: "Sentadillas", sets: 5, reps: 5, weight: "100kg" },
                { name: "Peso Muerto Rumano", sets: 3, reps: 10, weight: "80kg" },
                { name: "Prensa de Piernas", sets: 4, reps: 15, weight: "120kg" },
            ],
        },
        cardio: {
            title: "Cardio Explosivo",
            exercises: [
                { name: "Burpees", sets: 5, duration: "45s", rest: "15s" },
                { name: "Sprints en Cinta", sets: 8, duration: "30s", rest: "30s" },
                { name: "Saltos de Caja", sets: 4, reps: 12, weight: "24in" },
            ],
        },
    };

    const [activeRoutine, setActiveRoutine] = useState('upper');
    const [isAnimating, setIsAnimating] = useState(false);
    const routineKey = useRef(0);

    const handleSelectRoutine = (routine: keyof typeof routines) => {
        if (routine === activeRoutine) return;

        setIsAnimating(true);
        setTimeout(() => {
            setActiveRoutine(routine);
            routineKey.current += 1; // Change key to force re-render and re-animate
            setIsAnimating(false);
        }, 300); // Duration of fade-out animation
    };

    const displayedRoutine = routines[activeRoutine];

    return (
        <div className="w-full bg-[#111827] overflow-hidden">
            <div className="w-full relative">
                <div className="absolute inset-0 -z-10 bg-grid-white/5"></div>
                <div className="absolute inset-x-0 top-0 h-64 -z-10 bg-gradient-to-b from-black to-transparent"></div>
                <div className="absolute inset-0 -z-20 animate-aurora-1 bg-[radial-gradient(ellipse_at_20%_80%,#34d39944,transparent_50%)]"></div>
                <div className="absolute inset-0 -z-20 animate-aurora-2 bg-[radial-gradient(ellipse_at_80%_30%,#3b82f644,transparent_50%)]"></div>
                
                 <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">La Monotonía es el Enemigo</h2>
                        <p className="text-xl text-emerald-400 font-semibold mb-6">Genera rutinas personalizadas en segundos.</p>
                        <p className="text-gray-300">
                            Nuestra IA combate la principal causa de abandono. Ahorra horas de trabajo a tus coaches y entrega variedad infinita a tus miembros, manteniendo la motivación siempre al máximo.
                        </p>
                    </div>
                    
                    <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
                        {/* Left Panel: Controls */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
                                <h3 className="font-bold text-lg mb-4">Elige un Objetivo</h3>
                                <div className="space-y-3">
                                    <Button 
                                        onClick={() => handleSelectRoutine('upper')} 
                                        variant={activeRoutine === 'upper' ? 'default' : 'secondary'}
                                        className={cn("w-full justify-start text-base py-6", activeRoutine === 'upper' ? "bg-emerald-500 hover:bg-emerald-600" : "")}
                                    >
                                        <Dumbbell className="mr-3" /> Tren Superior
                                    </Button>
                                    <Button 
                                        onClick={() => handleSelectRoutine('lower')} 
                                        variant={activeRoutine === 'lower' ? 'default' : 'secondary'}
                                        className={cn("w-full justify-start text-base py-6", activeRoutine === 'lower' ? "bg-emerald-500 hover:bg-emerald-600" : "")}
                                    >
                                        <Dumbbell className="mr-3" /> Tren Inferior
                                    </Button>
                                    <Button 
                                        onClick={() => handleSelectRoutine('cardio')} 
                                        variant={activeRoutine === 'cardio' ? 'default' : 'secondary'}
                                        className={cn("w-full justify-start text-base py-6", activeRoutine === 'cardio' ? "bg-emerald-500 hover:bg-emerald-600" : "")}
                                    >
                                        <Flame className="mr-3" /> Cardio Explosivo
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-400 mt-4 text-center">...o describe cualquier objetivo personalizado.</p>
                            </div>
                        </div>

                        {/* Right Panel: Display */}
                        <div className="lg:col-span-8">
                            <div className={cn("bg-[#111827] rounded-2xl p-8 transition-opacity duration-300", isAnimating ? "opacity-0" : "opacity-100")}>
                                <div key={routineKey.current} className="animate-fade-in">
                                    <h3 className="text-2xl font-bold mb-6 animate-stagger-in" style={{"--stagger-delay": "0.1s"} as React.CSSProperties}>{displayedRoutine.title}</h3>
                                    <div className="space-y-4">
                                        {displayedRoutine.exercises.map((ex, i) => (
                                            <div key={ex.name} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center animate-stagger-in" style={{"--stagger-delay": `${(i + 2) * 0.1}s`} as React.CSSProperties}>
                                                <p className="font-semibold text-gray-200">{ex.name}</p>
                                                <div className="flex items-center gap-4 text-gray-400 text-sm">
                                                    <span className="flex items-center gap-1.5"><Repeat className="w-4 h-4 text-emerald-400" /> {ex.reps ? `${ex.reps} reps` : `${ex.duration}`}</span>
                                                    {ex.weight && <span className="flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-emerald-400" /> {ex.weight}</span>}
                                                    {ex.rest && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" /> {ex.rest} rest</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function V2LandingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [activeSolution, setActiveSolution] = useState('admin');
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const plugin = useRef(
      Autoplay({ delay: 5000, stopOnInteraction: true })
    );

    const toggleFaq = (index: number) => {
        setFaqOpen(faqOpen === index ? null : index);
    };
    
    const solutionContent = {
        admin: {
            icon: Shield,
            title: "Visión 360 para el Administrador",
            text: "Toma el control total de tu negocio. Desde un único dashboard, supervisa la actividad en tiempo real, gestiona membresías y analiza datos clave para tomar decisiones estratégicas que impulsen tu crecimiento. Menos administración, más estrategia.",
        },
        coach: {
            icon: ClipboardList,
            title: "Herramientas de Precisión para el Coach",
            text: "Dedica tu tiempo a lo que amas: entrenar. Crea y asigna rutinas personalizadas en minutos, utiliza nuestra IA para generar entrenamientos variados y sigue el progreso de tus atletas con un detalle sin precedentes. Eleva tu coaching al siguiente nivel.",
        },
        athlete: {
            icon: Target,
            title: "Una Experiencia Inmersiva para el Atleta",
            text: "Transforma cada entrenamiento en una victoria. Con una app intuitiva, tus miembros pueden seguir sus rutinas, registrar su progreso con un temporizador integrado y recibir feedback constante. Es la motivación que necesitan para volver por más.",
        },
    };

    const ActiveIcon = solutionContent[activeSolution].icon;
    
    const faqItems = [
        {
            q: "¿Ofrecen prueba gratuita?",
            a: "¡Sí! Ofrecemos 14 días de prueba gratuita en cualquiera de nuestros planes, sin necesidad de ingresar tu tarjeta de crédito. Queremos que experimentes el poder de Fit Planner por ti mismo."
        },
        {
            q: "¿Qué pasa si supero el límite de mi plan?",
            a: "No te preocupes, tu operación no se detendrá. Te notificaremos para que puedas actualizar tu plan fácilmente desde tu panel de administración. El cambio es instantáneo."
        },
        {
            q: "¿Necesito instalar hardware o torniquetes?",
            a: "No. Fit Planner es 100% software. Nos enfocamos en lo que pasa dentro de tu gimnasio, no en la puerta. Funciona en cualquier dispositivo con internet: computadores, tablets y móviles."
        },
        {
            q: "¿Se integra con el SII para boletas electrónicas?",
            a: "Actualmente nos integramos con Stripe, la pasarela de pagos líder a nivel mundial, para una gestión de cobros simple y segura. Nuestro foco está en las herramientas de entrenamiento, no en la contabilidad compleja."
        },
        {
            q: "¿Me ayudan a pasar mis datos desde otro sistema?",
            a: "¡Por supuesto! Nuestro equipo de soporte te ayudará en el proceso de onboarding para importar tus miembros y rutinas existentes, asegurando una transición fluida."
        }
    ];

    const plans = {
        monthly: [
            { name: "TRAINER", price: 19990, members: 25, features: ["Miembros Activos", "Generador IA Básico", "App para Atletas", "Soporte por Email"] },
            { name: "STUDIO", price: 49990, members: 100, features: ["Todo en Trainer +", "Coaches Ilimitados", "Personalización de Marca", "Analíticas Avanzadas"], popular: true },
            { name: "GYM", price: 89990, members: 300, features: ["Todo en Studio +", "API de Integración", "Soporte Prioritario", "Onboarding Personalizado"] }
        ],
        yearly: [
            { name: "TRAINER", price: 19990 * 0.8, members: 25, features: ["Miembros Activos", "Generador IA Básico", "App para Atletas", "Soporte por Email"] },
            { name: "STUDIO", price: 49990 * 0.8, members: 100, features: ["Todo en Trainer +", "Coaches Ilimitados", "Personalización de Marca", "Analíticas Avanzadas"], popular: true },
            { name: "GYM", price: 89990 * 0.8, members: 300, features: ["Todo en Studio +", "API de Integración", "Soporte Prioritario", "Onboarding Personalizado"] }
        ]
    };
    
    const currentPlans = isYearly ? plans.yearly : plans.monthly;

    const testimonials = [
        {
            quote: "Fit Planner revolucionó cómo programo mis clases. Mis alumnas aman tener sus secuencias en la app y la retención ha subido un 40%. Dejé de ser una administradora para volver a ser una maestra.",
            name: "Sofía V.",
            role: "Fundadora de 'Estudio Alma Pilates'",
            avatar: "/testimonial-sofia-v.png",
            hint: "woman pilates instructor"
        },
        {
            quote: "Pasé de un Excel caótico a una plataforma que grita profesionalismo. Mis clientes se sienten como atletas de élite y mi negocio ha crecido un 60% en 6 meses. Es la mejor inversión que he hecho.",
            name: "Matías R.",
            role: "Entrenador Personal",
            avatar: "/testimonial-matias-r.png",
            hint: "man personal trainer"
        },
        {
            quote: "Competir con Smart Fit es imposible en precio, pero con Fit Planner les ganamos en experiencia. Nuestros miembros se quedan porque ven resultados y se sienten cuidados. La IA es un cambio de juego.",
            name: "Carolina L.",
            role: "Gerente de 'Fuerza Austral Gym'",
            avatar: "/testimonial-carolina-l.png",
            hint: "woman gym manager"
        }
    ];

    return (
        <div className="bg-[#0a0a0a] text-white font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
           
            <HeroV2 />

            <div id="problem">
              <Section className="py-16 md:py-24 bg-[#0a0a0a]">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="text-left">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                ¿Tu centro <span className="text-gray-500">gestiona</span> o <span className="text-emerald-400">transforma</span>?
                            </h2>
                            <p className="text-lg text-gray-400 mb-8">
                                Las herramientas genéricas te mantienen atrapado en la administración. Para crecer, necesitas un sistema que potencie la experiencia del cliente y te diferencie de la competencia.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-emerald-400 mt-1 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-lg">Reduce el abandono</h3>
                                        <p className="text-gray-400">Combate la monotonía con rutinas que evolucionan, manteniendo a tus miembros enganchados y viendo resultados.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-emerald-400 mt-1 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-lg">Eleva tu servicio</h3>
                                        <p className="text-gray-400">Entrega una experiencia digital premium que justifica tus precios y construye una marca sólida y profesional.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <ImageComparisonSlider 
                                before="/chaos-manual-management.png"
                                after="/fit-planner-dashboard.png"
                                beforeHint="messy paperwork spreadsheet"
                                afterHint="clean dashboard interface"
                            />
                        </div>
                    </div>
                  </div>
                </Section>
            </div>
            
            <Section id="solution" className="bg-[#111827] py-16 md:py-24">
                <div className="container mx-auto">
                    <SectionTitle>Un ecosistema. Tres roles. Perfecta sincronía.</SectionTitle>
                    <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                        <div className="order-2 lg:order-1">
                            <div className="flex items-start gap-4 mb-4">
                               <ActiveIcon className="w-10 h-10 text-emerald-400 mt-1 shrink-0"/>
                               <div>
                                    <h3 className="text-2xl font-bold mb-2 transition-opacity duration-300 animate-fade-in">{solutionContent[activeSolution].title}</h3>
                                    <p className="text-gray-300 transition-opacity duration-300 animate-fade-in">{solutionContent[activeSolution].text}</p>
                               </div>
                            </div>
                        </div>
                        <div className="relative order-1 lg:order-2 flex items-center justify-center">
                            <Image 
                                src="/feedback-cycle-diagram.png"
                                alt="Ecosistema Fit Planner conectando admin, coach y atleta"
                                width={800} height={533}
                                className="rounded-lg shadow-2xl w-full"
                                data-ai-hint="fitness ecosystem diagram"
                            />
                             {/* Hotspots */}
                            <button 
                                onClick={() => setActiveSolution('admin')}
                                className="absolute w-10 h-10 rounded-full bg-emerald-400/50 flex items-center justify-center backdrop-blur-sm"
                                style={{ top: '65%', left: '46%' }}
                            >
                                <div className={cn("w-4 h-4 rounded-full bg-emerald-400", activeSolution === 'admin' ? "animate-ping" : "")}></div>
                            </button>
                            <button 
                                onClick={() => setActiveSolution('coach')}
                                className="absolute w-10 h-10 rounded-full bg-emerald-400/50 flex items-center justify-center backdrop-blur-sm"
                                style={{ top: '42%', left: '15%' }}
                            >
                                 <div className={cn("w-4 h-4 rounded-full bg-emerald-400", activeSolution === 'coach' ? "animate-ping" : "")}></div>
                            </button>
                            <button 
                                onClick={() => setActiveSolution('athlete')}
                                className="absolute w-10 h-10 rounded-full bg-emerald-400/50 flex items-center justify-center backdrop-blur-sm"
                                style={{ top: '48%', left: '80%' }}
                            >
                                 <div className={cn("w-4 h-4 rounded-full bg-emerald-400", activeSolution === 'athlete' ? "animate-ping" : "")}></div>
                            </button>
                        </div>
                    </div>
                </div>
            </Section>
            
            <div id="wow-factor" className="w-full">
                <AIPoweredGeneratorSection />
            </div>

            <section id="testimonials" className="bg-[#111827] py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-5xl">
                    <SectionTitle>Líderes del Fitness en Chile ya están transformando su negocio.</SectionTitle>
                    <Carousel 
                        opts={{ loop: true, align: "start" }} 
                        plugins={[plugin.current]}
                        onMouseEnter={plugin.current.stop}
                        onMouseLeave={plugin.current.reset}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {testimonials.map((testimonial, index) => (
                                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                                    <div className="p-1 h-full">
                                        <Card className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col h-full">
                                            <CardContent className="p-0 flex flex-col flex-grow">
                                                <p className="italic text-gray-300 mb-6 flex-grow">"{testimonial.quote}"</p>
                                                <div className="flex items-center gap-4 mt-auto">
                                                    <Avatar className="w-12 h-12 border-2 border-emerald-400">
                                                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.hint} />
                                                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-white">{testimonial.name}</p>
                                                        <p className="text-sm text-emerald-400">{testimonial.role}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
                    </Carousel>
                </div>
            </section>
            
            <Section id="pricing" className="bg-[#0a0a0a] py-16 md:py-24">
                <div className="container mx-auto">
                    <SectionTitle>Planes diseñados para tu crecimiento</SectionTitle>
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={cn(isYearly ? 'text-gray-400' : 'text-white font-bold')}>Mensual</span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                        <span className={cn(isYearly ? 'text-white font-bold' : 'text-gray-400')}>Anual</span>
                        <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">AHORRA 20%</span>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                        {currentPlans.map((plan) => (
                            <div key={plan.name} className={cn("bg-[#111827] rounded-2xl p-8 border transition-all transform hover:scale-105", plan.popular ? "border-emerald-400 border-2 scale-105 relative hover:border-emerald-300" : "border-gray-700 hover:border-gray-500")}>
                                 {plan.popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-emerald-400 text-black font-bold text-sm px-4 py-1 rounded-full uppercase tracking-wider">Más Popular</div>}
                                <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                                <p className="text-center text-gray-400 mb-6">Hasta {plan.members} miembros</p>
                                <p className="text-center text-5xl font-black mb-1">${Math.round(plan.price).toLocaleString('es-CL')}<span className="text-lg font-bold text-gray-400">/mes</span></p>
                                <p className="text-center text-gray-500 mb-8 text-sm">{isYearly ? "Facturado anualmente" : "Cancela en cualquier momento"}</p>
                                <Button size="lg" className={cn("w-full text-lg", plan.popular ? "bg-emerald-400 text-black hover:bg-emerald-500" : "bg-gray-700 text-white hover:bg-gray-600")}>Empezar con {plan.name}</Button>
                                <ul className="mt-8 space-y-4">
                                    {plan.features.map(feat => (
                                        <li key={feat} className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-emerald-400 shrink-0"/>
                                            <span className="text-gray-300">{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                     <div className="text-center mt-12 border-t border-gray-800 pt-8 max-w-3xl mx-auto">
                        <h3 className="text-2xl font-bold">¿Necesitas más?</h3>
                        <p className="text-gray-400 my-4">Para operaciones con más de 300 miembros, requerimientos especiales o integraciones a medida, tenemos un plan Enterprise. Contáctanos para una solución personalizada.</p>
                        <Button variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm">Contactar a Ventas <ArrowRight className="w-4 h-4 ml-2"/></Button>
                    </div>
                </div>
            </Section>

            {/* --- FAQ SECTION --- */}
            <Section id="faq" className="bg-[#111827] py-16 md:py-24">
                <div className="container mx-auto">
                    <SectionTitle>Preguntas que quizás te estás haciendo...</SectionTitle>
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqItems.map((item, index) => (
                            <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                                <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center p-6 text-left font-bold text-lg">
                                    <span>{item.q}</span>
                                    <ChevronDown className={cn("w-6 h-6 transition-transform", faqOpen === index && "rotate-180")} />
                                </button>
                                <div
                                    className={cn(
                                        "grid transition-all duration-300 ease-in-out",
                                        faqOpen === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    )}
                                >
                                    <div className="overflow-hidden">
                                         <div className="px-6 pb-6 text-gray-300">
                                            <p>{item.a}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>
            
            {/* --- FINAL CTA --- */}
            <Section id="final-cta" className="text-center py-16 md:py-24">
                <div className="container mx-auto">
                     <h2 className="text-3xl md:text-5xl font-bold mb-4">Es hora de construir un negocio de fitness <span className="text-emerald-400">a prueba de abandonos.</span></h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">Únete a la nueva generación de líderes del fitness en Chile. Empieza tu transformación hoy.</p>
                    <Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-xl py-8 px-10 transform hover:scale-105 transition-transform" asChild>
                        <Link href="/signup">
                         Comenzar mi Prueba Gratuita de 14 Días
                        </Link>
                    </Button>
                    <p className="text-gray-500 mt-4 text-sm">Sin compromisos. Sin tarjeta de crédito. Solo resultados.</p>
                </div>
            </Section>
            
            {/* --- FOOTER --- */}
            <footer className="bg-[#0a0a0a] border-t border-gray-800 py-12">
                <div className="container mx-auto px-4 text-center text-gray-500">
                    <h3 className="text-2xl font-bold mb-4 text-white">Fit Planner</h3>
                     <div className="flex justify-center gap-6 mb-8">
                        <Link href="#" className="text-gray-400 hover:text-white">LinkedIn</Link>
                        <Link href="#" className="text-gray-400 hover:text-white">Instagram</Link>
                    </div>
                    <div className="flex justify-center gap-4 text-sm">
                        <Link href="#" className="hover:text-white">Términos de Servicio</Link>
                        <span>|</span>
                        <Link href="#" className="hover:text-white">Política de Privacidad</Link>
                         <span>|</span>
                        <Link href="mailto:hola@fitnessplanner.cl" className="hover:text-white">hola@fitnessplanner.cl</Link>
                    </div>
                    <p className="mt-8 text-sm">&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
