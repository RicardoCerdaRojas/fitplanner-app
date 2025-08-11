
'use client';

import { AppHeader } from "@/components/app-header";
import { AthleteNav } from "@/components/athlete-nav"; // <-- PASO 1: Importar el menú de navegación
import { AthleteRoutineList } from "@/components/athlete-routine-list";
import { useAuth } from "@/contexts/auth-context";
import { WeeklyProgress, RecentAchievement } from "@/components/athlete-dashboard-widgets";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="container mx-auto p-4 max-w-md space-y-6">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-24 w-full" />
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!user) {
        return <p>No se pudo cargar la información del usuario.</p>;
    }
    
    const completedDays = [1, 3];
    const currentDay = 4;
    const lastAchievement = {
      title: "¡Racha de 2 semanas!",
      description: "Sigue así, estás construyendo un gran hábito."
    };

    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <div className="container mx-auto p-4 max-w-md space-y-8 flex-grow">
                
                {/* -- PASO 2: Añadir el menú de navegación en su lugar -- */}
                <div className="pt-4">
                    <AthleteNav />
                </div>
                
                <section className="space-y-4">
                    <WeeklyProgress completedDays={completedDays} currentDay={currentDay} />
                    <RecentAchievement title={lastAchievement.title} description={lastAchievement.description} />
                </section>

                <main>
                    <AthleteRoutineList />
                </main>
            </div>
        </div>
    );
}
