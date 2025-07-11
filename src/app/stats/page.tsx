
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { Routine } from '@/components/athlete-routine-list';

import { AppHeader } from '@/components/app-header';
import { AthleteNav } from '@/components/athlete-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartConfig, ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Dumbbell, ClipboardCheck, TrendingUp } from 'lucide-react';

type StatsData = {
  totalWorkouts: number;
  totalSetsLogged: number;
  totalVolumeLifted: number;
  difficultyBreakdown: { name: string; value: number }[];
  workoutPerformance: { date: string; completed: number }[];
  routineTypeBreakdown: { name: string; value: number; fill: string }[];
  volumeByDate: { date: string; volume: number }[];
};

const chartConfig: ChartConfig = {
  completed: {
    label: 'Sets Completed',
    color: 'hsl(var(--primary))',
  },
  volume: {
    label: 'Volume (kg)',
    color: 'hsl(var(--accent))',
  },
  easy: { label: 'Easy', color: 'hsl(var(--chart-1))' },
  medium: { label: 'Medium', color: 'hsl(var(--chart-2))' },
  hard: { label: 'Hard', color: 'hsl(var(--chart-3))' },
};

const routineTypeColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    const routinesQuery = query(collection(db, 'routines'), where('memberId', '==', user.uid));
    const unsubscribe = onSnapshot(routinesQuery, (snapshot) => {
      const fetchedRoutines = snapshot.docs
        .map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                routineName: data.routineName,
                routineTypeName: data.routineTypeName,
                routineDate: (data.routineDate as Timestamp).toDate(),
                blocks: data.blocks,
                coachId: data.coachId,
                progress: data.progress,
            } as Routine;
        })
        .sort((a, b) => a.routineDate.getTime() - b.routineDate.getTime());
      setRoutines(fetchedRoutines);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);


  useEffect(() => {
    if (routines.length > 0) {
      const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
      const routineTypeCounts: { [key: string]: number } = {};
      let totalSetsLogged = 0;
      let totalVolumeLifted = 0;
      
      const volumeByDate = routines.map(routine => {
        let completedSetsCount = 0;
        let routineVolume = 0;
        
        if (routine.progress) {
          for (const key in routine.progress) {
            const setProgress = routine.progress[key];
            if (setProgress.completed) {
              completedSetsCount++;
              
              if(setProgress.difficulty) {
                difficultyCounts[setProgress.difficulty]++;
              }

              const [blockIndex, exerciseIndex] = key.split('-').map(Number);
              const exercise = routine.blocks?.[blockIndex]?.exercises?.[exerciseIndex];
              
              if (exercise) {
                let reps = 0;
                if (exercise.repType === 'reps' && exercise.reps) {
                    const repParts = exercise.reps.split('-').map(r => parseInt(r.trim(), 10));
                    if (repParts.length > 1 && !isNaN(repParts[0]) && !isNaN(repParts[1])) {
                        reps = (repParts[0] + repParts[1]) / 2;
                    } else if (!isNaN(repParts[0])) {
                        reps = repParts[0];
                    }
                }
                
                const weight = parseInt(exercise.weight?.match(/\d+/)?.[0] || '0', 10);
                
                if (!isNaN(reps) && reps > 0 && !isNaN(weight) && weight > 0) {
                    routineVolume += reps * weight;
                }
              }
            }
          }
        }
        
        totalSetsLogged += completedSetsCount;
        totalVolumeLifted += routineVolume;

        if (completedSetsCount > 0) {
            const routineTypeName = routine.routineTypeName || routine.routineName || 'Uncategorized';
            routineTypeCounts[routineTypeName] = (routineTypeCounts[routineTypeName] || 0) + 1;
        }
        
        return {
          date: new Date(routine.routineDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completed: completedSetsCount,
          volume: routineVolume,
        };
      });


      setStats({
        totalWorkouts: routines.length,
        totalSetsLogged,
        totalVolumeLifted,
        difficultyBreakdown: [
          { name: 'easy', value: difficultyCounts.easy },
          { name: 'medium', value: difficultyCounts.medium },
          { name: 'hard', value: difficultyCounts.hard },
        ].filter(d => d.value > 0),
        workoutPerformance: volumeByDate.filter(item => item.completed > 0),
        volumeByDate: volumeByDate.filter(v => v.volume > 0),
        routineTypeBreakdown: Object.entries(routineTypeCounts).map(([name, value], index) => ({
            name,
            value,
            fill: routineTypeColors[index % routineTypeColors.length],
        })),
      });
    }
  }, [routines]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
        <AppHeader />
        <div className="w-full max-w-4xl space-y-8 mt-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;


  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
        <AppHeader />
        <div className="w-full max-w-5xl space-y-8">
          <AthleteNav />

          {!stats || routines.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Data Yet</CardTitle>
                <CardDescription>Complete some workouts to see your stats here!</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Card className="col-span-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                          <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                          <p className="text-xs text-muted-foreground">Completed sessions</p>
                      </CardContent>
                  </Card>
                   <Card className="col-span-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Sets Logged</CardTitle>
                          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-2xl font-bold">{stats.totalSetsLogged}</p>
                          <p className="text-xs text-muted-foreground">Across all workouts</p>
                      </CardContent>
                  </Card>
                  <Card className="col-span-2 sm:col-span-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-2xl font-bold">{stats.totalVolumeLifted.toLocaleString()} kg</p>
                          <p className="text-xs text-muted-foreground">Total weight moved</p>
                      </CardContent>
                  </Card>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Workout Performance</CardTitle>
                        <CardDescription>Completed sets over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={stats.workoutPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                          <YAxis />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Difficulty Breakdown</CardTitle>
                        <CardDescription>How you've rated your completed sets.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                       <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie 
                                    data={stats.difficultyBreakdown} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={90}
                                    innerRadius={60}
                                    paddingAngle={2}
                                    labelLine={false} 
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                      return ( <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold"> {`${(percent * 100).toFixed(0)}%`} </text> );
                                }}>
                                    {stats.difficultyBreakdown.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={`var(--color-${entry.name})`} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                        <CardTitle>Total Workout Volume</CardTitle>
                        <CardDescription>Total weight lifted (Reps x Weight) per workout in kg.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <LineChart data={stats.volumeByDate} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Line type="monotone" dataKey="volume" stroke="var(--color-volume)" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Workout Type Distribution</CardTitle>
                      <CardDescription>Breakdown of your completed workouts.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        {stats.routineTypeBreakdown.length > 0 ? (
                            <ChartContainer config={{}} className="h-[300px] w-full">
                                <PieChart>
                                    <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                                    <Pie
                                        data={stats.routineTypeBreakdown}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={60}
                                        paddingAngle={2}
                                        labelLine={false}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {stats.routineTypeBreakdown.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-muted-foreground">No workout types recorded yet.</p>
                        )}
                    </CardContent>
                  </Card>
              </div>
            </>
          )}

        </div>
      </main>
      <footer className="w-full text-center p-4 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
