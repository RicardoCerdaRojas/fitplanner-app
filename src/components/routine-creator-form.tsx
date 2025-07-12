
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoutineCreator } from './coach-routine-creator';
import { StepperInput } from './ui/stepper-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { Separator } from './ui/separator';
import { Switch } from '@/components/ui/switch';


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
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                 <FormField control={control} name={`blocks.${blockIndex}.name`} render={({ field }) => (
                    <FormItem className='flex-1'>
                        <FormLabel className="sr-only">Block Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Block Name" className="text-xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBlock(blockIndex)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-5 h-5"/>
                </Button>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                    <FormLabel className="font-semibold text-card-foreground">Sets</FormLabel>
                    <FormField control={control} name={`blocks.${blockIndex}.sets`} render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <StepperInput field={field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground text-center pt-4">
                    Select an exercise from the left panel to edit its details, or add a new one.
                </p>
            </CardContent>
        </Card>
    )
}

function ExerciseForm({ blockIndex, exerciseIndex }: { blockIndex: number, exerciseIndex: number }) {
    const { form, removeExercise } = useRoutineCreator();
    const { control, watch, setValue, trigger } = form;
    const repType = watch(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`);

    const handleRepTypeChange = (isDuration: boolean) => {
        const newType = isDuration ? 'duration' : 'reps';
        console.log('Switch toggled. New type will be:', newType);

        setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`, newType);
        
        if (newType === 'reps') {
            console.log('Setting values for REPS mode...');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`, '10');
            console.log('  - setting reps: 10');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`, '5');
            console.log('  - setting weight: 5');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`, '');
            console.log('  - clearing duration');
        } else { // newType === 'duration'
            console.log('Setting values for DURATION mode...');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`, '1');
            console.log('  - setting duration: 1');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`, '0');
            console.log('  - setting weight: 0');
            setValue(`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`, '');
            console.log('  - clearing reps');
        }
        
        console.log('setValue calls completed. Triggering re-validation...');
        trigger(`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`);
        trigger(`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`);
        trigger(`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`);
    }
    
    return (
        <Card>
            <CardHeader className='pb-4 flex flex-row items-center justify-between'>
                 <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`} render={({ field }) => (
                    <FormItem className='flex-1'>
                        <FormLabel className="sr-only">Exercise Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Exercise Name" className="text-xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent" {...field} />
                        </FormControl>
                        <FormMessage className="pl-2" />
                    </FormItem>
                )} />
                 <Button type="button" variant="ghost" size="icon" onClick={() => removeExercise(blockIndex, exerciseIndex)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-5 h-5"/></Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="p-4 bg-muted/30">
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.repType`} render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                            <FormLabel className={cn(
                                "font-semibold transition-all",
                                repType === 'reps' ? 'text-primary text-lg' : 'text-muted-foreground'
                            )}>Reps</FormLabel>
                            <FormControl>
                                <Switch
                                    checked={repType === 'duration'}
                                    onCheckedChange={handleRepTypeChange}
                                />
                            </FormControl>
                             <FormLabel className={cn(
                                "font-semibold transition-all",
                                repType === 'duration' ? 'text-primary text-lg' : 'text-muted-foreground'
                            )}>Duration</FormLabel>
                        </FormItem>
                    )} />
                </Card>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {repType === 'reps' ? (
                        <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reps</FormLabel>
                                <FormControl>
                                    <StepperInput field={field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    ) : (
                        <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.duration`} render={({ field }) => (
                             <FormItem>
                                <FormLabel>Duration (min)</FormLabel>
                                <FormControl>
                                    <StepperInput field={field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                    <FormField control={control} name={`blocks.${blockIndex}.exercises.${exerciseIndex}.weight`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                                <StepperInput field={field} allowText={true} step={5} />
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
