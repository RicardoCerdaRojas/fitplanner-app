'use client';

import { useRoutineCreator } from "./coach-routine-creator";
import { Button } from "./ui/button";
import { ArrowLeft, GripVertical, ListChecks, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultExerciseValues } from "./coach-routine-creator";
import { useRouter } from "next/navigation";

function ExercisesNavList({ blockIndex, exercises }: { blockIndex: number, exercises: any[] }) {
    const { activeSelection, setActiveSelection, appendExercise, form } = useRoutineCreator();
    const watchedExercises = form.watch(`blocks.${blockIndex}.exercises`);

    return (
        <ul className="space-y-1 pl-4 border-l-2 ml-3">
            {(watchedExercises || exercises).map((_, exIndex) => {
                const isActive = activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex === exIndex;
                return (
                    <li key={exIndex}>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start h-8 px-2",
                                isActive && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: exIndex })}
                        >
                           <GripVertical className="mr-2 h-4 w-4 text-muted-foreground" />
                           <span className="truncate">{watchedExercises?.[exIndex]?.name || `Exercise ${exIndex + 1}`}</span>
                        </Button>
                    </li>
                );
            })}
             <li>
                <Button type="button" variant="ghost" className="w-full justify-start h-8 px-2 text-sm text-accent" onClick={() => appendExercise(blockIndex)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                </Button>
            </li>
        </ul>
    );
}

export function RoutineCreatorNav() {
    const { isEditing, activeSelection, setActiveSelection, blockFields, appendBlock } = useRoutineCreator();
    const router = useRouter();

    return (
        <div className="space-y-4">
             <Button variant="ghost" onClick={() => router.push('/coach')} className="w-full justify-start">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Routines
            </Button>
            <h1 className="text-xl font-bold font-headline px-3">{isEditing ? 'Edit Routine' : 'Create New Routine'}</h1>

            <nav>
                <ul className="space-y-1">
                    <li>
                         <Button 
                            type="button" 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start font-semibold",
                                activeSelection.type === 'details' && "bg-accent text-accent-foreground"
                            )}
                             onClick={() => setActiveSelection({ type: 'details' })}
                        >
                            <ListChecks className="mr-2 h-4 w-4" /> Routine Details
                         </Button>
                    </li>
                    {blockFields.map((field, index) => {
                        const isActive = (activeSelection.type === 'block' && activeSelection.index === index) || (activeSelection.type === 'exercise' && activeSelection.blockIndex === index);
                        return (
                            <li key={field.id}>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className={cn(
                                        "w-full justify-start font-semibold",
                                        isActive && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => setActiveSelection({ type: 'block', index })}
                                >
                                    <ListChecks className="mr-2 h-4 w-4" /> {field.name}
                                </Button>
                                {isActive && <ExercisesNavList blockIndex={index} exercises={field.exercises} />}
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="px-3 pt-4 border-t">
                 <Button type="button" variant="outline" className="w-full" onClick={() => appendBlock({ name: `Block ${blockFields.length + 1}`, sets: '3', exercises: []})}>
                    <Plus className="mr-2 h-4 w-4" /> Add Block
                </Button>
            </div>

        </div>
    )
}