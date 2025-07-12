
'use client';

import { useRoutineCreator } from "./coach-routine-creator";
import { Button } from "./ui/button";
import { ArrowLeft, GripVertical, ListChecks, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultExerciseValues } from "./coach-routine-creator";
import { useRouter } from "next/navigation";

function ExercisesNavList({ blockIndex }: { blockIndex: number }) {
    const { form, activeSelection, setActiveSelection, appendExercise } = useRoutineCreator();
    const watchedExercises = form.watch(`blocks.${blockIndex}.exercises`);

    return (
        <ul className="space-y-1 pl-4 border-l-2 ml-3 border-muted-foreground/20">
            {(watchedExercises || []).map((_, exIndex) => {
                const isActive = activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex === exIndex;
                return (
                    <li key={exIndex}>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start h-9 px-2 text-muted-foreground hover:text-foreground",
                                isActive && "text-accent-foreground" // Text color handled by parent's bg
                            )}
                            onClick={() => setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: exIndex })}
                        >
                           <GripVertical className="mr-2 h-4 w-4" />
                           <span className="truncate">{watchedExercises?.[exIndex]?.name || `Exercise ${exIndex + 1}`}</span>
                        </Button>
                    </li>
                );
            })}
             <li>
                <Button type="button" variant="ghost" className="w-full justify-start h-9 px-2 text-sm text-accent hover:text-accent" onClick={() => appendExercise(blockIndex)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                </Button>
            </li>
        </ul>
    );
}

export function RoutineCreatorNav() {
    const { isEditing, activeSelection, setActiveSelection, blockFields, appendBlock, form } = useRoutineCreator();
    const router = useRouter();

    return (
        <div className="space-y-4">
             <Button variant="ghost" onClick={() => router.push('/coach')} className="w-full justify-start text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Routines
            </Button>
            
            <div className="px-3">
                <h1 className="text-xl font-bold font-headline">{isEditing ? 'Edit Routine' : 'Create New Routine'}</h1>
            </div>

            <nav className="px-3">
                <ul className="space-y-1">
                    <li>
                         <Button 
                            type="button" 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start font-semibold text-foreground",
                                activeSelection.type === 'details' && "bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground"
                            )}
                             onClick={() => setActiveSelection({ type: 'details' })}
                        >
                            <ListChecks className="mr-2 h-4 w-4" /> Routine Details
                         </Button>
                    </li>
                    {blockFields.map((field, index) => {
                        const isBlockActive = (activeSelection.type === 'block' && activeSelection.index === index);
                        const isChildExerciseActive = (activeSelection.type === 'exercise' && activeSelection.blockIndex === index);
                        const isActive = isBlockActive || isChildExerciseActive;
                        
                        return (
                            <li key={field.id} className={cn("rounded-md transition-colors", isActive && "bg-accent text-accent-foreground")}>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className={cn(
                                        "w-full justify-start font-semibold text-foreground",
                                        isActive && "bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground"
                                    )}
                                    onClick={() => setActiveSelection({ type: 'block', index })}
                                >
                                    <ListChecks className="mr-2 h-4 w-4" /> {form.watch(`blocks.${index}.name`)}
                                </Button>
                                {(isActive) && <ExercisesNavList blockIndex={index} />}
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="px-3 pt-4 mt-4 border-t">
                 <Button type="button" variant="outline" className="w-full" onClick={() => appendBlock({ name: `Block ${blockFields.length + 1}`, sets: '3', exercises: []})}>
                    <Plus className="mr-2 h-4 w-4" /> Add Block
                </Button>
            </div>

        </div>
    )
}
