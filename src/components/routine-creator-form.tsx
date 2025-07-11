
'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Control, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Member } from '@/app/coach/page';
import type { ManagedRoutine } from './coach-routine-management';
import type { RoutineType } from '@/app/admin/routine-types/page';
import type { RoutineFormValues } from './coach-routine-creator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Sub-components are now moved inside RoutineCreatorForm ---

export function RoutineCreatorForm({
  form,
  activeSelection,
  setActiveSelection,
  members,
  routineTypes,
  routineToEdit,
  isEditing,
  isSubmitting,
  onCancel,
}: {
  form: UseFormReturn<RoutineFormValues>;
  activeSelection: { type: 'block' | 'exercise'; blockIndex: number; exerciseIndex?: number };
  setActiveSelection: (selection: { type: 'block' | 'exercise'; blockIndex: number; exerciseIndex?: number }) => void;
  members: Member[];
  routineTypes: RoutineType[];
  routineToEdit?: ManagedRoutine | null;
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const { control } = form;
  
  const blockName = useWatch({ control, name: `blocks.${activeSelection.blockIndex}.name`});

  // --- ExerciseListItem Component Logic ---
  const ExerciseListItem = ({ control, blockIndex, exerciseIndex, onRemove }: { control: Control<RoutineFormValues>, blockIndex: number, exerciseIndex: number, onRemove: (e: React.MouseEvent) => void }) => {
      const exerciseName = useWatch({
          control,
          name: `blocks.${blockIndex}.exercises.${exerciseIndex}.name`
      });

      return (
          <div className="flex items-center justify-between p-2 rounded-md border bg-muted/50">
              <span className="font-medium truncate pr-2">{exerciseName || 'Untitled Exercise'}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={onRemove}>
                  <Trash2 className="h-4 w-4" />
              </Button>
          </div>
      );
  }

  // --- ExercisesForBlock Component Logic ---
  const ExercisesForBlock = ({ control, blockIndex }: { control: Control<RoutineFormValues>, blockIndex: number }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `blocks.${blockIndex}.exercises`,
      keyName: "id",
    });
    
    const blockName = useWatch({ control, name: `blocks.${blockIndex}.name` });

    const handleAddExercise = () => {
      const newExerciseIndex = fields.length;
      append({ name: '', repType: 'reps', reps: '12', duration: '30 seconds', weight: 'Bodyweight', videoUrl: '' });
      setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: newExerciseIndex });
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Exercises for <span className="text-primary">{blockName}</span></CardTitle>
              <CardDescription>Add or remove exercises for this block.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddExercise}><Plus className="mr-2 h-4 w-4" /> Add Exercise</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No exercises added yet. Click "Add Exercise" to start.</p>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} onClick={() => setActiveSelection({ type: 'exercise', blockIndex, exerciseIndex: index })} className="cursor-pointer">
                <ExerciseListItem
                  control={control}
                  blockIndex={blockIndex}
                  exerciseIndex={index}
                  onRemove={(e) => { e.stopPropagation(); remove(index); setActiveSelection({ type: 'block', blockIndex }); }}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  // --- ExerciseForm Component Logic ---
  const ExerciseForm = ({ control, blockIndex, exerciseIndex }: { control: Control<RoutineFormValues>; blockIndex: number; exerciseIndex: number }) => {
    const repType = useWatch({ control, name: `blocks.${blockIndex}.exercises.${exerciseIndex}.repType` });
    const blockName = useWatch({ control, name: `blocks.${blockIndex}.name` });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Editing Exercise</CardTitle>
          <CardDescription>Define the details for this exercise within the <span className="font-semibold text-primary">{blockName}</span> block.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`} render={({ field }) => (
            <FormItem className="space-y-2"><FormLabel>Repetitions or Duration?</FormLabel>
              <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="reps" /></FormControl><FormLabel className="font-normal">Reps</FormLabel></FormItem>
                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="duration" /></FormControl><FormLabel className="font-normal">Duration</FormLabel></FormItem>
              </RadioGroup></FormControl><FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repType === 'reps' ? (
              <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`} render={({ field }) => (<FormItem><FormLabel>Reps</FormLabel><FormControl><Input placeholder="e.g., 8-12" {...field} /></FormControl><FormMessage /></FormItem>)} />
            ) : (
              <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`} render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., 45 seconds" {...field} /></FormControl><FormMessage /></FormItem>)} />
            )}
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`} render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder="e.g., 50kg or Bodyweight" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.videoUrl`} render={({ field }) => (<FormItem><FormLabel>Example Video URL</FormLabel><FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Routine' : 'Create Routine'}</CardTitle>
          <CardDescription>
            {isEditing && routineToEdit ? `Editing a routine for ${routineToEdit.userName}.` : 'Design a personalized workout session.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={control} name="memberId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  {isEditing && routineToEdit ? ( <FormControl><Input value={routineToEdit.userName} disabled className="font-semibold" /></FormControl>) : (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {members.map(m => (<SelectItem key={m.uid} value={m.uid}>{m.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={control} name="routineTypeId" render={({ field }) => (
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
            <FormField control={control} name="routineDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
            )} />
          </div>
        </CardContent>
      </Card>
      
      {activeSelection.type === 'block' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Editing Block: <span className="text-primary">{blockName}</span></CardTitle>
              <CardDescription>Define the name and number of sets for this block.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={control} name={`blocks.${activeSelection.blockIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Block Name</FormLabel><FormControl><Input placeholder="e.g., Upper Body Focus" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={control} name={`blocks.${activeSelection.blockIndex}.sets`} render={({ field }) => (<FormItem><FormLabel>Sets / Rounds</FormLabel><FormControl><Input placeholder="e.g., 3" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          <ExercisesForBlock
            key={activeSelection.blockIndex} 
            control={control}
            blockIndex={activeSelection.blockIndex}
          />
        </>
      )}

      {activeSelection.type === 'exercise' && activeSelection.exerciseIndex !== undefined && (
        <ExerciseForm 
          control={control}
          blockIndex={activeSelection.blockIndex}
          exerciseIndex={activeSelection.exerciseIndex}
        />
      )}

      <div className="flex justify-end items-center gap-4 pt-4 border-t">
        {isEditing && (<Button type="button" variant="outline" onClick={onCancel}>Cancel Edit</Button>)}
        <Button type="submit" size="lg" className="w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Routine' : 'Create Routine')}
        </Button>
      </div>
    </div>
  );
}
