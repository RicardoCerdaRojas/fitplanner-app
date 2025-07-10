
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, Building, Facebook, Twitter, Instagram } from 'lucide-react';
import type { Routine as AthleteRoutine } from '@/components/athlete-routine-list';
import { AthleteRoutineList } from '@/components/athlete-routine-list';
import { AthleteNav } from '@/components/athlete-nav';
import Image from 'next/image';
import { cn } from '@/lib/utils';


function AthleteDashboard() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<AthleteRoutine[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        const routinesQuery = query(
            collection(db, 'routines'),
            where('athleteId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(routinesQuery, (snapshot) => {
            const fetchedRoutines = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    routineName: data.routineName,
                    routineTypeName: data.routineTypeName,
                    routineDate: (data.routineDate as Timestamp).toDate(),
                    blocks: data.blocks,
                    coachId: data.coachId,
                    progress: data.progress,
                } as AthleteRoutine;
            }).sort((a, b) => b.routineDate.getTime() - a.routineDate.getTime());
            setRoutines(fetchedRoutines);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching routines: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="w-full max-w-4xl space-y-8">
            <AthleteNav />
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : (
                <AthleteRoutineList routines={routines} />
            )}
        </div>
    );
}

function CoachDashboard() {
    return (
        <div className="w-full max-w-2xl text-center">
            <Card className="p-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Welcome, Coach!</CardTitle>
                    <CardDescription>You're in Coach Mode. Here you can manage your clients and their routines.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
                        <Link href="/coach">
                            <User className="mr-2 h-4 w-4" /> Go to Client Routine Creator
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function AdminDashboard() {
    return (
        <div className="w-full max-w-2xl text-center">
            <Card className="p-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Admin Dashboard</CardTitle>
                    <CardDescription>Manage your gym, or create routines for your clients.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                     <Button asChild size="lg">
                        <Link href="/admin">
                            <Building className="mr-2 h-4 w-4" /> Manage Gym
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href="/coach">
                            <User className="mr-2 h-4 w-4" /> Create Routines
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function GuestLandingPage() {
  const socialLinks = [
    { href: "#", icon: Facebook, name: "Facebook" },
    { href: "#", icon: Twitter, name: "Twitter" },
    { href: "#", icon: Instagram, name: "Instagram" },
  ];

  return (
    <div className="w-full">
      <div className="relative bg-gray-950">
        {/* Background image and overlay */}
        <div className="absolute inset-0">
          <Image
            src="https://placehold.co/1920x1280.png"
            alt="Fitness motivation"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
            data-ai-hint="muscular man fitness"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold text-white tracking-wider">
                FITNESS
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <Link href="#" className="text-blue-500 transition hover:text-blue-400">Home</Link>
                <Link href="#" className="text-white transition hover:text-blue-400">About</Link>
                <Link href="#" className="text-white transition hover:text-blue-400">Trainers</Link>
                <Link href="#" className="text-white transition hover:text-blue-400">Blog</Link>
                <Link href="#" className="text-white transition hover:text-blue-400">Contact</Link>
              </nav>
               <div className="md:hidden">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-grow flex items-center py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-xl">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight animate-fade-in">
                  Build Perfect Body
                  <br />
                  With Clean Mind
                </h1>
                <p className="mt-6 text-lg text-gray-300 animate-fade-in [animation-delay:200ms]">
                  Unleash your potential with AI-powered workout plans, expert coaching tools, and seamless progress tracking. Join the community dedicated to achieving peak fitness.
                </p>
                <div className="mt-8 animate-fade-in [animation-delay:400ms]">
                  <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-700 px-10 py-6 text-base font-bold">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
                <div className="mt-12 flex items-center space-x-6 animate-fade-in [animation-delay:600ms]">
                  {socialLinks.map((link) => (
                    <Link key={link.name} href={link.href} className="text-gray-400 hover:text-white">
                      <span className="sr-only">{link.name}</span>
                      <link.icon className="h-6 w-6" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


export default function Home() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && !userProfile?.gymId) {
            router.push('/create-gym');
        }
    }, [user, userProfile, loading, router]);

    const isGuest = !loading && !user;

    const renderContent = () => {
        if (loading) {
            return (
                <div className="w-full max-w-2xl space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-64 w-full" />
                </div>
            );
        }

        if (isGuest) {
            return <GuestLandingPage />;
        }

        if (!userProfile?.gymId) {
             return <p>Redirecting to gym setup...</p>;
        }

        switch (userProfile.role) {
            case 'gym-admin':
                return <AdminDashboard />;
            case 'coach':
                return <CoachDashboard />;
            case 'athlete':
                return <AthleteDashboard />;
            default:
                return (
                    <div className="w-full max-w-2xl text-center">
                        <Card className="p-8">
                            <CardHeader>
                                <CardTitle className="text-3xl font-headline">Welcome!</CardTitle>
                                <CardDescription>Your account is pending configuration by your gym administrator.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <main className={cn(
                "flex-grow flex flex-col",
                isGuest ? "" : "items-center p-4 sm:p-8"
            )}>
                {!isGuest && <AppHeader />}
                
                <div className={cn(
                  "flex-grow flex items-center justify-center",
                  isGuest ? "w-full" : "w-full"
                )}>
                    {renderContent()}
                </div>
            </main>
            
            {!isGuest && (
              <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                  <p>
                      Create your own routines, track your progress, and crush your goals.
                  </p>
                  <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
              </footer>
            )}
        </div>
    );
}
