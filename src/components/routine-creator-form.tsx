'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus, User, ChevronsUpDown, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoutineCreator } from './coach-routine-creator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepperInput } from './ui/stepper-input';
import { useFieldArray } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { Input } from './ui/input';


const ExerciseForm = ({ blockIndex, exerciseIndex }: { blockIndex: number; exerciseIndex: number }) => {
    const { form, onAddExercise } = useRoutineCreator();
    const { control, setValue, watch } = form;
    
    const repType = watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`);

    const handleRepTypeChange = (value: 'reps' | 'duration') => {
        setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`, value, { shouldValidate: true });
        if (value === 'reps') {
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`, '10');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`, '5');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`, undefined);
        } else {
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`, '1');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`, '0');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`, undefined);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Editing Exercise</CardTitle>
                    <Button variant="outline" size="sm" onClick={onAddExercise}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Exercise
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} onFocus={e => e.target.select()} /></FormControl><FormMessage /></FormItem>)} />
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
    const { form, activeSelection, members, routineTypes, routineToEdit, isEditing, isSubmitting, onCancel, setActiveSelection, onAddExercise } = useRoutineCreator();
    const { control, getValues, watch } = form;
    
    const { fields: exerciseFields } = useFieldArray({
      control,
      name: `blocks.${activeSelection.blockIndex}.exercises`,
    });
    
    useEffect(() => {
        // When block changes, reset exercise selection to avoid showing exercise form
        setActiveSelection(prev => ({ ...prev, exerciseIndex: undefined }));
    }, [activeSelection.blockIndex, setActiveSelection]);

    const blockFields = getValues('blocks');
    const activeBlock = blockFields?.[activeSelection.blockIndex];
    
    const [accordionValue, setAccordionValue] = useState<string>('routine-details');

    const selectedMemberId = watch('memberId');
    const selectedRoutineTypeId = watch('routineTypeId');
    const selectedDate = watch('routineDate');

    const selectedMember = members.find(m => m.uid === selectedMemberId);
    const selectedRoutineType = routineTypes.find(rt => rt.id === selectedRoutineTypeId);

    if (!activeBlock) {
        return null;
    }

    const isRoutineDetailsComplete = selectedMemberId && selectedRoutineTypeId && selectedDate;

    return (
        <div className="space-y-6">
            <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue} className="w-full">
                <AccordionItem value="routine-details" className="border rounded-lg">
                    <AccordionTrigger className={cn("p-4 hover:no-underline text-lg font-semibold", !isRoutineDetailsComplete && 'text-destructive')}>
                        <div className="flex items-center gap-4 w-full">
                            {isRoutineDetailsComplete ? <CheckCircle className="h-6 w-6 text-green-500"/> : <ChevronsUpDown className="h-6 w-6"/>}
                             <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm font-normal text-left">
                                {selectedMember ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6"><AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback></Avatar>
                                        <span className="font-semibold">{selectedMember.name}</span>
                                    </div>
                                ) : <span className="text-muted-foreground">Select Member</span>}
                                {selectedRoutineType && <div className="hidden sm:block w-[1px] h-4 bg-border"></div>}
                                {selectedRoutineType ? <span className="font-semibold">{selectedRoutineType.name}</span> : <span className="text-muted-foreground">Select Type</span>}
                                 {selectedDate && <div className="hidden sm:block w-[1px] h-4 bg-border"></div>}
                                {selectedDate ? <span className="font-semibold">{format(selectedDate, "PPP")}</span> : <span className="text-muted-foreground">Select Date</span>}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-2 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={control} name="memberId" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Member</FormLabel>
                                    {isEditing && routineToEdit ? (
                                        <Input value={routineToEdit.userName} disabled className="font-semibold" />
                                    ) : (
                                        <MemberCombobox members={members} value={field.value} onChange={field.onChange} />
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
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            {activeSelection.type === 'block' && activeSelection.exerciseIndex === undefined && (
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
                            {exerciseFields.length > 0 ? (
                                exerciseFields.map((field, index) => (
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
                                ))
                             ) : (
                                <p className="text-sm text-muted-foreground p-2 text-center">No exercises in this block yet.</p>
                             )}
                             <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onAddExercise()}>
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
