'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  role: z.enum(['coach', 'athlete'], { required_error: 'Please select a role.' }),
  dob: z.date().optional(),
  plan: z.enum(['basic', 'premium', 'pro']).optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'athlete') {
        if (!data.dob) {
            ctx.addIssue({ code: 'custom', message: 'Date of birth is required.', path: ['dob'] });
        }
        if (!data.plan) {
            ctx.addIssue({ code: 'custom', message: 'Plan is required.', path: ['plan'] });
        }
    }
});


type FormValues = z.infer<typeof formSchema>;

type User = {
    id: string;
    email: string;
    name?: string;
    role: 'athlete' | 'coach' | 'gym-admin' | null;
    status?: string;
    plan?: string;
    dob?: Timestamp;
};

type Invite = {
    id: string;
    email: string;
    name?: string;
    role: 'athlete' | 'coach';
    plan?: string;
    dob?: Timestamp;
}

export function AdminUserManagement({ gymId }: { gymId: string }) {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '', role: undefined, dob: undefined, plan: undefined },
    });
    const selectedRole = form.watch('role');

    useEffect(() => {
        setIsLoading(true);
        const usersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
        const invitesQuery = query(collection(db, 'invites'), where('gymId', '==', gymId));

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(fetchedUsers.filter(user => user.role));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load gym members.' });
            setIsLoading(false);
        });

        const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
            const fetchedInvites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invite));
            setInvites(fetchedInvites);
        }, (error) => {
            console.error("Error fetching invites:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load pending invitations.' });
        });

        return () => {
            unsubscribeUsers();
            unsubscribeInvites();
        };
    }, [gymId, toast]);

    async function onSubmit(values: FormValues) {
        const inviteRef = doc(db, 'invites', values.email);
        
        try {
            await setDoc(inviteRef, {
                gymId,
                email: values.email,
                name: values.name,
                role: values.role,
                dob: values.dob ? Timestamp.fromDate(values.dob) : null,
                plan: values.plan || null,
                invitedAt: Timestamp.now(),
            });
            toast({ title: 'Success!', description: `Invitation sent to ${values.email}.` });
            form.reset();
        } catch (error: any) {
            console.error("Error sending invite:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send invitation.' });
        }
    }
    
    async function deleteInvite(email: string) {
        if (!window.confirm("Are you sure you want to delete this invitation?")) return;
        try {
            await deleteDoc(doc(db, "invites", email));
            toast({ title: 'Invitation Deleted', description: `The invitation for ${email} has been removed.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the invitation.' });
        }
    }


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Gym Members</CardTitle>
                        <CardDescription>A list of all active coaches and athletes in your gym.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Plan</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}>Loading users...</TableCell></TableRow>
                                ) : users.length === 0 ? (
                                     <TableRow><TableCell colSpan={4}>No active users found in your gym yet.</TableCell></TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name || '-'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell><Badge variant={user.role === 'gym-admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                            <TableCell>{user.plan || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Invitations</CardTitle>
                        <CardDescription>These users have been invited but have not signed up yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                                ) : invites.length === 0 ? (
                                     <TableRow><TableCell colSpan={4}>No pending invitations.</TableCell></TableRow>
                                ) : (
                                    invites.map((invite) => (
                                        <TableRow key={invite.id}>
                                            <TableCell className="font-medium">{invite.name || '-'}</TableCell>
                                            <TableCell>{invite.email}</TableCell>
                                            <TableCell><Badge variant="outline">{invite.role}</Badge></TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => deleteInvite(invite.email)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserPlus/> Invite New Member</CardTitle>
                        <CardDescription>Add a new coach or athlete to your gym.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="role" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="coach">Coach</SelectItem>
                                                <SelectItem value="athlete">Athlete</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="member@example.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                
                                { selectedRole === 'athlete' && (
                                    <>
                                        <FormField control={form.control} name="dob" render={({ field }) => (
                                            <FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="plan" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plan</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="basic">Basic</SelectItem>
                                                        <SelectItem value="premium">Premium</SelectItem>
                                                        <SelectItem value="pro">Pro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </>
                                )}

                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Sending...' : 'Send Invitation'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
