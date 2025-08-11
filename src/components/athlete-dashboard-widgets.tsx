
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// --- WIDGET 1: Progreso Semanal ---
interface WeeklyProgressProps {
  completedDays: number[];
  currentDay: number;
}

export const WeeklyProgress = ({ completedDays, currentDay }: WeeklyProgressProps) => {
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tu Progreso Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around">
          {weekDays.map((day, index) => {
            const dayIndex = index + 1;
            const isCompleted = completedDays.includes(dayIndex);
            const isCurrent = currentDay === dayIndex;

            return (
              <div key={day} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                    isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : day}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


// --- WIDGET 2: Logro Reciente ---
interface RecentAchievementProps {
  title: string;
  description: string;
}

export const RecentAchievement = ({ title, description }: RecentAchievementProps) => {
  return (
    <Card className="bg-yellow-400/10 border-yellow-500/20">
        <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-400/20 rounded-lg border border-yellow-500/30">
                <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
                {/* CORRECCIÓN: Usar text-foreground para que se adapte al tema */}
                <p className="font-bold text-foreground">{title}</p>
                {/* CORRECCIÓN: Usar un color semántico más suave */}
                <p className="text-sm text-yellow-600 dark:text-yellow-500/80">{description}</p>
            </div>
        </CardContent>
    </Card>
  );
};
