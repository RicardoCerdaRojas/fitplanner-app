
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, GripVertical, MoreVertical, Copy, Pencil, Minus, Info } from 'lucide-react';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Controller, useFieldArray, useFormContext, type FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { defaultExerciseValues } from './coach-routine-creator';
import type { RoutineFormValues, BlockFormValues, ExerciseFormValues } from './coach-routine-creator';
import type { LibraryExercise } from '@/app/admin/exercises/page';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';
import { z } from 'zod';


function ExerciseCombobox({
  blockIndex,
  exerciseIndex,
  libraryExercises
}: {
  blockIndex: number;
  exerciseIndex: number;
  libraryExercises: LibraryExercise[];
}) {
  const { control, setValue, watch } = useFormContext<RoutineFormValues>();
  const [open, setOpen] = useState(false);
  const exerciseName = watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.name`);

  const handleSelect = (exercise: LibraryExercise) => {
    setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.name`, exercise.name);
    setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.description`, exercise.description || '');
    setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.videoUrl`, exercise.videoUrl || '');
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Controller
          name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`}
          control={control}
          render={({ field }) => (
             <Input 
                {...field}
                placeholder="Type or select an exercise..."
                className="font-semibold text-base border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent w-full"
            />
          )}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search exercises..." className="h-9" />
          <CommandList>
            <CommandEmpty>No exercise found.</CommandEmpty>
            <CommandGroup>
              {libraryExercises.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.name}
                  onSelect={() => handleSelect(exercise)}
                >
                  {exercise.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


// New, robust stepper component
function Stepper({ value, onIncrement, onDecrement }: { value: string, onIncrement: () => void, onDecrement: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={onDecrement}>
        <Minus className="h-4 w-4" />
      </Button>
      <div className="h-9 w-12 text-center font-bold flex items-center justify-center text-lg">{value}</div>
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={onIncrement}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}


function EditableBlockHeader({
  blockIndex,
}: {
  blockIndex: number,
}) {
  const { control, watch, setValue } = useFormContext<RoutineFormValues>();
  const block = watch(`blocks.${blockIndex}`);

  const handleUpdate = (field: keyof BlockFormValues, value: any) => {
    setValue(`blocks.${blockIndex}.${field}`, value);
  };

  const handleIncrementSets = () => {
    const currentSets = parseInt(block.sets, 10) || 0;
    handleUpdate('sets', String(currentSets + 1));
  };
    
  const handleDecrementSets = () => {
    const currentSets = parseInt(block.sets, 10) || 0;
    if (currentSets > 1) {
        handleUpdate('sets', String(currentSets - 1));
    }
  };


  return (
    <div className="flex flex-row items-center justify-between bg-muted p-2 md:p-3 rounded-t-xl">
      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />
      <Controller
        name={`blocks.${blockIndex}.name`}
        control={control}
        render={({ field }) => (
            <Input 
                {...field}
                className="text-lg font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent flex-1 mx-2"
            />
        )}
      />
      
      <div className="flex items-center gap-1 md:gap-2">
         <Stepper 
            value={block.sets}
            onIncrement={handleIncrementSets}
            onDecrement={handleDecrementSets}
         />
         <DialogTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
         </DialogTrigger>
      </div>
    </div>
  );
}

const exerciseSchema = z.object({
  name: z.string().min(2, 'Exercise name is required.'),
  description: z.string().optional(),
  repType: z.enum(['reps', 'duration']),
  reps: z.string().optional(),
  duration: z.string().optional(),
  weight: z.string().optional(),
  videoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.repType === 'reps' && (!data.reps || data.reps.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reps are required.", path: ['reps'] });
    }
    if (data.repType === 'duration' && (!data.duration || data.duration.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration is required.", path: ['duration'] });
    }
});


function ExerciseSheet({
    exercise,
    isOpen,
    onOpenChange,
    onSave,
}: {
    exercise: ExerciseFormValues | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (updatedExercise: ExerciseFormValues) => void;
}) {
    const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<ExerciseFormValues>({
         resolver: zodResolver(exerciseSchema),
         defaultValues: exercise || defaultExerciseValues,
    });
    const repType = watch('repType');

    useEffect(() => {
        if (exercise) {
            reset(exercise);
        }
    }, [exercise, reset]);
    
    if (!exercise) return null;

    const onSubmit = (data: FieldValues) => {
        onSave(data as ExerciseFormValues);
        onOpenChange(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-lg">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <SheetHeader className="text-left">
                        <SheetTitle>Edit Exercise Details</SheetTitle>
                        <SheetDescription>Make changes to your exercise here. Click save when you're done.</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <p className="font-semibold text-lg">{watch('name')}</p>
                        
                        <div>
                            <Label>Description / Help</Label>
                            <Textarea {...register('description')} placeholder="e.g., Keep your back straight, chest up." />
                        </div>
                        
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center justify-between">
                                <Label className={repType === 'reps' ? 'font-bold' : ''}>Reps</Label>
                                <Controller
                                    name="repType"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value === 'duration'}
                                            onCheckedChange={(checked) => field.onChange(checked ? 'duration' : 'reps')}
                                        />
                                    )}
                                />
                                <Label className={repType === 'duration' ? 'font-bold' : ''}>Duration</Label>
                            </div>
                        </div>

                        {repType === 'reps' ? (
                            <div>
                                <Label>Reps</Label>
                                <Input {...register('reps')} placeholder="e.g., 8-12" />
                            </div>
                        ) : (
                             <div>
                                <Label>Duration (e.g., 30s, 1m)</Label>
                                <Input {...register('duration')} placeholder="e.g., 30s" />
                            </div>
                        )}
                        <div>
                            <Label>Weight (kg or text)</Label>
                            <Input {...register('weight')} placeholder="e.g., 50kg, Bodyweight" />
                        </div>
                        <div>
                            <Label>Example Video URL</Label>
                            <Input {...register('videoUrl')} placeholder="https://youtube.com/..." />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button type="submit">Save Changes</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

// --- MAIN FORM COMPONENT ---
export function RoutineCreatorForm({ libraryExercises }: { libraryExercises: LibraryExercise[] }) {
    const { control, getValues, setValue } = useFormContext<RoutineFormValues>();
    const { fields, append, remove, insert } = useFieldArray({
        control,
        name: "blocks",
    });
    
    const [editingExercise, setEditingExercise] = useState<{ blockIndex: number; exerciseIndex: number; exercise: ExerciseFormValues } | null>(null);

    const onSaveExercise = (updatedExercise: ExerciseFormValues) => {
        if (!editingExercise) return;
        setValue(`blocks.${editingExercise.blockIndex}.exercises.${editingExercise.exerciseIndex}`, updatedExercise);
        setEditingExercise(null);
    };

    const onAddBlock = () => {
        append({ id: crypto.randomUUID(), name: `Block ${fields.length + 1}`, sets: '4', exercises: [] });
    };

    const onRemoveBlock = (index: number) => {
        remove(index);
    };
    
    const onDuplicateBlock = (index: number) => {
        const blockToDuplicate = getValues(`blocks.${index}`);
        insert(index + 1, { ...blockToDuplicate, id: crypto.randomUUID() });
    };

    const onRemoveExercise = (blockIndex: number, exerciseIndex: number) => {
        const currentExercises = getValues(`blocks.${blockIndex}.exercises`);
        currentExercises.splice(exerciseIndex, 1);
        setValue(`blocks.${blockIndex}.exercises`, currentExercises);
    };

    const handleAddExercise = (blockIndex: number) => {
        const currentExercises = getValues(`blocks.${blockIndex}.exercises`);
        setValue(`blocks.${blockIndex}.exercises`, [...currentExercises, { ...defaultExerciseValues }])
    };


    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
              <Dialog key={field.id}>
                <div className="bg-card rounded-xl border">
                    <EditableBlockHeader blockIndex={index} />
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Block Actions</DialogTitle>
                            <DialogDescription>
                                Perform actions on the "{getValues(`blocks.${index}.name`)}" block.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-2 py-4">
                           <DialogClose asChild>
                             <Button variant="outline" onClick={() => onDuplicateBlock(index)}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate Block
                              </Button>
                           </DialogClose>
                            <DialogClose asChild>
                              <Button variant="destructive" onClick={() => onRemoveBlock(index)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Block
                              </Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                    <div className="p-3 space-y-2">
                       {getValues(`blocks.${index}.exercises`).map((exercise: ExerciseFormValues, exIndex: number) => (
                           <div 
                                key={exIndex}
                                className="flex items-center gap-2 p-2 rounded-md border bg-background group"
                           >
                                <div className="flex-1 cursor-pointer">
                                    <ExerciseCombobox 
                                      blockIndex={index} 
                                      exerciseIndex={exIndex}
                                      libraryExercises={libraryExercises}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1 px-1">
                                        {exercise.repType === 'reps' ? `${exercise.reps} reps` : `${exercise.duration}`}
                                        {exercise.weight && ` / ${exercise.weight}`}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => setEditingExercise({ blockIndex: index, exerciseIndex: exIndex, exercise })}>
                                    <Pencil className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); onRemoveExercise(index, exIndex); }}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                           </div>
                       ))}
                       <Button variant="outline" className="w-full" onClick={() => handleAddExercise(index)}>
                         <Plus className="mr-2 h-4 w-4" /> Add Exercise
                       </Button>
                    </div>
                </div>
              </Dialog>
            ))}

            <Button variant="secondary" className="w-full" onClick={onAddBlock}>
                <Plus className="mr-2 h-4 w-4" /> Add New Block
            </Button>

            <ExerciseSheet 
                isOpen={!!editingExercise}
                onOpenChange={(isOpen) => !isOpen && setEditingExercise(null)}
                exercise={editingExercise?.exercise ?? null}
                onSave={onSaveExercise}
            />
        </div>
    );
}
