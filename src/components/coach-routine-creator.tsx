
'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp, doc, updateDoc, onSnapshot, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member } from '@/app/coach/page';
import type { ManagedRoutine } from './coach-routine-management';
import type { RoutineType } from '@/app/admin/routine-types/page';
import { Skeleton } from './ui/skeleton';
import { RoutineCreatorForm } from './routine-creator-form';
import { Button } from './ui/button';
import type { RoutineTemplate } from '@/app/coach/templates/page';
import { ArrowLeft, Save, MoreVertical, Library, Send } from 'lucide-react';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, useFormContext } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppHeader } from './app-header';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

const exerciseSchema = z.object({
  name: z.string().min(2, 'Exercise name is required.'),
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

const blockSchema = z.object({
    id: z.string(),
    name: z.string().min(2, 'Block name is required.'),
    sets: z.string().min(1, 'Sets are required.'),
    exercises: z.array(exerciseSchema).min(1, 'Please add at least one exercise.'),
});

const routineDetailsSchema = z.object({
  routineTypeId: z.string({ required_error: "Please select a routine type." }).min(1, 'Please select a routine type.'),
  memberId: z.string().optional(),
  routineDate: z.date().optional(),
});

const routineSchema = z.object({
  details: routineDetailsSchema,
  blocks: z.array(blockSchema).min(1, 'Please add at least one block.'),
});


export type RoutineFormValues = z.infer<typeof routineSchema>;
export type DetailsFormValues = z.infer<typeof routineDetailsSchema>;
export type BlockFormValues = z.infer<typeof blockSchema>;
export type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export const defaultExerciseValues: ExerciseFormValues = { 
  name: 'New Exercise',
  repType: 'reps' as const, 
  reps: '10', 
  duration: '',
  weight: '5', 
  videoUrl: '' 
};

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

const TemplateLoader = React.memo(({ onTemplateLoad }: { onTemplateLoad: (template: RoutineTemplate) => void }) => {
    const { toast } = useToast();
    const { activeMembership, loading: authLoading } = useAuth();
    const [templates, setTemplates] = React.useState<RoutineTemplate[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (authLoading || !activeMembership?.gymId) return;

        setIsLoading(true);
        const templatesQuery = query(
            collection(db, 'routineTemplates'),
            where('gymId', '==', activeMembership.gymId)
        );

        const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
            const fetchedTemplates = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt as Timestamp,
            } as RoutineTemplate)).sort((a, b) => a.templateName.localeCompare(b.templateName));
            setTemplates(fetchedTemplates);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching templates:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch routine templates.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [authLoading, activeMembership, toast]);
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Load from Template</DialogTitle>
                <DialogDescription>Select a previously saved template to start editing.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] -mx-6">
                <div className="px-6 py-4 space-y-2">
                {isLoading ? (
                    <p>Loading templates...</p>
                ) : templates.length > 0 ? (
                    templates.map(template => (
                        <DialogClose asChild key={template.id}>
                            <Button variant="ghost" className="w-full justify-start" onClick={() => onTemplateLoad(template)}>
                                {template.templateName}
                            </Button>
                        </DialogClose>
                    ))
                ) : (
                    <p className="text-muted-foreground">No templates found.</p>
                )}
                </div>
            </ScrollArea>
        </DialogContent>
    );
});
TemplateLoader.displayName = 'TemplateLoader';

const SaveTemplateDialog = React.memo(({ onSave, initialName }: { onSave: (name: string) => void, initialName: string }) => {
    const [name, setName] = React.useState(initialName);

    React.useEffect(() => {
        setName(initialName);
    }, [initialName]);

    const handleSave = () => {
        if(name.trim()) {
            onSave(name);
        }
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                    This routine will be saved to your library for future use. Give it a descriptive name.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., 'Beginner Full Body'"
                />
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button onClick={handleSave}>Save Template</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
});
SaveTemplateDialog.displayName = 'SaveTemplateDialog';


export default function CoachRoutineCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, activeMembership, loading: authLoading } = useAuth();

  const [members, setMembers] = React.useState<Member[]>([]);
  const [routineTypes, setRoutineTypes] = React.useState<RoutineType[]>([]);
  const [dataToEdit, setDataToEdit] = React.useState<ManagedRoutine | RoutineTemplate | null>(null);
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSaveTemplateOpen, setSaveTemplateOpen] = React.useState(false);
  
  const editRoutineId = searchParams.get('edit');
  const templateId = searchParams.get('template');
  const isEditing = !!editRoutineId || !!templateId;

  const defaultValues: RoutineFormValues = React.useMemo(() => {
    let details: DetailsFormValues;
    let blocks: BlockFormValues[];

    if (dataToEdit) {
      const isRoutine = 'memberId' in dataToEdit;
      details = {
        routineTypeId: dataToEdit.routineTypeId || '',
        memberId: isRoutine ? dataToEdit.memberId : '',
        routineDate: isRoutine ? dataToEdit.routineDate : new Date(),
      };
      blocks = dataToEdit.blocks.map(b => ({ ...b, id: crypto.randomUUID() }));
    } else {
      details = {
        routineTypeId: '',
        memberId: '',
        routineDate: new Date(),
      };
      blocks = [{ name: 'Warm-up', sets: '4', exercises: [], id: crypto.randomUUID() }];
    }
    return { details, blocks };
  }, [dataToEdit]);

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: defaultValues,
    mode: 'onBlur'
  });

  const { handleSubmit, reset } = form;

  const loadTemplate = React.useCallback((template: RoutineTemplate) => {
      reset({
          details: {
            routineTypeId: template.routineTypeId,
            memberId: '',
            routineDate: new Date(),
          },
          blocks: template.blocks.map(b => ({...b, id: crypto.randomUUID()})),
      });
      toast({title: "Template Loaded", description: `"${template.templateName}" has been loaded into the editor.`});
  }, [reset, toast]);
  
  const onFormSubmit = handleSubmit(async (data) => {
    if (!user || !activeMembership?.gymId) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a routine.' });
      return;
    }

    const { details, blocks } = data;

    if (!details.memberId || !details.routineDate) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a member and a date to assign the routine.' });
        return;
    }

    const selectedMember = members.find((a) => a.uid === details.memberId);
    if (!selectedMember) {
      toast({ variant: 'destructive', title: 'Invalid Member', description: 'Please select a member for this routine.' });
      return;
    }
    
    const selectedRoutineType = routineTypes.find((rt) => rt.id === details.routineTypeId);
    if (!selectedRoutineType) {
        toast({ variant: 'destructive', title: 'Invalid Routine Type', description: 'Please select a valid routine type.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const cleanedBlocks = blocks.map(block => {
            const { id, ...restOfBlock } = block;
            return {
                ...restOfBlock,
                exercises: block.exercises.map(exercise => {
                    const cleanedExercise: Partial<ExerciseFormValues> = { ...exercise };
                    if (cleanedExercise.repType === 'reps') delete cleanedExercise.duration;
                    else if (cleanedExercise.repType === 'duration') delete cleanedExercise.reps;
                    return cleanedExercise as ExerciseFormValues;
                })
            };
        });
        
        const routineData = {
            ...details,
            blocks: cleanedBlocks,
            routineTypeName: selectedRoutineType.name,
            userName: selectedMember.name,
            coachId: user.uid,
            gymId: activeMembership.gymId,
            routineDate: Timestamp.fromDate(details.routineDate),
            createdAt: (editRoutineId && dataToEdit && 'createdAt' in dataToEdit) ? dataToEdit.createdAt : Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        if(editRoutineId && dataToEdit) {
            const routineRef = doc(db, 'routines', dataToEdit.id);
            await updateDoc(routineRef, routineData);
            toast({ title: 'Routine Updated!', description: `The routine for ${routineData.userName} has been updated.` });
        } else {
            await addDoc(collection(db, 'routines'), routineData);
            toast({ title: 'Routine Saved!', description: `The routine for ${routineData.userName} has been saved successfully.` });
        }
      router.push('/coach');
    } catch (error: any) {
      console.error('Error saving routine:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  });

  const handleSaveAsTemplate = async (templateName: string) => {
    if (!user || !activeMembership?.gymId) {
      toast({ variant: 'destructive', title: 'Not Authenticated' });
      return;
    }

    const { details, blocks } = form.getValues();
    const selectedRoutineType = routineTypes.find((rt) => rt.id === details.routineTypeId);

    if (!selectedRoutineType) {
      toast({ variant: 'destructive', title: 'Invalid Routine Type', description: 'Please select a type for the template.' });
      return;
    }

    const cleanedBlocks = blocks.map(block => {
        const { id, ...restOfBlock } = block;
        return {
            ...restOfBlock,
            exercises: block.exercises.map(ex => {
              const cleanedEx: Partial<ExerciseFormValues> = { ...ex };
              if (cleanedEx.repType === 'reps') delete cleanedEx.duration;
              else delete cleanedEx.reps;
              return cleanedEx;
            })
        };
    });

    const dataToSave = {
      templateName,
      routineTypeId: details.routineTypeId,
      routineTypeName: selectedRoutineType.name,
      blocks: cleanedBlocks,
      gymId: activeMembership.gymId,
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, 'routineTemplates'), dataToSave);
      toast({ title: 'Template Saved!', description: `"${templateName}" is now in your library.` });
      setSaveTemplateOpen(false);
      router.push('/coach/templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };

  React.useEffect(() => {
    if(authLoading || !activeMembership?.gymId) return;

    const gymId = activeMembership.gymId;
    let membersLoaded = false;
    let typesLoaded = false;
    let editDataLoaded = !editRoutineId && !templateId;

    const checkLoadingState = () => {
        if (membersLoaded && typesLoaded && editDataLoaded) {
            setIsDataLoading(false);
        }
    };
    
    const membersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({ 
          uid: doc.id, 
          name: doc.data().name || doc.data().email,
          email: doc.data().email,
        })).filter(m => m.name) as Member[];
      setMembers(fetchedMembers);
      membersLoaded = true;
      checkLoadingState();
    });

    const typesQuery = query(collection(db, 'routineTypes'), where('gymId', '==', gymId), orderBy('name'));
    const unsubscribeTypes = onSnapshot(typesQuery, (snapshot) => {
      const fetchedTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineType));
      setRoutineTypes(fetchedTypes);
      typesLoaded = true;
      checkLoadingState();
    });

    const fetchEditData = async () => {
        let docRef;
        if (editRoutineId) docRef = doc(db, 'routines', editRoutineId);
        else if (templateId) docRef = doc(db, 'routineTemplates', templateId);
        else return;

        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const loadedData = {
                id: docSnap.id,
                ...data,
                ...((data.routineDate instanceof Timestamp) && { routineDate: data.routineDate.toDate() }),
            } as ManagedRoutine | RoutineTemplate;
            setDataToEdit(loadedData);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Item to edit not found.' });
            router.push('/coach');
          }
        } catch (e) {
            console.error(e)
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
            router.push('/coach');
        } finally {
            editDataLoaded = true;
            checkLoadingState();
        }
    };

    fetchEditData();
    
    return () => {
      unsubscribeMembers();
      unsubscribeTypes();
    };

  }, [authLoading, activeMembership, editRoutineId, templateId, router, toast, isEditing]);

  React.useEffect(() => {
      reset(defaultValues);
  }, [dataToEdit, reset, defaultValues]);
  
  if (isDataLoading || authLoading) {
      return (
        <div className="flex flex-col h-screen">
            <AppHeader />
            <div className="flex-1 p-4 space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
      )
  }

  const getInitialTemplateName = () => {
      const routineTypeId = form.getValues('details.routineTypeId');
      if (routineTypeId) {
          const routineType = routineTypes.find(rt => rt.id === routineTypeId);
          return routineType?.name || '';
      }
      return '';
  }

  return (
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
          <AppHeader />
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <h1 className="text-lg font-bold font-headline text-center">
                  {isEditing ? 'Edit Routine' : 'Create Routine'}
              </h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-9 h-9">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <Dialog>
                              <DialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Library className="mr-2 h-4 w-4" /> Load Template
                                  </DropdownMenuItem>
                              </DialogTrigger>
                              <TemplateLoader onTemplateLoad={loadTemplate} />
                         </Dialog>
                         <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSaveTemplateOpen(true); }}>
                                <Save className="mr-2 h-4 w-4" /> Save as Template
                            </DropdownMenuItem>
                         </DialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
          </div>
          
          <FormProvider {...form}>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <Tabs defaultValue="details" className="flex-grow flex flex-col h-full">
                  <TabsList className="w-full rounded-none justify-start px-4 flex-shrink-0">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="blocks">Blocks</TabsTrigger>
                  </TabsList>
                  
                      <TabsContent value="details" className="flex-grow p-4 md:p-6 overflow-y-auto pb-24">
                          <RoutineDetailsSection members={members} routineTypes={routineTypes} />
                      </TabsContent>

                      <TabsContent value="blocks" className="flex-grow bg-muted/30 p-4 md:p-6 overflow-y-auto pb-24">
                          <RoutineCreatorForm />
                      </TabsContent>
              </Tabs>
            </div>
          </FormProvider>
          
          <div className="flex-shrink-0 p-4 bg-background border-t">
              <Button onClick={onFormSubmit} size="lg" className="w-full" disabled={isSubmitting}>
                  <Send className="mr-2 h-5 w-5" />
                  <span className="text-lg">
                    {isSubmitting ? 'Assigning...' : (isEditing && editRoutineId ? 'Update Routine' : 'Assign to Member')}
                  </span>
              </Button>
          </div>
          
          <Dialog open={isSaveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
              <SaveTemplateDialog onSave={handleSaveAsTemplate} initialName={getInitialTemplateName()} />
          </Dialog>

      </div>
  );
}
