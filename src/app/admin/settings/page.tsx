
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Upload, Palette } from 'lucide-react';
import { AdminBottomNav } from '@/components/admin-bottom-nav';

const formSchema = z.object({
  theme: z.string({ required_error: 'Please select a theme for your gym.' }),
});
type FormValues = z.infer<typeof formSchema>;

export default function GymSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, activeMembership, gymProfile, loading } = useAuth();
    
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { theme: 'slate-mint' },
    });
    
    useEffect(() => {
        if (gymProfile?.theme) {
            const currentTheme = themes.find(t => 
                Object.entries(t.colors).every(([key, value]) => gymProfile.theme?.[key as keyof typeof t.colors] === value)
            );
            if (currentTheme) {
                form.setValue('theme', currentTheme.id);
            }
        }
        if (gymProfile?.logoUrl) {
            setLogoPreview(gymProfile.logoUrl);
        }
    }, [gymProfile, form]);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ variant: 'destructive', title: 'Error', description: 'File size cannot exceed 5MB.' });
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast({ variant: 'destructive', title: 'Error', description: 'Invalid file type. Only images are allowed.' });
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    async function onSubmit(values: FormValues) {
        if (!activeMembership?.gymId || !user) return;
        
        setIsSubmitting(true);
        const { gymId } = activeMembership;
        
        const selectedTheme = themes.find(t => t.id === values.theme);
        if (!selectedTheme) {
             toast({ variant: 'destructive', title: 'Error', description: 'Invalid theme selected.' });
             setIsSubmitting(false);
             return;
        }

        const updateData: { theme: typeof selectedTheme.colors; logoUrl?: string } = { 
            theme: selectedTheme.colors
        };

        try {
            if (logoFile) {
                const fileExtension = logoFile.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExtension}`;
                const filePath = `logos/${user.uid}/${fileName}`;
                const storageRef = ref(storage, filePath);
    
                await uploadBytes(storageRef, logoFile);
                const downloadURL = await getDownloadURL(storageRef);
                updateData.logoUrl = downloadURL;
            }
            
            const gymRef = doc(db, 'gyms', gymId);
            await updateDoc(gymRef, updateData);
            
            toast({ title: 'Success!', description: 'Your gym settings have been updated.' });
        } catch (error: any) {
            console.error("Error updating gym settings:", error);
            if (error.code === 'storage/unauthorized') {
              toast({ variant: 'destructive', title: 'Upload Failed', description: 'Permission denied. Please ensure you are an admin and check storage rules.' });
            } else {
              toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not update settings.' });
            }
        } finally {
            setIsSubmitting(false);
            setLogoFile(null);
        }
    }

    if (loading || !activeMembership || activeMembership.role !== 'gym-admin') {
        return (
            <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-6xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
                 <p className='mt-8 text-lg text-muted-foreground'>Verifying admin access...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-16 md:pb-8">
                <div className="w-full max-w-4xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                    <AdminBottomNav />
                    
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Upload /> Logo del Centro</CardTitle>
                                <CardDescription>Sube un logo para tu centro. Se mostrará en la cabecera de la aplicación para tus miembros.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                                    {logoPreview ? (
                                        <Image src={logoPreview} alt="Logo preview" width={180} height={90} className="object-contain h-full w-full p-2" />
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Vista Previa</span>
                                    )}
                                </div>
                                <div className="flex-1 w-full">
                                    <FormLabel htmlFor="logo-upload">Subir nuevo logo</FormLabel>
                                    <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                                    <p className="text-xs text-muted-foreground mt-2">Tamaño recomendado: 200x100px. Máx 5MB. PNG, JPG o SVG.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Palette /> Tema de Color</CardTitle>
                                <CardDescription>Selecciona un tema de color para el modo claro de la aplicación.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="theme"
                                    render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormControl>
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {themes.map(theme => (
                                                <FormItem key={theme.id} className="w-full">
                                                    <FormControl><RadioGroupItem value={theme.id} id={theme.id} className="sr-only" /></FormControl>
                                                    <FormLabel 
                                                        htmlFor={theme.id}
                                                        className={cn(
                                                            "flex flex-col items-start w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                            field.value === theme.id ? "border-primary shadow-md" : "border-muted"
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-center w-full">
                                                            <div className="font-bold text-card-foreground">{theme.name}</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-5 w-5 rounded-full" style={{backgroundColor: `hsl(${theme.colors.primary})`}}/>
                                                                <div className="h-5 w-5 rounded-full" style={{backgroundColor: `hsl(${theme.colors.accent})`}}/>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
                                                    </FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                        
                        <div className="flex justify-end">
                            <Button type="submit" size="lg" disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                    </Form>
                </div>
            </main>
            <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fit Planner. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
