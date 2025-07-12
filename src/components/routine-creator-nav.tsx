
'use client';

import { useRoutineCreator } from "./coach-routine-creator";
import { Button } from "./ui/button";
import { ArrowLeft, GripVertical, ListChecks, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";

function ExercisesNavList({ blockIndex }: { blockIndex: number }) {
    const { form, activeSelection, setActiveSelection, appendExercise } = useRoutineCreator();
    const watchedExercises = form.watch(`blocks.${blockIndex}.exercises`);

    return (
        <div className="pl-4 border-l-2 ml-4 border-muted/50 py-2 space-y-1">
            {(watchedExercises || []).map((_, exIndex) => {
                const isActive = activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex === exIndex;
                return (
                    <li key={exIndex} className="list-none">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start h-9 px-2 text-muted-foreground hover:text-foreground",
                                isActive && "font-semibold bg-primary/10 text-primary"
                            )}
                            onClick={() => setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: exIndex })}
                        >
                           <GripVertical className="mr-2 h-4 w-4 shrink-0" />
                           <span className="truncate">{watchedExercises?.[exIndex]?.name || `Exercise ${exIndex + 1}`}</span>
                        </Button>
                    </li>
                );
            })}
             <li className="list-none">
                <Button type="button" variant="ghost" className="w-full justify-start h-9 px-2 text-sm text-primary hover:text-primary font-semibold" onClick={() => appendExercise(blockIndex)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                </Button>
            </li>
        </div>
    );
}

export function RoutineCreatorNav() {
    const { isEditing, activeSelection, setActiveSelection, blockFields, appendBlock, form } = useRoutineCreator();
    const router = useRouter();

    return (
        <div className="space-y-4 flex flex-col h-full p-1">
            <div>
                 <Button variant="ghost" onClick={() => router.push('/coach')} className="w-full justify-start text-sm text-muted-foreground hover:text-foreground -ml-2 mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Routines
                </Button>
                <div className="px-1">
                    <h1 className="text-2xl font-bold font-headline">{isEditing ? 'Edit Routine' : 'Create New Routine'}</h1>
                </div>
            </div>
            
            <nav className="flex-grow py-4">
                <ul className="space-y-1">
                    <li>
                        <Button 
                            type="button" 
                            variant={activeSelection.type === 'details' ? 'default' : 'ghost'}
                            className="w-full justify-start font-semibold h-10 px-3"
                            onClick={() => setActiveSelection({ type: 'details' })}
                        >
                            <ListChecks className="mr-2 h-4 w-4" /> Routine Details
                        </Button>
                    </li>
                    {blockFields.map((field, index) => {
                        const isChildExerciseActive = (activeSelection.type === 'exercise' && activeSelection.blockIndex === index);
                        const isActive = (activeSelection.type === 'block' && activeSelection.index === index) || isChildExerciseActive;
                        
                        return (
                            <li key={field.id} className="list-none">
                                <Button 
                                    type="button" 
                                    variant={isActive && activeSelection.type === 'block' ? 'default' : 'ghost'}
                                    className={cn(
                                        "w-full justify-start font-semibold h-10 px-3",
                                        isActive && ! (activeSelection.type === 'block') && "text-primary bg-primary/10"
                                    )}
                                    onClick={() => setActiveSelection({ type: 'block', index })}
                                >
                                    <ListChecks className="mr-2 h-4 w-4" /> {form.watch(`blocks.${index}.name`) || `Block ${index + 1}`}
                                </Button>
                                {isActive && <ExercisesNavList blockIndex={index} />}
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="pt-4 mt-auto">
                 <Separator className="mb-4" />
                 <Button type="button" variant="outline" className="w-full justify-center h-10" onClick={() => appendBlock({ name: `Block ${blockFields.length + 1}`, sets: '1', exercises: []})}>
                    <Plus className="mr-2 h-4 w-4" /> Add Block
                </Button>
            </div>

        </div>
    )
}
