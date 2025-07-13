
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from './app-header';
import { Dumbbell, Users, BarChart2, Heart, BrainCircuit, Waves, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import Autoplay from "embla-carousel-autoplay";
import * as React from 'react';


const features = [
    {
        icon: <Dumbbell className="w-12 h-12 text-blue-400" />,
        title: "Gimnasios Fitness",
        description: "Gestiona cientos de miembros, múltiples coaches y rutinas de fuerza complejas con nuestras herramientas especializadas.",
    },
    {
        icon: <Waves className="w-12 h-12 text-blue-400" />,
        title: "Centros de Pilates y Yoga",
        description: "Crea y asigna secuencias y clases con facilidad. Nuestra plataforma se adapta a la fluidez y enfoque de tus disciplinas.",
    },
    {
        icon: <GitBranch className="w-12 h-12 text-blue-400" />,
        title: "Coaches Independientes",
        description: "Ofrece un servicio premium a tus clientes con seguimiento personalizado y una app de primer nivel que lleva tu marca.",
    },
];

const testimonials = [
    {
        quote: "Fit Planner revolucionó la forma en que gestiono mi centro de Pilates. Mis clientas aman la app y yo puedo seguir su progreso en tiempo real. ¡Es un antes y un después!",
        avatar: "https://placehold.co/100x100.png",
        name: "Valentina Rojas",
        role: "Dueña de 'Pilates Studio Chile'",
        aiHint: "woman pilates instructor",
    },
    {
        quote: "Como coach, esta herramienta me permite entregar un servicio de elite. La biblioteca de rutinas y el dashboard de estadísticas son mis funciones favoritas. Mis clientes están más motivados que nunca.",
        avatar: "https://placehold.co/100x100.png",
        name: "Matías Soto",
        role: "Coach de Fitness",
        aiHint: "man personal trainer",
    },
    {
        quote: "¡Mi gimnasio ahora se siente del futuro! La app es increíblemente fácil de usar, el temporizador integrado es genial y me encanta poder generar rutinas con IA cuando quiero un desafío extra.",
        avatar: "https://placehold.co/100x100.png",
        name: "Javiera Diaz",
        role: "Miembro de 'Power Gym'",
        aiHint: "woman portrait gym",
    },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-4xl font-bold text-center mb-12 relative">
        {children}
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-blue-400"></span>
    </h2>
);

export function GuestHomepage() {
    const plugin = React.useRef(
      Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    return (
        <div className="w-full bg-[#0B0C10] text-white overflow-hidden">
            {/* Hero Section */}
            <div className="relative min-h-screen w-full">
                <Image
                    src="/hero-background.jpg"
                    alt="Persona entrenando con determinación"
                    layout="fill"
                    objectFit="cover"
                    objectPosition="top"
                    className="opacity-40"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/90 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col min-h-screen">
                    <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                        <AppHeader />
                        <div className="flex-grow flex items-center w-full max-w-7xl mx-auto px-4">
                            <div className="w-full md:w-2/3 text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tighter animate-fade-in-up">
                                    La plataforma definitiva para Coaches y Centros Fitness
                                </h1>
                                <p className="mt-6 text-base md:text-lg text-gray-300 max-w-2xl mx-auto md:mx-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                    Eleva la experiencia de tus miembros. Digitaliza, gestiona y expande tu negocio con la herramienta que une tecnología y entrenamiento.
                                </p>
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                    <Button asChild size="lg" className="bg-[#3A7CFD] hover:bg-[#3a7cfd]/90 text-white text-lg py-7 px-8 rounded-lg">
                                        <Link href="/signup">Comienza Ahora</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            
            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle>Diseñado para todo tipo de Profesionales</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="bg-[#1C2129] border border-gray-700 p-8 text-center hover:border-blue-400 hover:-translate-y-2 transition-transform duration-300">
                                <CardContent className="flex flex-col items-center gap-4">
                                    {feature.icon}
                                    <h3 className="text-2xl font-bold text-blue-400">{feature.title}</h3>
                                    <p className="text-gray-400">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1C2129]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="rounded-lg overflow-hidden">
                        <Image src="https://placehold.co/600x700.png" data-ai-hint="gym teamwork" alt="Equipo de coaches colaborando" width={600} height={700} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold mb-4">Potencia tu Negocio</h2>
                        <h3 className="text-3xl font-semibold text-blue-400 mb-6">Todas las herramientas que necesitas para crecer</h3>
                        <ul className="text-gray-300 mb-6 space-y-4">
                           <li className="flex items-start gap-3"><Users className="w-6 h-6 text-blue-400 mt-1 shrink-0" /><span>Crea planes, gestiona miembros y construye tu propia biblioteca de rutinas para vender y compartir.</span></li>
                           <li className="flex items-start gap-3"><BarChart2 className="w-6 h-6 text-blue-400 mt-1 shrink-0" /><span>Visualiza el progreso de tus miembros con un dashboard de actividad en tiempo real y estadísticas detalladas.</span></li>
                           <li className="flex items-start gap-3"><Dumbbell className="w-6 h-6 text-blue-400 mt-1 shrink-0" /><span>Asigna sesiones de entrenamiento personalizadas y escala tu servicio sin perder calidad.</span></li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                     <div>
                        <h2 className="text-4xl font-bold mb-4">Una Experiencia Insuperable</h2>
                        <h3 className="text-3xl font-semibold text-blue-400 mb-6">La app que tus miembros amarán usar</h3>
                        <ul className="text-gray-300 mb-6 space-y-4">
                           <li className="flex items-start gap-3"><Heart className="w-6 h-6 text-blue-400 mt-1 shrink-0" /><span>Modo Workout inmersivo: temporizador, repeticiones, peso y calificación de dificultad, todo integrado en una interfaz mobile-first.</span></li>
                           <li className="flex items-start gap-3"><BrainCircuit className="w-6 h-6 text-blue-400 mt-1 shrink-0" /><span>Generador de rutinas con IA para que tus miembros exploren nuevos entrenamientos y se mantengan siempre motivados.</span></li>
                        </ul>
                    </div>
                    <div className="rounded-lg overflow-hidden">
                         <Carousel 
                            opts={{ loop: true }} 
                            plugins={[plugin.current]}
                            onMouseEnter={plugin.current.stop}
                            onMouseLeave={plugin.current.reset}
                            className="w-full max-w-xs mx-auto"
                         >
                            <CarouselContent>
                                <CarouselItem>
                                    <Image src="/member-001.png" data-ai-hint="mobile app workout" alt="App mostrando lista de ejercicios" width={400} height={800} className="w-full h-full object-contain" />
                                </CarouselItem>
                                <CarouselItem>
                                    <Image src="/member-002.png" data-ai-hint="mobile app timer" alt="App en modo workout con temporizador" width={400} height={800} className="w-full h-full object-contain" />
                                </CarouselItem>
                            </CarouselContent>
                            <CarouselPrevious className="left-2 text-white bg-transparent border-white/50 hover:bg-white/10 hover:text-white" />
                            <CarouselNext className="right-2 text-white bg-transparent border-white/50 hover:bg-white/10 hover:text-white" />
                        </Carousel>
                    </div>
                </div>
            </section>
            
            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1C2129]">
                <div className="max-w-5xl mx-auto">
                    <SectionTitle>Lo que dicen nuestros clientes</SectionTitle>
                     <Carousel opts={{ loop: true }} className="w-full">
                        <CarouselContent>
                            {testimonials.map((testimonial, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-2">
                                        <Card className="bg-[#0B0C10] border-gray-700 p-8 text-center">
                                            <CardContent className="flex flex-col items-center gap-6">
                                                <p className="text-lg italic text-gray-300">"{testimonial.quote}"</p>
                                                <div className="flex flex-col items-center">
                                                    <Avatar className="w-20 h-20 mb-4">
                                                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.aiHint} />
                                                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <h4 className="text-xl font-bold text-white">{testimonial.name}</h4>
                                                    <p className="text-blue-400">{testimonial.role}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="text-white bg-transparent border-white/50 hover:bg-white/10 hover:text-white" />
                        <CarouselNext className="text-white bg-transparent border-white/50 hover:bg-white/10 hover:text-white" />
                    </Carousel>
                </div>
            </section>

             {/* Contact Section */}
            <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <SectionTitle>Contáctanos</SectionTitle>
                    <p className="mb-8 text-gray-300">¿Tienes preguntas o quieres agendar una demostración? Escríbenos y te responderemos a la brevedad.</p>
                    <form className="space-y-6">
                         <Input type="text" placeholder="Nombre Completo" className="bg-[#2a313c] border-gray-600 h-12 text-white placeholder:text-gray-400" />
                         <Input type="email" placeholder="Correo Electrónico" className="bg-[#2a313c] border-gray-600 h-12 text-white placeholder:text-gray-400" />
                         <Textarea placeholder="Tu Mensaje" className="bg-[#2a313c] border-gray-600 min-h-[150px] text-white placeholder:text-gray-400" />
                         <Button type="submit" size="lg" className="w-full bg-blue-500 hover:bg-blue-600 h-12">Enviar Mensaje</Button>
                    </form>
                </div>
            </section>

             {/* Footer */}
            <footer className="bg-[#0B0C10] border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center text-gray-500">
                    <h3 className="text-2xl font-bold mb-4 text-white">Fit Planner</h3>
                    <p className="max-w-md mx-auto mb-6">Donde la tecnología y el trabajo duro se unen por tu bienestar.</p>
                     <div className="text-center text-gray-500 mt-12 border-t border-gray-800 pt-8">
                        &copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
