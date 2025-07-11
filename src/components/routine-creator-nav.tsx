
'use client';

import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoutineCreator, defaultExerciseValues } from './coach-routine-creator';

export function RoutineCreatorNav() {
  const { form, activeSelection, setActiveSelection, onCloseNav } = useRoutineCreator();
  const { control } = form;
  
  const { fields: blockFields, append: appendBlock, remove: removeBlock } = useFieldArray({
    control,
    name: 'blocks',
  });

  const handleAddBlock = () => {
    const newBlockIndex = blockFields.length;
    appendBlock({ name: `Block ${newBlockIndex + 1}`, sets: '3', exercises: [] });
    setActiveSelection({ type: 'block', blockIndex: newBlockIndex });
  };
  
  const handleRemoveBlock = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    removeBlock(index);
    if (activeSelection.blockIndex === index) {
      setActiveSelection({ type: 'block', blockIndex: Math.max(0, index - 1) });
    } else if (activeSelection.blockIndex > index) {
       setActiveSelection({ ...activeSelection, blockIndex: activeSelection.blockIndex - 1 });
    }
  }

  const handleSelect = (selection: { type: 'block' | 'exercise'; blockIndex: number; exerciseIndex?: number }) => {
    setActiveSelection(selection);
    onCloseNav?.();
  };
  
  const ExercisesNavList = ({ blockIndex }: { blockIndex: number }) => {
    const { control } = useRoutineCreator().form;
    const { fields, append, remove } = useFieldArray({
      control,
      name: `blocks.${blockIndex}.exercises`,
    });
    
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
        // If the deleted exercise was the active one, fallback to block view
        if (activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex === exerciseIndex) {
            setActiveSelection({ type: 'block', blockIndex });
        } else if (activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex && activeSelection.exerciseIndex > exerciseIndex) {
            setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: activeSelection.exerciseIndex - 1});
        }
    };
    
    return (
        <ul className="pl-6 pr-2 py-1 space-y-1 mt-1 border-l-2 ml-4">
            {fields.map((exercise, eIndex) => {
                 const isExerciseActive = activeSelection.type === 'exercise' && activeSelection.blockIndex === blockIndex && activeSelection.exerciseIndex === eIndex;
                 return (
                    <li key={exercise.id} className="flex items-center group/item">
                        <Button
                            variant={isExerciseActive ? 'secondary' : 'ghost'}
                            className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm font-normal flex-1"
                            onClick={() => handleSelect({ type: 'exercise', blockIndex, exerciseIndex: eIndex })}
                        >
                            {(exercise as any).name || 'Untitled Exercise'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
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
  }


  return (
    <div className="h-full flex flex-col p-2 bg-card rounded-lg border">
      <div className="flex-grow overflow-y-auto pr-1 space-y-1">
        {blockFields.map((block, bIndex) => {
          const isBlockActive = activeSelection.blockIndex === bIndex;
          const exercises = (block as any).exercises || [];

          return (
            <div key={block.id}>
              <div
                className="group/block flex items-center rounded-md cursor-pointer"
              >
                 <div
                    className={cn(
                        'flex-1 justify-start text-left h-auto py-2 px-3 rounded-md',
                        isBlockActive && activeSelection.type === 'block' ? 'bg-secondary' : 'bg-transparent hover:bg-muted/50'
                    )}
                    onClick={() => handleSelect({ type: 'block', blockIndex: bIndex })}
                >
                    <div className="flex-1">
                        <p className="font-semibold">{block.name || 'Untitled Block'}</p>
                        <p className="text-xs text-muted-foreground">{block.sets} sets &bull; {exercises.length || 0} exercises</p>
                    </div>
                </div>
                {blockFields.length > 1 && (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleRemoveBlock(e, bIndex)}
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                )}
              </div>
              {isBlockActive && <ExercisesNavList blockIndex={bIndex} />}
            </div>
          );
        })}
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
