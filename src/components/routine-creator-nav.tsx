'use client';

import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoutineCreator, defaultExerciseValues } from './coach-routine-creator';

type ExercisesNavListProps = {
    blockIndex: number;
};

const ExercisesNavList = ({ blockIndex }: ExercisesNavListProps) => {
    const { form, setActiveSelection, onCloseNav, appendExercise, removeExercise, exerciseFields } = useRoutineCreator();
    const { activeSelection } = useRoutineCreator();

    const exercises = exerciseFields(blockIndex);

    const handleRemoveExercise = (e: React.MouseEvent, exerciseIndex: number) => {
        e.stopPropagation();
        removeExercise(blockIndex, exerciseIndex);
        setActiveSelection({ type: 'block', blockIndex });
    };

    const handleAddExercise = (e: React.MouseEvent) => {
         e.stopPropagation();
         const newIndex = exercises.length;
         appendExercise(blockIndex, defaultExerciseValues);
         setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: newIndex });
    };


    return (
        <ul className="pl-6 pr-2 py-1 space-y-1 mt-1 border-l-2 ml-4">
            {exercises && exercises.map((exercise, eIndex) => {
                 const isExerciseActive = activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex === eIndex;
                 const exerciseName = form.getValues(`blocks.${blockIndex}.exercises.${eIndex}.name`) || 'Untitled Exercise';
                 return (
                    <li key={exercise.id} className="flex items-center group/item">
                        <Button
                            type="button"
                            variant={isExerciseActive ? 'secondary' : 'ghost'}
                            className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm font-normal flex-1 truncate"
                            onClick={() => {
                                setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: eIndex });
                                onCloseNav?.();
                            }}
                        >
                            {exerciseName}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100"
                            onClick={(e) => handleRemoveExercise(e, eIndex)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </li>
                 )
            })}
             <li>
                <Button type="button" variant="link" size="sm" className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm font-normal" onClick={handleAddExercise}>
                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                </Button>
            </li>
         </ul>
    )
};


type BlockNavItemProps = {
    blockIndex: number;
    blockId: string;
}

const BlockNavItem = ({ blockIndex, blockId }: BlockNavItemProps) => {
    const { form, activeSelection, setActiveSelection, onCloseNav, removeBlock } = useRoutineCreator();
    
    const blockName = form.watch(`blocks.${blockIndex}.name`);
    const blockSets = form.watch(`blocks.${blockIndex}.sets`);
    const exercises = form.watch(`blocks.${blockIndex}.exercises`);
    
    const isBlockActive = activeSelection.blockIndex === blockIndex;

    const handleSelect = () => {
        setActiveSelection({ type: 'block', blockIndex });
        onCloseNav?.();
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeBlock(blockIndex);
    };

    return (
        <div key={blockId}>
            <div className="group/block flex items-center rounded-md cursor-pointer">
                <div
                    className={cn(
                        'flex-1 justify-start text-left h-auto py-2 px-3 rounded-md',
                        isBlockActive && activeSelection.type === 'block' ? 'bg-secondary' : 'bg-transparent hover:bg-muted/50'
                    )}
                    onClick={handleSelect}
                >
                    <div className="flex-1">
                        <p className="font-semibold">{blockName || 'Untitled Block'}</p>
                        <p className="text-xs text-muted-foreground">{blockSets} sets &bull; {exercises?.length || 0} exercises</p>
                    </div>
                </div>
                {(form.getValues('blocks').length > 1) && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover/block:opacity-100"
                        onClick={handleRemove}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {isBlockActive && (
                <ExercisesNavList 
                    blockIndex={blockIndex}
                />
            )}
        </div>
    );
};


export function RoutineCreatorNav() {
  const { 
    blockFields,
    appendBlock,
    setActiveSelection, 
  } = useRoutineCreator();

  const handleAddBlock = () => {
    const newBlockIndex = blockFields.length;
    appendBlock({ name: `Block ${newBlockIndex + 1}`, sets: '4', exercises: [] });
    setActiveSelection({ type: 'block', blockIndex: newBlockIndex });
  };
  
  return (
    <div className="h-full flex flex-col p-2 bg-card rounded-lg border">
      <div className="flex-grow overflow-y-auto pr-1 space-y-1">
        {blockFields.map((block, bIndex) => (
            <BlockNavItem 
                key={block.id}
                blockIndex={bIndex}
                blockId={block.id}
            />
        ))}
      </div>
      <div className="pt-2 border-t mt-2">
        <Button type="button" variant="outline" className="w-full" onClick={handleAddBlock}>
          <Plus className="mr-2 h-4 w-4" />
          Add Block
        </Button>
      </div>
    </div>
  );
}
