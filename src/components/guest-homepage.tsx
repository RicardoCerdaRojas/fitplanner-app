import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from './app-header';

export function GuestHomepage() {
    return (
        <div className="relative min-h-screen w-full bg-[#0B0C10] text-white overflow-hidden">
            {/* Background Image Container */}
            <div className="absolute top-0 right-0 h-full w-full md:w-3/5 lg:w-1/2 z-0">
                <Image
                    src="https://placehold.co/800x1200.png"
                    alt="Fitness model"
                    data-ai-hint="fitness model"
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center top"
                    className="opacity-20 md:opacity-100"
                    priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10] to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                    <AppHeader />
                    <div className="flex-grow flex items-center w-full max-w-7xl mx-auto px-4">
                        <div className="w-full md:w-1/2 text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tighter">
                                Build Perfect Body With Clean Mind
                            </h1>
                            <p className="mt-6 text-base md:text-lg text-gray-300 max-w-xl mx-auto md:mx-0">
                                Unleash your potential with AI-powered workout plans, expert coaching
                                tools, and seamless progress tracking. Join the community dedicated to
                                achieving peak fitness.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Button asChild size="lg" className="bg-[#3A7CFD] hover:bg-[#3a7cfd]/90 text-white text-lg py-7 px-8 rounded-lg">
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}