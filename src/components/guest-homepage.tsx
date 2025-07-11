
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from './app-header';
import { Dumbbell, Heart, User, Instagram, Facebook, Twitter } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

const features = [
    {
        icon: <Dumbbell className="w-12 h-12 text-blue-400" />,
        title: "Strength Training",
        description: "In-depth training for professionals who want to push their limits and get the best results.",
    },
    {
        icon: <Heart className="w-12 h-12 text-blue-400" />,
        title: "Basic Gym",
        description: "The best for beginners, with a focus on learning correct technique and building a solid foundation.",
    },
    {
        icon: <User className="w-12 h-12 text-blue-400" />,
        title: "Body Building",
        description: "Specialized bodybuilding programs to sculpt your body and achieve your aesthetic goals.",
    },
];

const testimonials = [
    {
        quote: "The personalized AI routines are a game-changer. I've seen more progress in 3 months than I did in the last year. The platform is intuitive and keeps me motivated.",
        avatar: "https://placehold.co/100x100.png",
        name: "Jessica Miller",
        role: "Fitness Enthusiast",
        aiHint: "woman smiling",
    },
    {
        quote: "As a coach, Fitness Flow has streamlined how I manage my clients. Assigning routines and tracking progress has never been easier. My clients love the live feedback.",
        avatar: "https://placehold.co/100x100.png",
        name: "David Chen",
        role: "Personal Trainer",
        aiHint: "man personal trainer",
    },
    {
        quote: "I was new to the gym and completely lost. The AI generator gave me a plan I could actually follow, and the video examples were super helpful. Highly recommend!",
        avatar: "https://placehold.co/100x100.png",
        name: "Sarah Johnson",
        role: "New Member",
        aiHint: "woman portrait",
    },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-4xl font-bold text-center mb-12 relative">
        {children}
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-blue-400"></span>
    </h2>
);

export function GuestHomepage() {
    return (
        <div className="w-full bg-[#0B0C10] text-white overflow-hidden">
            {/* Hero Section */}
            <div className="relative min-h-screen w-full">
                <Image
                    src="/hero-background.jpg"
                    alt="Fitness model"
                    data-ai-hint="fitness workout"
                    layout="fill"
                    objectFit="cover"
                    objectPosition="top right"
                    className="opacity-50"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/90 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col min-h-screen">
                    <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                        <AppHeader />
                        <div className="flex-grow flex items-center w-full max-w-7xl mx-auto px-4">
                            <div className="w-full md:w-1/2 text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tighter animate-fade-in-up">
                                    Build Perfect Body With Clean Mind
                                </h1>
                                <p className="mt-6 text-base md:text-lg text-gray-300 max-w-xl mx-auto md:mx-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                    Unleash your potential with AI-powered workout plans, expert coaching
                                    tools, and seamless progress tracking. Join the community dedicated to
                                    achieving peak fitness.
                                </p>
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                    <Button asChild size="lg" className="bg-[#3A7CFD] hover:bg-[#3a7cfd]/90 text-white text-lg py-7 px-8 rounded-lg">
                                        <Link href="/signup">Get Started</Link>
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
                    <SectionTitle>The Best Programs We Offer For You</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="bg-[#1C2129] border border-gray-700 p-8 text-center hover:border-blue-400 hover:-translate-y-2 transition-transform duration-300">
                                <CardContent className="flex flex-col items-center gap-4">
                                    {feature.icon}
                                    <h3 className="text-2xl font-bold">{feature.title}</h3>
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
                        <Image src="https://placehold.co/600x700.png" data-ai-hint="gym interior" alt="About us" width={600} height={700} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold mb-4">About Us</h2>
                        <h3 className="text-3xl font-semibold text-blue-400 mb-6">We Are Always Providing Best Fitness Service For You</h3>
                        <p className="text-gray-300 mb-6">
                            Fitness Flow was born from a passion for health and a belief in the power of technology to transform lives. We provide a seamless, integrated platform for gym owners, coaches, and members to connect, train, and achieve their goals together.
                        </p>
                        <Button size="lg" className="bg-blue-500 hover:bg-blue-600">Read More</Button>
                    </div>
                </div>
            </section>
            
            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <SectionTitle>What Our Happy Clients Say</SectionTitle>
                     <Carousel opts={{ loop: true }} className="w-full">
                        <CarouselContent>
                            {testimonials.map((testimonial, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-2">
                                        <Card className="bg-[#1C2129] border-gray-700 p-8 text-center">
                                            <CardContent className="flex flex-col items-center gap-6">
                                                <p className="text-lg italic text-gray-300">"{testimonial.quote}"</p>
                                                <div className="flex flex-col items-center">
                                                    <Avatar className="w-20 h-20 mb-4">
                                                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.aiHint} />
                                                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <h4 className="text-xl font-bold">{testimonial.name}</h4>
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
            <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1C2129]">
                <div className="max-w-3xl mx-auto text-center">
                    <SectionTitle>Contact Us</SectionTitle>
                    <p className="mb-8 text-gray-300">Have questions or want to partner with us? Drop us a line and we'll get back to you as soon as possible.</p>
                    <form className="space-y-6">
                         <Input type="text" placeholder="Full Name" className="bg-[#2a313c] border-gray-600 h-12 text-white placeholder:text-gray-400" />
                         <Input type="email" placeholder="Email Address" className="bg-[#2a313c] border-gray-600 h-12 text-white placeholder:text-gray-400" />
                         <Textarea placeholder="Your Message" className="bg-[#2a313c] border-gray-600 min-h-[150px] text-white placeholder:text-gray-400" />
                         <Button type="submit" size="lg" className="w-full bg-blue-500 hover:bg-blue-600 h-12">Submit</Button>
                    </form>
                </div>
            </section>

             {/* Footer */}
            <footer className="bg-[#0B0C10] border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <h3 className="text-2xl font-bold mb-4">FITNESS FLOW</h3>
                        <p className="text-gray-400 max-w-md">Your ultimate partner in fitness. We combine technology with expert knowledge to help you achieve your goals.</p>
                        <div className="flex gap-4 mt-6">
                            <Link href="#" className="text-gray-400 hover:text-white"><Instagram/></Link>
                            <Link href="#" className="text-gray-400 hover:text-white"><Facebook/></Link>
                            <Link href="#" className="text-gray-400 hover:text-white"><Twitter/></Link>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold mb-4">Services</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 hover:text-white">AI Routines</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white">Coach Tools</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white">Gym Management</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 hover:text-white">Contact Us</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white">Support</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white">Partnerships</Link></li>
                        </ul>
                    </div>
                </div>
                 <div className="text-center text-gray-500 mt-12 border-t border-gray-800 pt-8">
                    &copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
}
