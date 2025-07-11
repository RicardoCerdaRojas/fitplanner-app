
'use client';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, ClipboardList } from 'lucide-react';
import { PieChart, ResponsiveContainer, Tooltip, Legend, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { AdminBottomNav } from '@/components/admin-bottom-nav';

type GymUser = { role: 'athlete' | 'coach' | 'gym-admin' };

const chartConfig: ChartConfig = {
  athletes: { label: "Athletes", color: "hsl(var(--chart-1))" },
  coaches: { label: "Coaches", color: "hsl(var(--chart-2))" },
};

const COLORS = [chartConfig.athletes.color, chartConfig.coaches.color];

export default function AdminDashboardPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    const [memberCount, setMemberCount] = useState(0);
    const [inviteCount, setInviteCount] = useState(0);
    const [routinesThisMonth, setRoutinesThisMonth] = useState(0);
    const [roleDistribution, setRoleDistribution] = useState<{ name: string; value: number; }[]>([]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (userProfile?.role !== 'gym-admin') {
                router.push('/');
            }
        }
    }, [user, userProfile, loading, router]);

    useEffect(() => {
        if (!userProfile?.gymId) return;

        const usersQuery = query(collection(db, 'users'), where('gymId', '==', userProfile.gymId));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as GymUser);
            setMemberCount(users.length);

            const roles = users.reduce((acc, user) => {
                if (user.role === 'athlete') acc.athletes++;
                if (user.role === 'coach') acc.coaches++;
                return acc;
            }, { athletes: 0, coaches: 0 });
            
            setRoleDistribution([
                { name: 'Athletes', value: roles.athletes },
                { name: 'Coaches', value: roles.coaches }
            ].filter(r => r.value > 0));
        });

        const invitesQuery = query(collection(db, 'invites'), where('gymId', '==', userProfile.gymId));
        const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
            setInviteCount(snapshot.docs.length);
        });

        const routinesQuery = query(
            collection(db, 'routines'),
            where('gymId', '==', userProfile.gymId)
        );
        const unsubscribeRoutines = onSnapshot(routinesQuery, (snapshot) => {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const routinesInLastMonth = snapshot.docs.filter(doc => {
                const createdAt = doc.data().createdAt as Timestamp;
                return createdAt && createdAt.toDate() >= oneMonthAgo;
            });
            setRoutinesThisMonth(routinesInLastMonth.length);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeInvites();
            unsubscribeRoutines();
        };

    }, [userProfile?.gymId]);

    if (loading || !user || userProfile?.role !== 'gym-admin') {
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
                
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-8">
                        <Card className="p-3">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="text-2xl font-bold">{memberCount}</div>
                                <p className="text-xs text-muted-foreground">Athletes & Coaches</p>
                            </CardContent>
                        </Card>
                        <Card className="p-3">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="text-2xl font-bold">+{inviteCount}</div>
                                <p className="text-xs text-muted-foreground">Waiting to sign up</p>
                            </CardContent>
                        </Card>
                        <Card className="p-3 col-span-2 md:col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                                <CardTitle className="text-sm font-medium">Routines This Month</CardTitle>
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="text-2xl font-bold">{routinesThisMonth}</div>
                                <p className="text-xs text-muted-foreground">Assigned in the last 30 days</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Member Distribution</CardTitle>
                                <CardDescription>A breakdown of roles within your gym.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                {roleDistribution.length > 0 ? (
                                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                        <PieChart>
                                            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                                            <Pie
                                                data={roleDistribution}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                innerRadius={50}
                                                paddingAngle={2}
                                            >
                                                {roleDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <p className="text-muted-foreground">No member data available.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Overview</CardTitle>
                                <CardDescription>Track workout completions and member engagement.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-[250px]">
                                <p className="text-muted-foreground">Chart coming soon.</p>
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
