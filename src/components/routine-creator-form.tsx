

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Library, Save, Plus, GripVertical, MoreVertical, Copy, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import type { RoutineTemplate } from '@/app/coach/templates/page';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm, Controller } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { defaultExerciseValues } from './coach-routine-creator';
import type { BlockFormValues, ExerciseFormValues } from './coach-routine-creator';
import { cn } from '@/lib/utils';


function EditableBlockHeader({
  block,
  onUpdate,
  onAddExercise,
  onDuplicateBlock,
  onRemoveBlock,
}: {
  block: BlockFormValues,
  onUpdate: (field: keyof BlockFormValues, value: string) => void,
  onAddExercise: () => void,
  onDuplicateBlock: () => void,
  onRemoveBlock: () => void,
}) {
  const [isEditingSets, setIsEditingSets] = useState(false);

  const handleSetsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onUpdate('sets', isNaN(value) || value < 1 ? '1' : String(value));
    setIsEditingSets(false);
  };

  const handleSetsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex flex-row items-center justify-between bg-muted/50 p-3">
      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
      <Input 
        value={block.name} 
        onChange={(e) => onUpdate('name', e.target.value)} 
        className="text-lg font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent flex-1 mx-2"
      />
      <div className="flex items-center gap-2">
        {isEditingSets ? (
          <Input
            type="number"
            defaultValue={block.sets}
            onBlur={handleSetsBlur}
            onKeyDown={handleSetsKeyDown}
            className="w-20 text-center h-9"
            autoFocus
          />
        ) : (
          <Button
            variant="ghost"
            className="text-base font-semibold"
            onClick={() => setIsEditingSets(true)}
          >
            {block.sets} sets
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddExercise}><Plus className="mr-2 h-4 w-4" /> Add Exercise</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicateBlock}><Copy className="mr-2 h-4 w-4" /> Duplicate Block</DropdownMenuItem>
            <DropdownMenuItem onClick={onRemoveBlock} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete Block</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}


// --- DIALOGS FOR TEMPLATES ---
export function TemplateLoader({ onTemplateLoad }: { onTemplateLoad: (template: RoutineTemplate) => void }) {
    const { activeMembership } = useAuth();
    const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!activeMembership?.gymId || !open) return;
        setLoading(true);
        const q = query(collection(db, 'routineTemplates'), where('gymId', '==', activeMembership.gymId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineTemplate));
            setTemplates(fetchedTemplates);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [activeMembership, open]);

    const handleSelect = (template: RoutineTemplate) => {
        onTemplateLoad(template);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Library className="mr-2 h-4 w-4" /> Load Template</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Load Routine Template</DialogTitle>
                    <DialogDescription>Select a pre-made template to load into the editor.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-72 border rounded-md">
                    <div className="p-2 space-y-1">
                    {loading ? (
                        <div className="space-y-2 p-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                    ) : templates.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No templates found.</p>
                    ) : (
                        templates.map(template => (
                            <div key={template.id} onClick={() => handleSelect(template)} className="p-2 rounded-md hover:bg-muted cursor-pointer">
                                <p className="font-semibold">{template.templateName}</p>
                                <p className="text-sm text-muted-foreground">{template.routineTypeName}</p>
                            </div>
                        ))
                    )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export function SaveTemplateDialog({ onSave }: { onSave: (name: string) => Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');

    const handleSave = async () => {
        await onSave(name);
        setName('');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save as Template</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save New Template</DialogTitle>
                    <DialogDescription>
                        Give your new template a descriptive name so you can easily find it later.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label>Template Name</Label>
                    <Input 
                        placeholder="e.g., 'Beginner Full Body Strength'" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSave}>Save Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ExerciseFormValues>({
         defaultValues: exercise || defaultExerciseValues,
    });
    const repType = watch('repType');

    useEffect(() => {
        if (exercise) {
            setValue('name', exercise.name);
            setValue('repType', exercise.repType);
            setValue('reps', exercise.reps);
            setValue('duration', exercise.duration);
            setValue('weight', exercise.weight);
            setValue('videoUrl', exercise.videoUrl);
        }
    }, [exercise, setValue]);
    
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
                        <SheetTitle>Edit Exercise</SheetTitle>
                        <SheetDescription>Make changes to your exercise here. Click save when you're done.</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Exercise Name</Label>
                            <Input {...register('name')} placeholder="e.g., Bench Press" />
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
                                <Label>Duration (min)</Label>
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
type RoutineCreatorFormProps = {
    blocks: BlockFormValues[];
    setBlocks: React.Dispatch<React.SetStateAction<BlockFormValues[]>>;
}
export function RoutineCreatorForm({ 
    blocks,
    setBlocks,
}: RoutineCreatorFormProps) {
    const [editingExercise, setEditingExercise] = useState<{ blockId: string; exerciseIndex: number; exercise: ExerciseFormValues } | null>(null);

    const handleUpdateBlock = (blockId: string, updatedFields: Partial<BlockFormValues>) => {
      setBlocks(prev => prev.map(b => (b.id === blockId ? { ...b, ...updatedFields } : b)));
    };

    const handleAddBlock = () => {
      setBlocks(prev => [...prev, { id: crypto.randomUUID(), name: `Block ${prev.length + 1}`, sets: '4', exercises: [] }]);
    };

    const handleRemoveBlock = (blockId: string) => {
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    };

    const handleDuplicateBlock = (blockId: string) => {
      setBlocks(prev => {
        const blockToDuplicate = prev.find(b => b.id === blockId);
        if (!blockToDuplicate) return prev;
        const newBlock = { ...blockToDuplicate, id: crypto.randomUUID() };
        const index = prev.findIndex(b => b.id === blockId);
        const newBlocks = [...prev];
        newBlocks.splice(index + 1, 0, newBlock);
        return newBlocks;
      });
    };

    const handleAddExercise = (blockId: string) => {
      setBlocks(prev => prev.map(b => {
        if (b.id === blockId) {
          return { ...b, exercises: [...b.exercises, { ...defaultExerciseValues, name: `New Exercise ${b.exercises.length + 1}` }] };
        }
        return b;
      }));
    };

    const handleRemoveExercise = (blockId: string, exerciseIndex: number) => {
      setBlocks(prev => prev.map(b => {
        if (b.id === blockId) {
          const newExercises = [...b.exercises];
          newExercises.splice(exerciseIndex, 1);
          return { ...b, exercises: newExercises };
        }
        return b;
      }));
    };

    const handleSaveExercise = (blockId: string, exerciseIndex: number, updatedExercise: ExerciseFormValues) => {
      setBlocks(prev => prev.map(b => {
        if (b.id === blockId) {
          const newExercises = [...b.exercises];
          newExercises[exerciseIndex] = updatedExercise;
          return { ...b, exercises: newExercises };
        }
        return b;
      }));
    };

    const handleSaveAndCloseSheet = (updatedExercise: ExerciseFormValues) => {
        if (!editingExercise) return;
        handleSaveExercise(editingExercise.blockId, editingExercise.exerciseIndex, updatedExercise);
        setEditingExercise(null);
    };

    return (
        <div className="space-y-4">
            {blocks.map((block) => (
                <Card key={block.id} className="border-2 border-primary/10">
                    <EditableBlockHeader
                        block={block}
                        onUpdate={(field, value) => handleUpdateBlock(block.id, { [field]: value })}
                        onAddExercise={() => handleAddExercise(block.id)}
                        onDuplicateBlock={() => handleDuplicateBlock(block.id)}
                        onRemoveBlock={() => handleRemoveBlock(block.id)}
                    />
                    <CardContent className="p-3 space-y-2">
                       {block.exercises.map((exercise, exIndex) => (
                           <div 
                                key={exIndex}
                                className="flex items-center gap-2 p-2 rounded-md border bg-background group"
                                onClick={() => setEditingExercise({ blockId: block.id, exerciseIndex: exIndex, exercise })}
                           >
                                <div className="flex-1 cursor-pointer">
                                    <p className="font-semibold">{exercise.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {exercise.repType === 'reps' ? `${exercise.reps} reps` : `${exercise.duration} min`}
                                        {exercise.weight && ` / ${exercise.weight}kg`}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                    <Pencil className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveExercise(block.id, exIndex); }}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                           </div>
                       ))}
                       <Button variant="outline" className="w-full" onClick={() => handleAddExercise(block.id)}>
                         <Plus className="mr-2 h-4 w-4" /> Add Exercise
                       </Button>
                    </CardContent>
                </Card>
            ))}

            <Button variant="secondary" className="w-full" onClick={handleAddBlock}>
                <Plus className="mr-2 h-4 w-4" /> Add New Block
            </Button>

            <ExerciseSheet 
                isOpen={!!editingExercise}
                onOpenChange={(isOpen) => !isOpen && setEditingExercise(null)}
                exercise={editingExercise?.exercise ?? null}
                onSave={handleSaveAndCloseSheet}
            />
        </div>
    );
}
