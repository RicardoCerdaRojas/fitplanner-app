
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoutineCreator } from './coach-routine-creator';
import { StepperInput } from './ui/stepper-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { Separator } from './ui/separator';


function RoutineDetailsForm() {
    const { form, members, routineTypes } = useRoutineCreator();
    const { control } = form;

    return (
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
    );
}

function BlockForm({ blockIndex }: { blockIndex: number }) {
    const { form, removeBlock } = useRoutineCreator();
    const { control } = form;
    
    return (
        <Card className="bg-muted/30">
             <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <FormField control={control} name={`blocks.${blockIndex}.name`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">Block Name</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="e.g., Warm-up" 
                                    className="text-xl font-bold border-none shadow-none -ml-3 p-0 focus-visible:ring-0 h-auto bg-transparent focus:bg-muted/50 rounded-md px-2" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage className="ml-2" />
                        </FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBlock(blockIndex)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="w-5 h-5"/>
                    </Button>
                </div>

                <div className="space-y-6">
                    <FormField control={control} name={`blocks.${blockIndex}.sets`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold text-card-foreground">Sets</FormLabel>
                            <FormControl>
                                <StepperInput field={field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <Separator className="my-6" />

                    <p className="text-sm text-muted-foreground text-center">
                        Select an exercise from the left panel to edit its details.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

function ExerciseForm({ blockIndex, exerciseIndex }: { blockIndex: number, exerciseIndex: number }) {
    const { form, removeExercise } = useRoutineCreator();
    const { control, watch } = form;
    
    return (
        <Card>
            <CardHeader className='pb-4 flex flex-row items-center justify-between'>
                 <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`} render={({ field }) => (
                    <FormItem className='flex-1'>
                        <FormLabel className="sr-only">Exercise Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Exercise Name" className="text-xl font-bold border-none shadow-none focus-visible:ring-0 pl-2 pr-2 h-auto bg-transparent focus:bg-muted/50 rounded-md" {...field} />
                        </FormControl>
                        <FormMessage className="pl-2" />
                    </FormItem>
                )} />
                 <Button type="button" variant="ghost" size="icon" onClick={() => removeExercise(blockIndex, exerciseIndex)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-5 h-5"/></Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`} render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Reps or Duration?</FormLabel>
                        <FormControl>
                            <div className="flex gap-2 p-1 bg-muted rounded-md">
                                <Button type="button" variant={field.value === 'reps' ? 'default' : 'outline'} onClick={() => { form.setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`, 'reps');}} className="flex-1 shadow-sm h-9">Reps</Button>
                                <Button type="button" variant={field.value === 'duration' ? 'default' : 'outline'} onClick={() => { form.setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`, 'duration');}} className="flex-1 shadow-sm h-9">Duration</Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`) === 'reps' ? (
                        <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reps</FormLabel>
                                <FormControl>
                                    <Input placeholder='e.g., 8-12' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    ) : (
                        <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`} render={({ field }) => (
                             <FormItem>
                                <FormLabel>Duration</FormLabel>
                                <FormControl>
                                    <Input placeholder='e.g., 30s' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Weight</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Bodyweight or 50" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.videoUrl`} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Example Video URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://example.com/video.mp4" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
        </Card>
    )
}

export function RoutineCreatorForm() {
    const { activeSelection } = useRoutineCreator();
    
    return (
        <div className="w-full h-full">
            {activeSelection.type === 'details' && <RoutineDetailsForm />}
            {activeSelection.type === 'block' && <BlockForm blockIndex={activeSelection.index} />}
            {activeSelection.type === 'exercise' && <ExerciseForm blockIndex={activeSelection.blockIndex} exerciseIndex={activeSelection.exerciseIndex} />}
        </div>
    );
}
