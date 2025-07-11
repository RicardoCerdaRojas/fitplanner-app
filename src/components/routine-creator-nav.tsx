'use client';

import { useFieldArray, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoutineCreator } from './coach-routine-creator';

export function RoutineCreatorNav() {
  const { form, activeSelection, setActiveSelection, onCloseNav } = useRoutineCreator();
  const { control } = form;
  
  const { fields: blockFields, append: appendBlock, remove: removeBlock } = useFieldArray({
    control,
    name: 'blocks',
  });

  const watchedBlocks = useWatch({ control, name: 'blocks' });

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

  return (
    <div className="h-full flex flex-col p-2 bg-card rounded-lg border">
      <div className="flex-grow overflow-y-auto pr-1 space-y-1">
        {blockFields.map((block, bIndex) => {
          const exercises = watchedBlocks[bIndex]?.exercises || [];
          const isBlockActive = activeSelection.type === 'block' && activeSelection.blockIndex === bIndex;

          return (
            <div key={block.id}>
              <div
                className="group flex items-center rounded-md cursor-pointer"
                onClick={() => handleSelect({ type: 'block', blockIndex: bIndex })}
              >
                 <div
                    className={cn(
                        'w-full justify-start text-left h-auto py-2 px-3 rounded-md',
                        isBlockActive ? 'bg-secondary' : 'bg-transparent hover:bg-muted/50'
                    )}
                >
                    <div className="flex-1">
                        <p className="font-semibold">{watchedBlocks[bIndex]?.name || 'Untitled Block'}</p>
                        <p className="text-xs text-muted-foreground">{watchedBlocks[bIndex]?.sets} sets &bull; {exercises.length} exercises</p>
                    </div>
                </div>
                {blockFields.length > 1 && (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleRemoveBlock(e, bIndex)}
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                )}
              </div>
              
              {exercises.length > 0 && (
                 <ul className="pl-6 pr-2 py-1 space-y-1 mt-1 border-l-2 ml-4">
                    {exercises.map((exercise, eIndex) => {
                         const isExerciseActive = activeSelection.type === 'exercise' && activeSelection.blockIndex === bIndex && activeSelection.exerciseIndex === eIndex;
                         return (
                            <li key={`${block.id}-${eIndex}`}>
                                 <Button
                                    variant={isExerciseActive ? 'secondary' : 'ghost'}
                                    className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm font-normal"
                                    onClick={() => handleSelect({ type: 'exercise', blockIndex: bIndex, exerciseIndex: eIndex })}
                                >
                                    {exercise.name || 'Untitled Exercise'}
                                </Button>
                            </li>
                         )
                    })}
                 </ul>
              )}
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
