
'use client';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, getCountFromServer } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, ClipboardList, Activity } from 'lucide-react';
import { BarChart, ResponsiveContainer, Tooltip, Legend, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { AdminBottomNav } from '@/components/admin-bottom-nav';


type UserProfile = {
  dob?: Timestamp;
  gender?: 'male' | 'female' | 'other';
  role: 'member' | 'coach' | 'gym-admin';
};

type Routine = {
    routineTypeName?: string;
};

const ageChartConfig: ChartConfig = {
  male: { label: 'Male', color: 'hsl(var(--chart-2))' },
  female: { label: 'Female', color: 'hsl(var(--chart-1))' },
};
const routineChartConfig: ChartConfig = {
  count: { label: "Assignments", color: "hsl(var(--chart-2))" },
}

const calculateAge = (dob: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

export default function AdminDashboardPage() {
    const { activeMembership, loading } = useAuth();
    const router = useRouter();

    const [memberCount, setMemberCount] = useState(0);
    const [coachCount, setCoachCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [routinesThisMonth, setRoutinesThisMonth] = useState(0);
    const [ageDistribution, setAgeDistribution] = useState<{ name: string; male: number; female: number; }[]>([]);
    const [topRoutines, setTopRoutines] = useState<{ name: string; count: number; }[]>([]);
    const [activeNow, setActiveNow] = useState(0);

    useEffect(() => {
        if (loading || !activeMembership?.gymId) return;

        const gymId = activeMembership.gymId;
        
        // Active Users (Firestore Snapshot)
        const activeSessionsQuery = query(collection(db, 'workoutSessions'), where('gymId', '==', gymId), where('status', '==', 'active'));
        const unsubscribeActive = onSnapshot(activeSessionsQuery, (snapshot) => {
             getCountFromServer(snapshot.query).then(countSnapshot => {
                setActiveNow(countSnapshot.data().count);
            });
        });
        
        // Users collection for members, coaches, and age distribution
        const usersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as UserProfile);
            setMemberCount(users.filter(u => u.role === 'member').length);
            setCoachCount(users.filter(u => u.role === 'coach').length);

            // Age and Gender distribution
            const ageGroups: Record<string, { male: number; female: number }> = {
                '<30': { male: 0, female: 0 },
                '30-39': { male: 0, female: 0 },
                '40-49': { male: 0, female: 0 },
                '50+': { male: 0, female: 0 },
            };

            users.forEach(user => {
                if(user.dob && user.gender && (user.gender === 'male' || user.gender === 'female')) {
                    const age = calculateAge(user.dob.toDate());
                    let ageGroupKey: string;
                    if (age < 30) ageGroupKey = '<30';
                    else if (age >= 30 && age < 40) ageGroupKey = '30-39';
                    else if (age >= 40 && age < 50) ageGroupKey = '40-49';
                    else ageGroupKey = '50+';
                    
                    if (ageGroups[ageGroupKey]) {
                        ageGroups[ageGroupKey][user.gender]++;
                    }
                }
            });
            setAgeDistribution(Object.entries(ageGroups).map(([name, counts]) => ({ name, ...counts })));
        });

        // Pending memberships
        const pendingQuery = query(collection(db, 'memberships'), where('gymId', '==', gymId), where('status', '==', 'pending'));
        const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
            setPendingCount(snapshot.docs.length);
        });

        // Routines this month and top routines
        const routinesQuery = query(collection(db, 'routines'), where('gymId', '==', gymId));
        const unsubscribeRoutines = onSnapshot(routinesQuery, (snapshot) => {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const routines = snapshot.docs.map(doc => doc.data() as Routine);
            const routinesInLastMonth = snapshot.docs.filter(doc => {
                const createdAt = (doc.data().createdAt as Timestamp);
                return createdAt && createdAt.toDate() >= oneMonthAgo;
            }).length;
            setRoutinesThisMonth(routinesInLastMonth);

            const routineTypeCounts = routines.reduce((acc, routine) => {
                const typeName = routine.routineTypeName || 'Uncategorized';
                acc[typeName] = (acc[typeName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const sortedRoutines = Object.entries(routineTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));
            setTopRoutines(sortedRoutines);
        });

        return () => {
            unsubscribeUsers();
            unsubscribePending();
            unsubscribeRoutines();
            unsubscribeActive();
        };

    }, [loading, activeMembership]);

    if (loading || !activeMembership || activeMembership.role !== 'gym-admin') {
        return (
            <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-6xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
                 <p className='mt-8 text-lg text-muted-foreground'>Verifying admin access...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
                <div className="w-full max-w-6xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                    <AdminBottomNav />
                
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{memberCount + coachCount}</div>
                                <p className="text-xs text-muted-foreground">{memberCount} Members, {coachCount} Coaches</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Signups</CardTitle>
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{pendingCount}</div>
                                <p className="text-xs text-muted-foreground">Waiting to join</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeNow}</div>
                                <p className="text-xs text-muted-foreground">Members in a session</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Routines This Month</CardTitle>
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{routinesThisMonth}</div>
                                <p className="text-xs text-muted-foreground">Assigned in last 30 days</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Member Demographics</CardTitle>
                                <CardDescription>A breakdown of your members by age and gender.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {ageDistribution.some(d => d.male > 0 || d.female > 0) ? (
                                    <ChartContainer config={ageChartConfig} className="h-[250px] w-full">
                                        <BarChart data={ageDistribution} accessibilityLayer>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                            <YAxis />
                                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Legend content={<ChartLegendContent />} />
                                            <Bar dataKey="female" fill="var(--color-female)" radius={4} />
                                            <Bar dataKey="male" fill="var(--color-male)" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <p className="text-muted-foreground">No member demographic data available.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Top Routine Types</CardTitle>
                                <CardDescription>The most frequently assigned routine types.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {topRoutines.length > 0 ? (
                                    <ChartContainer config={routineChartConfig} className="h-[250px] w-full">
                                         <BarChart data={topRoutines} layout="vertical" accessibilityLayer>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={80} />
                                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Legend />
                                            <Bar dataKey="count" fill="var(--color-count)" radius={4} layout="vertical" />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <p className="text-muted-foreground">No routine data available.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
