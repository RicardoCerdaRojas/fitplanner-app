

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
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import GuestHomepage from '@/components/guest-homepage';


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
                    <DialogTitle>Fit Planner Demo Video</DialogTitle>
                    <DialogDescription>A short video showcasing the main features of the Fit Planner application.</DialogDescription>
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
                        
                        <Button className="bg-white text-black hover:bg-gray-200 font-semibold" asChild><Link href="/create-gym">Start Trial</Link></Button>
                    </div>
                </div>
            </header>

            <div className="relative z-10 flex flex-col items-center text-center container mx-auto pt-20 md:pt-0">
                 <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-emerald-400 mb-2">
                      Fit Planner
                    </h2>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight mb-6">
                        <span className="animate-stagger-in block" style={{"--stagger-delay": "0.4s"} as React.CSSProperties}>Stop managing absences.</span>
                        <span className="animate-stagger-in block bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text" style={{"--stagger-delay": "0.6s"} as React.CSSProperties}>
                            Start building loyalty.
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-300 mb-8">
                        The intelligent platform that fights the main cause of churn: monotony. Reduce member churn with routines that evolve.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-lg py-7 px-8 transform hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20" asChild>
                            <Link href="/create-gym">
                                Start 14-Day Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                        <Button onClick={() => setShowDemoModal(true)} size="lg" variant="outline" className="text-white bg-white/5 border-white/20 hover:bg-white/10 text-lg py-7 px-8 backdrop-blur-sm transition-all">
                            Watch a Demo <ArrowRight className="w-5 h-5 ml-2" />
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
                alt="The chaos of manual management"
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
                    alt="The order and clarity of Fit Planner"
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
            title: "Upper Body Routine",
            exercises: [
                { name: "Bench Press", sets: 4, reps: 8, weight: "75kg" },
                { name: "Pull-ups", sets: 4, reps: 10, weight: "BW" },
                { name: "Barbell Rows", sets: 3, reps: 12, weight: "60kg" },
            ],
        },
        lower: {
            title: "Lower Body Routine",
            exercises: [
                { name: "Squats", sets: 5, reps: 5, weight: "100kg" },
                { name: "Romanian Deadlifts", sets: 3, reps: 10, weight: "80kg" },
                { name: "Leg Press", sets: 4, reps: 15, weight: "120kg" },
            ],
        },
        cardio: {
            title: "Explosive Cardio",
            exercises: [
                { name: "Burpees", sets: 5, duration: "45s", rest: "15s" },
                { name: "Treadmill Sprints", sets: 8, duration: "30s", rest: "30s" },
                { name: "Box Jumps", sets: 4, reps: 12, weight: "24in" },
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
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Monotony is the Enemy</h2>
                        <p className="text-xl text-emerald-400 font-semibold mb-6">Generate personalized routines in seconds.</p>
                        <p className="text-gray-300">
                            Our AI fights the main cause of churn. Save your coaches hours of work and deliver endless variety to your members, keeping motivation at an all-time high.
                        </p>
                    </div>
                    
                    <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
                        {/* Left Panel: Controls */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
                                <h3 className="font-bold text-lg mb-4">Choose a Goal</h3>
                                <div className="space-y-3">
                                    <Button 
                                        onClick={() => handleSelectRoutine('upper')} 
                                        variant={activeRoutine === 'upper' ? 'default' : 'secondary'}
                                        className={cn("w-full justify-start text-base py-6", activeRoutine === 'upper' ? "bg-emerald-500 hover:bg-emerald-600" : "")}
                                    >
                                        <Dumbbell className="mr-3" /> Upper Body
                                    </Button>
                                    <Button 
                                        onClick={() => handleSelectRoutine('lower')} 
                                        variant={activeRoutine === 'lower' ? 'default' : 'secondary'}
                                        className={cn("w-full justify-start text-base py-6", activeRoutine === 'lower' ? "bg-emerald-500 hover:bg-emerald-600" : "")}
                                    >
                                        <Dumbbell className="mr-3" /> Lower Body
                                    </Button>
                                    <Button 
                                        onClick={() => handleSelectRoutine('cardio')} 
                                        variant={activeRoutine === 'cardio' ? 'default' : 'secondary'}
                                        className={cn("w-full justify-start text-base py-6", activeRoutine === 'cardio' ? "bg-emerald-500 hover:bg-emerald-600" : "")}
                                    >
                                        <Flame className="mr-3" /> Explosive Cardio
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-400 mt-4 text-center">...or describe any custom goal.</p>
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
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (user) {
            router.replace('/home');
        }
    }, [user, loading, router]);


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
            title: "360° Vision for the Administrator",
            text: "Take full control of your business. From a single dashboard, monitor real-time activity, manage memberships, and analyze key data to make strategic decisions that drive your growth. Less administration, more strategy.",
        },
        coach: {
            icon: ClipboardList,
            title: "Precision Tools for the Coach",
            text: "Dedicate your time to what you love: training. Create and assign personalized routines in minutes, use our AI to generate varied workouts, and track your athletes' progress with unprecedented detail. Elevate your coaching to the next level.",
        },
        athlete: {
            icon: Target,
            title: "An Immersive Experience for the Athlete",
            text: "Transform every workout into a victory. With an intuitive app, your members can follow their routines, track their progress with an integrated timer, and receive constant feedback. It's the motivation they need to come back for more.",
        },
    };

    const ActiveIcon = solutionContent[activeSolution].icon;
    
    const faqItems = [
        {
            q: "Do you offer a free trial?",
            a: "Yes! We offer a 14-day free trial on any of our plans, with no credit card required. We want you to experience the power of Fit Planner for yourself."
        },
        {
            q: "What happens if I exceed my plan's limit?",
            a: "Don't worry, your operation won't stop. We'll notify you so you can easily upgrade your plan from your admin dashboard. The change is instant."
        },
        {
            q: "Do I need to install any hardware or turnstiles?",
            a: "No. Fit Planner is 100% software. We focus on what happens inside your gym, not at the door. It works on any device with internet: computers, tablets, and mobile phones."
        },
        {
            q: "Do you integrate with local tax authorities for electronic invoicing?",
            a: "Currently, we integrate with Stripe, the world's leading payment gateway, for simple and secure payment management. Our focus is on training tools, not complex accounting."
        },
        {
            q: "Do you help me migrate my data from another system?",
            a: "Of course! Our support team will assist you during the onboarding process to import your existing members and routines, ensuring a smooth transition."
        }
    ];

    const testimonials = [
        {
            quote: "Fit Planner revolutionized how I schedule my classes. My students love having their sequences in the app, and retention has increased by 40%. I stopped being an administrator to become a teacher again.",
            name: "Sofia V.",
            role: "Founder of 'Alma Pilates Studio'",
            avatar: "/testimonial-sofia-v.png",
            hint: "woman pilates instructor"
        },
        {
            quote: "I went from a chaotic Excel sheet to a platform that screams professionalism. My clients feel like elite athletes, and my business has grown 60% in 6 months. It's the best investment I've ever made.",
            name: "Matias R.",
            role: "Personal Trainer",
            avatar: "/testimonial-matias-r.png",
            hint: "man personal trainer"
        },
        {
            quote: "Competing with big box gyms on price is impossible, but with Fit Planner, we win on experience. Our members stay because they see results and feel cared for. The AI is a game-changer.",
            name: "Carolina L.",
            role: "Manager of 'Fuerza Austral Gym'",
            avatar: "/testimonial-carolina-l.png",
            hint: "woman gym manager"
        }
    ];

    if (loading) {
        return <GuestHomepage />; // The loading screen is now handled inside GuestHomepage
    }

    // If user is logged in, GuestHomepage will handle redirection. If not, it will be null.
    // So we only render the landing page if there's no user.
    if (user) {
        return <GuestHomepage />;
    }

    return (
        <div className="bg-[#0a0a0a] text-white font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
           
            <HeroV2 />

            <div id="problem">
              <Section className="py-16 md:py-24 bg-[#0a0a0a]">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="text-left">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                Does your gym <span className="text-gray-500">manage</span> or <span className="text-emerald-400">transform</span>?
                            </h2>
                            <p className="text-lg text-gray-400 mb-8">
                                Generic tools keep you stuck in administration. To grow, you need a system that enhances the customer experience and differentiates you from the competition.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-emerald-400 mt-1 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-lg">Reduce Churn</h3>
                                        <p className="text-gray-400">Fight monotony with evolving routines that keep your members engaged and seeing results.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-emerald-400 mt-1 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-lg">Elevate Your Service</h3>
                                        <p className="text-gray-400">Deliver a premium digital experience that justifies your prices and builds a strong, professional brand.</p>
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
                    <SectionTitle>One ecosystem. Three roles. Perfect sync.</SectionTitle>
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
                                alt="Fit Planner ecosystem connecting admin, coach, and athlete"
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
                    <SectionTitle>Fitness leaders are already transforming their business.</SectionTitle>
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
                    <SectionTitle>Plans designed for your growth</SectionTitle>
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={cn(isYearly ? 'text-gray-400' : 'text-white font-bold')}>Monthly</span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                        <span className={cn(isYearly ? 'text-white font-bold' : 'text-gray-400')}>Yearly</span>
                        <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">SAVE 20%</span>
                    </div>

                    <div className="text-center mt-12 border-t border-gray-800 pt-8 max-w-3xl mx-auto">
                        <h3 className="text-2xl font-bold">Need more?</h3>
                        <p className="text-gray-400 my-4">For operations with more than 300 members, special requirements, or custom integrations, we have an Enterprise plan. Contact us for a personalized solution.</p>
                        <Button variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm">Contact Sales <ArrowRight className="w-4 h-4 ml-2"/></Button>
                    </div>
                </div>
            </Section>

            {/* --- FAQ SECTION --- */}
            <Section id="faq" className="bg-[#111827] py-16 md:py-24">
                <div className="container mx-auto">
                    <SectionTitle>Questions you might be asking...</SectionTitle>
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
                     <h2 className="text-3xl md:text-5xl font-bold mb-4">It's time to build a <span className="text-emerald-400">churn-proof</span> fitness business.</h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">Join the new generation of fitness leaders. Start your transformation today.</p>
                    <Button size="lg" className="bg-emerald-400 text-black font-bold hover:bg-emerald-500 text-xl py-8 px-10 transform hover:scale-105 transition-transform" asChild>
                        <Link href="/create-gym">
                         Start My 14-Day Free Trial
                        </Link>
                    </Button>
                    <p className="text-gray-500 mt-4 text-sm">No commitment. No credit card. Just results.</p>
                </div>
            </Section>
            
            {/* --- FOOTER --- */}
            <footer className="bg-[#0a0a0a] border-t border-gray-800 py-12">
                <div className="container mx-auto px-4 text-center text-gray-500">
                    <h3 className="text-2xl font-bold mb-4 text-white">Fit Planner</h3>
                     <div className="flex justify-center gap-6 mb-8 text-sm">
                        <Link href="/login" className="text-gray-400 hover:text-white">Already have an account? Log in</Link>
                        <span>|</span>
                        <Link href="/join" className="text-gray-400 hover:text-white">Invited to a gym? Join here</Link>
                    </div>
                    <div className="flex justify-center gap-4 text-sm">
                        <Link href="#" className="hover:text-white">Terms of Service</Link>
                        <span>|</span>
                        <Link href="#" className="hover:text-white">Privacy Policy</Link>
                         <span>|</span>
                        <Link href="mailto:hello@fitnessplanner.app" className="hover:text-white">hello@fitnessplanner.app</Link>
                    </div>
                    <p className="mt-8 text-sm">&copy; {new Date().getFullYear()} Fit Planner. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
