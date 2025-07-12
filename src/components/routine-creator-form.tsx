'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Plus, Trash2, Library, FilePlus, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoutineCreator } from './coach-routine-creator';
import { StepperInput } from './ui/stepper-input';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function ExerciseForm({ blockIndex, exerciseIndex, onDone }: { blockIndex: number, exerciseIndex: number, onDone: () => void }) {
    const { form, removeExercise } = useRoutineCreator();
    const { control, watch } = form;
    
    const handleRemove = () => {
        removeExercise(blockIndex, exerciseIndex);
        onDone();
    };

    return (
        <div className="space-y-4 p-4 border bg-muted/50 rounded-lg relative">
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Exercise Name</FormLabel><FormControl><Input placeholder="e.g., Bench Press" {...field} onFocus={e => e.target.select()} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`} render={({ field }) => (
                <FormItem className="space-y-2"><FormLabel>Reps or Duration?</FormLabel>
                <FormControl><div className="flex gap-4">
                    <Button type="button" variant={field.value === 'reps' ? 'default' : 'outline'} onClick={() => { form.setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`, 'reps');}} className="flex-1">Reps</Button>
                    <Button type="button" variant={field.value === 'duration' ? 'default' : 'outline'} onClick={() => { form.setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`, 'duration');}} className="flex-1">Duration</Button>
                </div></FormControl><FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`) === 'reps' ? (
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`} render={({ field }) => (<FormItem><FormLabel>Reps</FormLabel><FormControl><StepperInput field={field} step={1} /></FormControl><FormMessage /></FormItem>)} />
                ) : (
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`} render={({ field }) => (<FormItem><FormLabel>Duration (min)</FormLabel><FormControl><StepperInput field={field} step={1} /></FormControl><FormMessage /></FormItem>)} />
                )}
                <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`} render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><FormControl><StepperInput field={field} step={5} allowText="Bodyweight" /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.videoUrl`} render={({ field }) => (<FormItem><FormLabel>Example Video URL</FormLabel><FormControl><Input placeholder="https://example.com/video.mp4" {...field} /></FormControl><FormMessage /></FormItem>)} />

             <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleRemove}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Exercise
                </Button>
                <Button type="button" onClick={onDone}>Done</Button>
            </div>
        </div>
    )
}


function RoutineBlock({ blockIndex }: { blockIndex: number }) {
    const { form, removeBlock, appendExercise } = useRoutineCreator();
    const { control, watch } = form;
    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

    const exercises = watch(`blocks.${blockIndex}.exercises`);
    
    const handleAddNewExercise = () => {
        appendExercise(blockIndex);
        setEditingExerciseIndex(exercises.length);
    }

    if (editingExerciseIndex !== null) {
        return <ExerciseForm blockIndex={blockIndex} exerciseIndex={editingExerciseIndex} onDone={() => setEditingExerciseIndex(null)} />
    }

    return (
        <Card className="bg-card">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                     <FormField control={control} name={`blocks.${blockIndex}.name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="sr-only">Block Name</FormLabel><FormControl><Input placeholder="e.g., Upper Body Focus" className="text-xl font-bold border-none shadow-none -ml-3 p-0 focus-visible:ring-0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBlock(blockIndex)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></Button>
                </div>
                 <FormField control={control} name={`blocks.${blockIndex}.sets`} render={({ field }) => (<FormItem><FormLabel className="sr-only">Sets</FormLabel><FormControl><Input placeholder="e.g., 3 Sets" className="text-sm text-muted-foreground border-none shadow-none -ml-3 p-0 h-auto focus-visible:ring-0" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardHeader>
            <CardContent className="space-y-2">
                {exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="flex justify-between items-center p-3 rounded-md border bg-muted/30">
                        <div className="font-semibold">{exercise.name}</div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingExerciseIndex(exIndex)}>Edit</Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" className="w-full" onClick={handleAddNewExercise}>
                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                </Button>
            </CardContent>
        </Card>
    )
}

export function RoutineCreatorForm() {
    const { form, isSubmitting, isEditing, members, routineTypes, blockFields, appendBlock } = useRoutineCreator();
    const { control, watch } = form;

    const { routineTypeId, routineDate, memberId } = watch();
    const canProceed = !!routineTypeId && !!routineDate && !!memberId;
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Routine Details</CardTitle>
                    <CardDescription>Select the member, type of routine, and the date it should be performed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={control} name="memberId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Member</FormLabel>
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
            </Card>

            <Tabs defaultValue="scratch">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="scratch"><FilePlus className="mr-2"/>Create from Scratch</TabsTrigger>
                    <TabsTrigger value="template" disabled><Library className="mr-2"/>Use Template (Coming Soon)</TabsTrigger>
                </TabsList>
                <TabsContent value="scratch" className="space-y-4 pt-4">
                     {blockFields.map((field, index) => (
                        <RoutineBlock key={field.id} blockIndex={index} />
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={() => appendBlock({ name: `Block ${blockFields.length + 1}`, sets: '3', exercises: []})}>
                        <Plus className="mr-2 h-4 w-4" /> Add Block
                    </Button>
                </TabsContent>
                <TabsContent value="template">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p>Feature coming soon!</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" size="lg" className="w-auto" disabled={isSubmitting || !canProceed}>
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update Routine' : 'Create Routine')}
                </Button>
            </div>
        </div>
    );
}