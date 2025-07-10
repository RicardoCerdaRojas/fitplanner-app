
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
import { User, Building } from 'lucide-react';
import type { Routine as AthleteRoutine } from '@/components/athlete-routine-list';
import { AthleteRoutineList } from '@/components/athlete-routine-list';
import { AthleteNav } from '@/components/athlete-nav';


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
  return (
    <div className="w-full max-w-4xl text-center">
        <Card className="p-8 sm:p-12 bg-card/50 border-2 border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="text-4xl md:text-5xl font-headline">Welcome to Fitness Flow</CardTitle>
                <CardDescription className="text-lg md:text-xl mt-2">The ultimate platform for gyms, coaches, and athletes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                 <Button asChild size="lg">
                    <Link href="/login">Login to Your Account</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/signup">Sign Up Now</Link>
                </Button>
            </CardContent>
        </Card>
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

        if (!user) {
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
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                
                <div className="flex-grow flex items-center justify-center w-full">
                    {renderContent()}
                </div>
            </main>
            <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>
                    Create your own routines, track your progress, and crush your goals.
                </p>
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
