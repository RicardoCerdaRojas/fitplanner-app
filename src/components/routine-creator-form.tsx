'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, ArrowRight, Library, FilePlus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoutineCreator } from './coach-routine-creator';
import { StepperInput } from './ui/stepper-input';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MemberCombobox } from '@/components/ui/member-combobox';

export function RoutineCreatorForm() {
    const { 
        form, 
        isSubmitting, 
        isEditing,
        activeSelection, 
        setActiveSelection, 
        appendExercise, 
        members, 
        routineTypes 
    } = useRoutineCreator();

    const { control, getValues, watch } = form;
    const [step, setStep] = useState(1);
    
    const { routineTypeId, routineDate, memberId } = watch();
    const canProceed = !!routineTypeId && !!routineDate && !!memberId;
    
    // Effect to handle selection changes, especially after deletions
    useEffect(() => {
        if (activeSelection?.type === 'block') {
            setActiveSelection(prev => (prev ? { ...prev, exerciseIndex: undefined } : null));
        }
    }, [activeSelection?.blockIndex, activeSelection?.type, setActiveSelection]);

    const handleAddExerciseClick = () => {
        if (activeSelection) {
            appendExercise(activeSelection.blockIndex);
        }
    };

    if (!activeSelection) {
        return <Card><CardContent><p className="p-4 text-center">Loading block...</p></CardContent></Card>;
    }

    const allBlocks = getValues('blocks');
    const activeBlock = allBlocks?.[activeSelection.blockIndex];
    const exerciseFields = activeBlock?.exercises || [];
    const selectedRoutineTypeName = routineTypes.find(rt => rt.id === getValues('routineTypeId'))?.name;
    const selectedRoutineDate = getValues('routineDate');

    return (
        <div className="space-y-6">
            {step === 1 ? (
                // Step 1: Routine Details
                <Card>
                    <CardHeader>
                        <CardTitle>Step 1: Routine Details</CardTitle>
                        <CardDescription>Select the member, type of routine, and the date it should be performed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <FormField
                            control={control}
                            name="memberId"
                            render={({ field }) => (
                                <FormItem>
                                     <MemberCombobox members={members} value={field.value} onChange={field.onChange} />
                                     <FormMessage/>
                                </FormItem>
                         )} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                    <FormLabel>Routine Date</FormLabel>
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
                     <CardFooter className="flex justify-end">
                        <Button type="button" onClick={() => setStep(2)} disabled={!canProceed}>
                            Next: Build Routine <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                // Step 2: Build Routine
                <>
                    <Card className="bg-muted/30">
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Library className="w-5 h-5 text-primary" />
                                    <span className="font-semibold text-muted-foreground">Type:</span>
                                    <span className="font-bold">{selectedRoutineTypeName || 'Not set'}</span>
                                </div>
                                 <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                    <span className="font-semibold text-muted-foreground">Date:</span>
                                    <span className="font-bold">{selectedRoutineDate ? format(selectedRoutineDate, 'PPP') : 'Not set'}</span>
                                </div>
                            </div>
                             <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)}>Change Details</Button>
                        </CardContent>
                    </Card>
                    
                    {activeSelection.type === 'block' && activeSelection.exerciseIndex === undefined && activeBlock ? (
                        <Card>
                            <CardHeader>
                                <div className='flex justify-between items-center'>
                                    <div>
                                        <CardTitle>Editing Block: <span className="text-primary">{getValues(`blocks.${activeSelection.blockIndex}.name`)}</span></CardTitle>
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
                                    {exerciseFields && exerciseFields.length > 0 ? (
                                        exerciseFields.map((_, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                                <span>{getValues(`blocks.${activeSelection.blockIndex}.exercises.${index}.name`) || 'Untitled Exercise'}</span>
                                                <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setActiveSelection({ type: 'exercise', blockIndex: activeSelection.blockIndex, exerciseIndex: index})}
                                                >
                                                Edit
                                                </Button>
                                            </div>
                                        ))
                                     ) : (
                                        <p className="text-sm text-muted-foreground p-2 text-center">No exercises in this block yet.</p>
                                     )}
                                     <Button type="button" variant="outline" size="sm" className="w-full justify-center" onClick={handleAddExerciseClick}>
                                        <FilePlus className="mr-2 h-4 w-4" /> Add another exercise
                                    </Button>
                                  </div>
                            </CardContent>
                        </Card>
                    ) : null }

                    {activeSelection.type === 'exercise' && activeSelection.exerciseIndex !== undefined ? (
                         <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Editing Exercise</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                            <FormField control={control} name={`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} onFocus={e => e.target.select()} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.repType`} render={({ field }) => (
                                <FormItem className="space-y-2"><FormLabel>Repetitions or Duration?</FormLabel>
                                <FormControl><div className="flex gap-4">
                                    <Button type="button" variant={field.value === 'reps' ? 'default' : 'outline'} onClick={() => {
                                        form.setValue(`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.repType`, 'reps');
                                    }} className="flex-1">Reps</Button>
                                    <Button type="button" variant={field.value === 'duration' ? 'default' : 'outline'} onClick={() => {
                                        form.setValue(`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.repType`, 'duration');
                                    }} className="flex-1">Duration</Button>
                                </div></FormControl><FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {watch(`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.repType`) === 'reps' ? (
                                    <FormField control={control} name={`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.reps`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reps</FormLabel>
                                            <FormControl><StepperInput field={field} step={1} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                ) : (
                                    <FormField control={control} name={`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.duration`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (minutes)</FormLabel>
                                            <FormControl><StepperInput field={field} step={1} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                                <FormField control={control} name={`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.weight`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Weight (kg)</FormLabel>
                                        <FormControl><StepperInput field={field} step={5} allowText="Bodyweight" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={control} name={`blocks.${activeSelection.blockIndex}.exercises.${activeSelection.exerciseIndex}.videoUrl`} render={({ field }) => (<FormItem><FormLabel>Example Video URL</FormLabel><FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </CardContent>
                        </Card>
                    ): null }

                    <div className="flex justify-between items-center gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>
                        <Button type="submit" size="lg" className="w-auto" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Routine' : 'Create Routine')}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
