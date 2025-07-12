'use client';

import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoutineCreator, defaultExerciseValues } from './coach-routine-creator';
import { useFieldArray, type Control, type UseFormGetValues, type UseFormReturn } from 'react-hook-form';
import type { RoutineFormValues } from './coach-routine-creator';

type ExercisesNavListProps = {
    blockIndex: number;
    form: UseFormReturn<RoutineFormValues>;
    setActiveSelection: React.Dispatch<React.SetStateAction<{ type: 'block' | 'exercise'; blockIndex: number; exerciseIndex?: number; }>>;
    onCloseNav?: () => void;
};

const ExercisesNavList = ({ blockIndex, form, setActiveSelection, onCloseNav }: ExercisesNavListProps) => {
    const { control, watch } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: `blocks.${blockIndex}.exercises`
    });

    // Watch the exercises for this block to trigger re-renders
    const watchedExercises = watch(`blocks.${blockIndex}.exercises`);

    const handleAddExercise = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newExerciseIndex = fields.length;
        append(defaultExerciseValues);
        setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: newExerciseIndex });
        onCloseNav?.();
    };

    const handleRemoveExercise = (e: React.MouseEvent, exerciseIndex: number) => {
        e.stopPropagation();
        remove(exerciseIndex);
        setActiveSelection({ type: 'block', blockIndex });
    };

    const { activeSelection } = useRoutineCreator();

    return (
        <ul className="pl-6 pr-2 py-1 space-y-1 mt-1 border-l-2 ml-4">
            {fields.map((exercise, eIndex) => {
                 const isExerciseActive = activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex === eIndex;
                 const exerciseName = watchedExercises?.[eIndex]?.name || 'Untitled Exercise';
                 return (
                    <li key={exercise.id} className="flex items-center group/item">
                        <Button
                            variant={isExerciseActive ? 'secondary' : 'ghost'}
                            className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm font-normal flex-1 truncate"
                            onClick={() => setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: eIndex })}
                        >
                            {exerciseName}
                        </Button>
                        <Button
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
                <Button variant="link" size="sm" className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm font-normal" onClick={handleAddExercise}>
                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                </Button>
            </li>
         </ul>
    )
};


type BlockNavItemProps = {
    blockIndex: number;
    blockId: string;
    form: UseFormReturn<RoutineFormValues>;
    canBeRemoved: boolean;
    onRemove: (index: number) => void;
}

const BlockNavItem = ({ blockIndex, blockId, form, canBeRemoved, onRemove }: BlockNavItemProps) => {
    const { activeSelection, setActiveSelection, onCloseNav } = useRoutineCreator();
    const { watch } = form;
    
    const blockName = watch(`blocks.${blockIndex}.name`);
    const blockSets = watch(`blocks.${blockIndex}.sets`);
    const exercises = watch(`blocks.${blockIndex}.exercises`);
    
    const isBlockActive = activeSelection.blockIndex === blockIndex;

    const handleSelect = () => {
        setActiveSelection({ type: 'block', blockIndex });
        onCloseNav?.();
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(blockIndex);
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
                {canBeRemoved && (
                    <Button
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
                    form={form}
                    setActiveSelection={setActiveSelection} 
                    onCloseNav={onCloseNav}
                />
            )}
        </div>
    );
};


export function RoutineCreatorNav() {
  const { 
    form,
    activeSelection, 
    setActiveSelection, 
    onCloseNav, 
  } = useRoutineCreator();

  const { control } = form;
  
  const { fields: blockFields, append: appendBlock, remove: removeBlock } = useFieldArray({
    control,
    name: 'blocks',
  });

  const handleAddBlock = () => {
    const newBlockIndex = blockFields.length;
    appendBlock({ name: `Block ${newBlockIndex + 1}`, sets: '4', exercises: [] });
    setActiveSelection({ type: 'block', blockIndex: newBlockIndex });
  };
  
  const handleRemoveBlock = (index: number) => {
    removeBlock(index);
    if (activeSelection.blockIndex === index) {
      setActiveSelection({ type: 'block', blockIndex: Math.max(0, index - 1) });
    } else if (activeSelection.blockIndex > index) {
       setActiveSelection({ ...activeSelection, blockIndex: activeSelection.blockIndex - 1 });
    }
  }

  return (
    <div className="h-full flex flex-col p-2 bg-card rounded-lg border">
      <div className="flex-grow overflow-y-auto pr-1 space-y-1">
        {blockFields.map((block, bIndex) => (
            <BlockNavItem 
                key={block.id}
                blockIndex={bIndex}
                blockId={block.id}
                form={form}
                canBeRemoved={blockFields.length > 1}
                onRemove={handleRemoveBlock}
            />
        ))}
      </div>
      <div className="pt-2 border-t mt-2">
        <Button variant="outline" className="w-full" onClick={handleAddBlock}>
          <Plus className="mr-2 h-4 w-4" />
          Add Block
        </Button>
      </div>
    </div>
  );
}
