
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
import { BarChart, ResponsiveContainer, Tooltip, Legend, Bar, XAxis, YAxis, LabelList, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { AdminBottomNav } from '@/components/admin-bottom-nav';
import { TrialEnded } from '@/components/trial-ended';


type UserProfile = {
  dob?: Timestamp;
  gender?: 'male' | 'female' | 'other';
  role: 'member' | 'coach' | 'gym-admin';
};

type Routine = {
    routineTypeName?: string;
    createdAt: Timestamp;
};

const routineChartConfig: ChartConfig = {
  count: { label: "Asignaciones" },
}

const genderChartConfig: ChartConfig = {
    male: { label: 'Hombres', color: 'hsl(var(--chart-2))' },
    female: { label: 'Mujeres', color: 'hsl(var(--chart-1))' },
};

const ageChartConfig: ChartConfig = {
    count: { label: 'Miembros' },
    '<30': { color: 'hsl(var(--chart-1))' },
    '30-39': { color: 'hsl(var(--chart-2))' },
    '40-49': { color: 'hsl(var(--chart-3))' },
    '50+': { color: 'hsl(var(--chart-4))' },
}

export default function AdminDashboardPage() {
    const { activeMembership, loading, isTrialActive } = useAuth();
    const router = useRouter();

    const [memberCount, setMemberCount] = useState(0);
    const [coachCount, setCoachCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [routinesThisMonth, setRoutinesThisMonth] = useState(0);
    const [topRoutines, setTopRoutines] = useState<{ name: string; count: number; fill: string; }[]>([]);
    const [activeNow, setActiveNow] = useState(0);
    const [genderDistribution, setGenderDistribution] = useState<{ name: string; value: number; fill: string; }[]>([]);
    const [ageDistribution, setAgeDistribution] = useState<{ name: string; count: number; fill: string; }[]>([]);

    useEffect(() => {
        if (loading || !activeMembership?.gymId) return;

        const gymId = activeMembership.gymId;
        
        const activeSessionsQuery = query(collection(db, 'workoutSessions'), where('gymId', '==', gymId), where('status', '==', 'active'));
        const unsubscribeActive = onSnapshot(activeSessionsQuery, (snapshot) => {
             getCountFromServer(snapshot.query).then(countSnapshot => {
                setActiveNow(countSnapshot.data().count);
            });
        });
        
        const usersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as UserProfile);
            setMemberCount(users.filter(u => u.role === 'member').length);
            setCoachCount(users.filter(u => u.role === 'coach').length);

            // Demographics calculation
            const genderCounts = { male: 0, female: 0, other: 0 };
            const ageCounts: { [key: string]: number } = { '<30': 0, '30-39': 0, '40-49': 0, '50+': 0 };

            users.forEach(user => {
                if (user.gender) {
                    genderCounts[user.gender]++;
                }
                if (user.dob) {
                    const age = new Date().getFullYear() - user.dob.toDate().getFullYear();
                    if (age < 30) ageCounts['<30']++;
                    else if (age < 40) ageCounts['30-39']++;
                    else if (age < 50) ageCounts['40-49']++;
                    else ageCounts['50+']++;
                }
            });
            
            setGenderDistribution([
                { name: 'Hombres', value: genderCounts.male, fill: 'hsl(var(--chart-2))' },
                { name: 'Mujeres', value: genderCounts.female, fill: 'hsl(var(--chart-1))' }
            ].filter(item => item.value > 0));

            const ageColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
            setAgeDistribution(Object.entries(ageCounts).map(([name, count], index) => ({ name, count, fill: ageColors[index % ageColors.length] })));
        });

        const pendingQuery = query(collection(db, 'memberships'), where('gymId', '==', gymId), where('status', '==', 'pending'));
        const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
            setPendingCount(snapshot.docs.length);
        });

        const routinesQuery = query(collection(db, 'routines'), where('gymId', '==', gymId));
        const unsubscribeRoutines = onSnapshot(routinesQuery, (snapshot) => {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const routines = snapshot.docs.map(doc => doc.data() as Routine);
            
            const routinesInLastMonth = routines.filter(r => r.createdAt && r.createdAt.toDate() >= oneMonthAgo).length;
            setRoutinesThisMonth(routinesInLastMonth);

            const routineTypeCounts = routines.reduce((acc, routine) => {
                const typeName = routine.routineTypeName || 'Sin Categoría';
                acc[typeName] = (acc[typeName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const routineColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
            const sortedRoutines = Object.entries(routineTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count], index) => ({ name, count, fill: routineColors[index % routineColors.length] }));
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
                 <p className='mt-8 text-lg text-muted-foreground'>Verificando acceso de administrador...</p>
            </div>
        );
    }
        
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            {isTrialActive === false ? (
                <TrialEnded />
            ) : (
                <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
                    <div className="w-full max-w-6xl">
                        <h1 className="text-3xl font-bold font-headline mb-4">Dashboard de Administración</h1>
                        <AdminBottomNav />
                    
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{memberCount + coachCount}</div>
                                    <p className="text-xs text-muted-foreground">{memberCount} Miembros, {coachCount} Coaches</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Inscripciones Pendientes</CardTitle>
                                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">+{pendingCount}</div>
                                    <p className="text-xs text-muted-foreground">Esperando para unirse</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Activos Ahora</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{activeNow}</div>
                                    <p className="text-xs text-muted-foreground">Miembros en una sesión</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Rutinas (últ. 30 días)</CardTitle>
                                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{routinesThisMonth}</div>
                                    <p className="text-xs text-muted-foreground">Asignadas en el último mes</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Distribución de Género</CardTitle>
                                    <CardDescription>Desglose de miembros por género.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {genderDistribution.length > 0 ? (
                                        <ChartContainer config={genderChartConfig} className="h-[250px] w-full">
                                            <PieChart>
                                                <Tooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
                                                <Pie 
                                                    data={genderDistribution} 
                                                    dataKey="value" 
                                                    nameKey="name" 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    outerRadius={80} 
                                                    labelLine={false}
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                >
                                                    {genderDistribution.map((entry) => (
                                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <ChartLegend content={<ChartLegendContent />} />
                                            </PieChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center">
                                            <p className="text-muted-foreground">No hay datos de género.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Distribución de Edad</CardTitle>
                                    <CardDescription>Desglose de miembros por rango de edad.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {ageDistribution.some(d => d.count > 0) ? (
                                        <ChartContainer config={ageChartConfig} className="h-[250px] w-full">
                                            <BarChart data={ageDistribution} accessibilityLayer>
                                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                                <YAxis hide />
                                                <Tooltip content={<ChartTooltipContent hideIndicator />} />
                                                <Bar dataKey="count" radius={4}>
                                                    <LabelList 
                                                        position="insideTop"
                                                        offset={10}
                                                        className="fill-white"
                                                        fontSize={12} 
                                                    />
                                                    {ageDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center">
                                            <p className="text-muted-foreground">No hay datos de edad.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Tipos de Rutina Más Asignados</CardTitle>
                                    <CardDescription>Los tipos de rutina que más se han asignado.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {topRoutines.length > 0 ? (
                                        <ChartContainer config={routineChartConfig} className="h-[250px] w-full">
                                            <BarChart data={topRoutines} layout="vertical" accessibilityLayer margin={{ left: 10, right: 30 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={100} />
                                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                <Legend />
                                                <Bar dataKey="count" layout="vertical" radius={4}>
                                                <LabelList 
                                                        dataKey="count" 
                                                        position="right" 
                                                        offset={8} 
                                                        className="fill-foreground" 
                                                        fontSize={12} 
                                                    />
                                                    {topRoutines.map((entry, index) => (
                                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center">
                                            <p className="text-muted-foreground">No hay datos de rutinas.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            )}
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
