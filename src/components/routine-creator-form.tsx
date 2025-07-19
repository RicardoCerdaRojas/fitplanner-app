
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, GripVertical, MoreVertical, Copy, ChevronsUpDown, Pencil, Minus, Calendar as CalendarIcon, Send } from 'lucide-react';
import React, { useState, useCallback, memo } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
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
import { cn } from '@/lib/utils';
import { MemberCombobox } from './ui/member-combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Member } from '@/app/coach/page';
import type { RoutineType } from '@/app/admin/routine-types/page';


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
  
  const selectedExercise = libraryExercises.find(ex => ex.name === exerciseName);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Controller
          name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`}
          control={control}
          render={({ field }) => (
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between font-semibold text-base"
            >
              {selectedExercise ? selectedExercise.name : "Select an exercise..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
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

function Stepper({ value, onChange }: { value: string, onChange: (value: string) => void }) {
    const numericValue = parseInt(value, 10) || 0;

    const onIncrement = () => onChange(String(numericValue + 1));
    const onDecrement = () => onChange(String(Math.max(1, numericValue - 1)));
    
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
  const { control, watch } = useFormContext<RoutineFormValues>();
  const setsValue = watch(`blocks.${blockIndex}.sets`);

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
       <Controller
          name={`blocks.${blockIndex}.sets`}
          control={control}
          render={({ field }) => (
              <Stepper value={field.value} onChange={field.onChange} />
          )}
      />
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
      </DialogTrigger>
    </div>
  );
}

function ExerciseSheet({
    isOpen,
    onOpenChange,
    blockIndex,
    exerciseIndex
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    blockIndex: number;
    exerciseIndex: number;
}) {
    const { control, watch, handleSubmit } = useFormContext<RoutineFormValues>();
    const repType = watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`);
    
    const onSubmit = () => {
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
                        <p className="font-semibold text-lg">{watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.name`)}</p>
                        
                        <FormField
                            control={control}
                            name={`blocks.${blockIndex}.exercises.${exerciseIndex}.description`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description / Help</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="e.g., Keep your back straight, chest up." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center justify-between">
                                <Label className={repType === 'reps' ? 'font-bold' : ''}>Reps</Label>
                                <FormField
                                    control={control}
                                    name={`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`}
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
                            <FormField
                                control={control}
                                name={`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reps</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g., 8-12" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                             <FormField
                                control={control}
                                name={`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (e.g., 30s, 1m)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g., 30s" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={control}
                            name={`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Weight (kg or text)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g., 50kg, Bodyweight" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name={`blocks.${blockIndex}.exercises.${exerciseIndex}.videoUrl`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Example Video URL</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="https://youtube.com/..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <SheetFooter>
                        <Button type="submit">Save Changes</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function RoutineDetailsSection({ members, routineTypes }: { members: Member[], routineTypes: RoutineType[] }) {
    const { control } = useFormContext<RoutineFormValues>();
    const [calendarOpen, setCalendarOpen] = React.useState(false);

    const handleDateSelect = (date: Date | undefined) => {
        if(control && date) {
          control.setValue('details.routineDate', date);
        }
        if (date) {
            setCalendarOpen(false);
        }
    }
    
    return (
        <div className="space-y-6">
            <FormField control={control} name="details.memberId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Member</FormLabel>
                    <MemberCombobox members={members} value={field.value ?? ''} onChange={field.onChange} />
                    <FormMessage/>
                </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={control} name="details.routineTypeId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Routine Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {routineTypes.map(rt => (<SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="details.routineDate" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Routine Date</FormLabel>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={handleDateSelect} initialFocus /></PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        </div>
    );
}

// --- MAIN FORM COMPONENT ---
export function RoutineCreatorForm({ 
    libraryExercises, 
    members, 
    routineTypes, 
    isSubmitting,
    onFormSubmit,
    isTemplateMode
}: { 
    libraryExercises: LibraryExercise[],
    members: Member[],
    routineTypes: RoutineType[],
    isSubmitting: boolean,
    onFormSubmit: () => void,
    isTemplateMode: boolean
}) {
    const { control, getValues, setValue } = useFormContext<RoutineFormValues>();
    const { fields, append, remove, insert } = useFieldArray({
        control,
        name: "blocks",
    });
    
    const [editingExercise, setEditingExercise] = useState<{ blockIndex: number; exerciseIndex: number } | null>(null);

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
        const updatedExercises = [...currentExercises];
        updatedExercises.splice(exerciseIndex, 1);
        setValue(`blocks.${blockIndex}.exercises`, updatedExercises);
    };

    const handleAddExercise = (blockIndex: number) => {
        const currentExercises = getValues(`blocks.${blockIndex}.exercises`);
        setValue(`blocks.${blockIndex}.exercises`, [...currentExercises, { ...defaultExerciseValues }])
    };

    return (
        <div className="flex-1 flex flex-col overflow-y-auto">
            <Tabs defaultValue={isTemplateMode ? "blocks" : "details"} className="flex-grow flex flex-col h-full">
                <TabsList className={cn("w-full rounded-none justify-start px-4 flex-shrink-0", isTemplateMode && "hidden")}>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="blocks">Blocks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="flex-grow p-4 md:p-6 overflow-y-auto pb-24">
                    <RoutineDetailsSection members={members} routineTypes={routineTypes} />
                </TabsContent>

                <TabsContent value="blocks" className="flex-grow bg-muted/30 p-4 md:p-6 overflow-y-auto pb-24">
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
                                   {getValues(`blocks.${index}.exercises`)?.map((exercise: ExerciseFormValues, exIndex: number) => (
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
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => setEditingExercise({ blockIndex: index, exerciseIndex: exIndex })}>
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
                        
                        {editingExercise && (
                            <ExerciseSheet 
                                isOpen={!!editingExercise}
                                onOpenChange={(isOpen) => !isOpen && setEditingExercise(null)}
                                blockIndex={editingExercise.blockIndex}
                                exerciseIndex={editingExercise.exerciseIndex}
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
             <div className="flex-shrink-0 p-4 bg-background border-t">
                <Button onClick={onFormSubmit} size="lg" className={cn("w-full", isTemplateMode && "hidden")} disabled={isSubmitting}>
                    <Send className="mr-2 h-5 w-5" />
                    <span className="text-lg">
                        {isSubmitting ? 'Assigning...' : (isTemplateMode ? 'Update Routine' : 'Assign to Member')}
                    </span>
                </Button>
            </div>
        </div>
    );
}

    