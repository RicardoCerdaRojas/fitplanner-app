
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppDashboardIllustration } from '@/components/ui/app-dashboard-illustration';
import { AppHeader } from './app-header';

export function GuestHomepage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                <div className="flex flex-col items-center text-center mt-10 max-w-3xl">
                    <h1 className="text-5xl md:text-6xl font-bold font-headline leading-tight">
                        The Smartest Way to Manage Your Gym
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
                        From AI-powered routine generation to live activity tracking, Fitness Flow is the all-in-one platform to elevate your athletes' training experience.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="text-lg py-7 px-8">
                            <Link href="/signup">Get Started for Free</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="text-lg py-7 px-8">
                            <Link href="/login">Login to Your Account</Link>
                        </Button>
                    </div>
                </div>
                 <div className="mt-16 w-full max-w-4xl px-4">
                    <AppDashboardIllustration />
                </div>
            </main>
        </div>
    );
}
