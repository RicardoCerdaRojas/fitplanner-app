'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoutineCreator, defaultExerciseValues } from './coach-routine-creator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepperInput } from './ui/stepper-input';
import { useFieldArray } from 'react-hook-form';
import { useEffect } from 'react';

const ExerciseForm = ({ blockIndex, exerciseIndex }: { blockIndex: number; exerciseIndex: number }) => {
    const { form } = useRoutineCreator();
    const { control, setValue, watch } = form;
    
    const blockName = watch(`blocks.${blockIndex}.name`);
    const repType = watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`);

    const handleRepTypeChange = (value: 'reps' | 'duration') => {
        setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`, value, { shouldValidate: true });
        if (value === 'reps') {
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`, '10');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`, '5');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`, undefined);
        } else {
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`, undefined);
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`, '0');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`, '1');
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Editing Exercise</CardTitle>
                        <CardDescription>Details for this exercise in the <span className="font-semibold text-primary">{blockName}</span> block.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`} render={({ field }) => (
                <FormItem className="space-y-2"><FormLabel>Repetitions or Duration?</FormLabel>
                <FormControl><RadioGroup onValueChange={(value) => handleRepTypeChange(value as 'reps' | 'duration')} value={field.value} className="flex gap-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="reps" /></FormControl><FormLabel className="font-normal">Reps</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="duration" /></FormControl><FormLabel className="font-normal">Duration</FormLabel></FormItem>
                </RadioGroup></FormControl><FormMessage />
                </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repType === 'reps' ? (
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reps</FormLabel>
                            <FormControl><StepperInput field={field} step={1} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                ) : (
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl><StepperInput field={field} step={1} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                )}
                <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl><StepperInput field={field} step={5} allowText="Bodyweight" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.videoUrl`} render={({ field }) => (<FormItem><FormLabel>Example Video URL</FormLabel><FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
        </Card>
    );
};

export function RoutineCreatorForm() {
    const { form, activeSelection, members, routineTypes, routineToEdit, isEditing, isSubmitting, onCancel, setActiveSelection } = useRoutineCreator();
    const { control, getValues } = form;

    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
        control,
        name: `blocks.${activeSelection.blockIndex}.exercises`,
    });

    const handleAddExercise = () => {
        const newExerciseIndex = exerciseFields.length;
        appendExercise(defaultExerciseValues);
        setActiveSelection({ type: 'exercise', blockIndex: activeSelection.blockIndex, exerciseIndex: newExerciseIndex });
    };

    const blockFields = getValues('blocks');
    const activeBlock = blockFields?.[activeSelection.blockIndex];

    if (!activeBlock) {
        return null;
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
                <Card>
                    <CardHeader>
                        <div className='flex justify-between items-center'>
                            <div>
                                <CardTitle>Editing Block: <span className="text-primary">{control._getWatch(`blocks.${activeSelection.blockIndex}.name`)}</span></CardTitle>
                                <CardDescription>Define the name and number of sets for this block.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name={`blocks.${activeSelection.blockIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Block Name</FormLabel><FormControl><Input placeholder="e.g., Upper Body Focus" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`blocks.${activeSelection.blockIndex}.sets`} render={({ field }) => (<FormItem><FormLabel>Sets / Rounds</FormLabel><FormControl><Input placeholder="e.g., 3" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="space-y-2 mt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">Exercises in this block</h3>
                            {exerciseFields.map((field, index) => (
                              <div key={field.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                <span>{getValues(`blocks.${activeSelection.blockIndex}.exercises.${index}.name`) || 'Untitled Exercise'}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveSelection({ type: 'exercise', blockIndex: activeSelection.blockIndex, exerciseIndex: index })}
                                >
                                  Edit
                                </Button>
                              </div>
                            ))}
                             <Button variant="link" size="sm" className="w-full justify-start text-left h-auto py-1.5 px-0 text-sm font-normal" onClick={handleAddExercise}>
                                <Plus className="mr-2 h-4 w-4" /> Add another exercise
                            </Button>
                          </div>
                    </CardContent>
                </Card>
            )}

            {activeSelection.type === 'exercise' && activeSelection.exerciseIndex !== undefined ? (
                 <ExerciseForm 
                    key={`exercise-form-${activeSelection.blockIndex}-${activeSelection.exerciseIndex}`}
                    blockIndex={activeSelection.blockIndex}
                    exerciseIndex={activeSelection.exerciseIndex}
                />
            ) : null}

            <div className="flex justify-end items-center gap-4 pt-4 border-t">
                {isEditing && (<Button type="button" variant="outline" onClick={onCancel}>Cancel Edit</Button>)}
                <Button type="submit" size="lg" className="w-auto" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update Routine' : 'Create Routine')}
                </Button>
            </div>
        </div>
    );
}
