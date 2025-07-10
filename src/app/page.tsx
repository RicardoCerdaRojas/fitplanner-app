
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
import { User, Building, ClipboardList, WandSparkles, BarChart3 } from 'lucide-react';
import type { Routine as AthleteRoutine } from '@/components/athlete-routine-list';
import { AthleteRoutineList } from '@/components/athlete-routine-list';
import { AthleteNav } from '@/components/athlete-nav';
import Image from 'next/image';


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
  const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="p-6 text-center transform hover:-translate-y-2 transition-transform duration-300">
      <div className="flex justify-center mb-4">
        <div className="bg-primary/10 text-primary p-4 rounded-full">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );

  const TestimonialCard = ({ quote, name, role, avatarUrl, hint }: { quote: string, name: string, role: string, avatarUrl: string, hint: string }) => (
      <Card className="p-6 bg-card/50 border-border/50">
          <p className="text-card-foreground/90 mb-4">"{quote}"</p>
          <div className="flex items-center gap-4">
              <Image src={avatarUrl} alt={name} width={40} height={40} className="rounded-full" data-ai-hint={hint} />
              <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-muted-foreground">{role}</p>
              </div>
          </div>
      </Card>
  );

  return (
    <div className="w-full max-w-6xl text-center animate-fade-in">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight mb-4">
          Transform Your Training.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Fitness Flow is the all-in-one platform for gyms, coaches, and athletes to create, track, and conquer their fitness goals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
            <Link href="/signup">Get Started Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">Everything You Need to Succeed</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<ClipboardList className="w-8 h-8" />}
            title="Custom Routine Builder"
            description="Coaches can design detailed, personalized workout plans for every client with an intuitive block-based editor."
          />
          <FeatureCard 
            icon={<WandSparkles className="w-8 h-8" />}
            title="AI-Powered Workouts"
            description="Athletes can instantly generate effective workout routines based on their goals and fitness level."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-8 h-8" />}
            title="Real-time Tracking & Stats"
            description="Log every set and watch your progress over time with detailed performance charts and statistics."
          />
        </div>
      </section>

      {/* Visual Section */}
       <section className="py-20">
            <div className="relative aspect-video rounded-xl shadow-2xl overflow-hidden">
                 <Image src="https://placehold.co/1200x675.png" alt="Fitness Flow dashboard" fill className="object-cover" data-ai-hint="fitness app dashboard" />
            </div>
       </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30 rounded-lg">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Loved by Athletes and Coaches</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <TestimonialCard 
                  quote="The ability to see my routines and track progress in real-time has been a game changer for my motivation."
                  name="Alex R."
                  role="Athlete"
                  avatarUrl="https://placehold.co/100x100.png"
                  hint="portrait athlete"
              />
              <TestimonialCard 
                  quote="Fitness Flow saves me hours every week. Creating and assigning routines is incredibly fast and efficient."
                  name="Coach Sarah K."
                  role="Gym Coach"
                  avatarUrl="https://placehold.co/100x100.png"
                  hint="portrait coach"
              />
          </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 md:py-32">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Elevate Your Fitness?</h2>
        <p className="text-lg text-muted-foreground mb-8">Join today and take the first step towards smarter training.</p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-lg py-7 px-10">
          <Link href="/signup">Sign Up for Free</Link>
        </Button>
      </section>
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
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <AppHeader />
                
                <div className="flex-grow flex items-center justify-center w-full">
                    {renderContent()}
                </div>
            </main>
            <footer className="w-full p-4 text-muted-foreground text-sm">
                {isGuest ? (
                  <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center">
                    <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
                    <div className="flex gap-4">
                      <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                      <Link href="#" className="hover:text-primary">Terms of Service</Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p>
                        Create your own routines, track your progress, and crush your goals.
                    </p>
                    <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
                  </div>
                )}
            </footer>
        </div>
    );
}
