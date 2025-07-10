
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Calendar as CalendarIcon, Trash2, ClipboardList, Search, MoreVertical, Send, UserX, Edit } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from './ui/avatar';
import { User } from 'lucide-react';
import { Skeleton } from './ui/skeleton';


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

type Member = {
    id: string;
    type: 'member';
    email: string;
    name?: string;
    role: 'athlete' | 'coach' | 'gym-admin' | null;
    plan?: string;
    dob?: Timestamp;
};

type Invite = {
    id: string;
    type: 'invite';
    email: string;
    name?: string;
    role: 'athlete' | 'coach';
    plan?: string;
    dob?: Timestamp;
}

type CombinedUser = Member | Invite;


function MemberForm({ gymId, onFormSubmitted, userToEdit }: { gymId: string, onFormSubmitted: () => void, userToEdit: CombinedUser | null }) {
    const { toast } = useToast();
    const isEditing = !!userToEdit;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '', role: undefined, dob: undefined, plan: undefined },
    });
    const selectedRole = form.watch('role');

    useEffect(() => {
        if (userToEdit) {
            form.reset({
                name: userToEdit.name || '',
                email: userToEdit.email,
                role: userToEdit.role === 'athlete' || userToEdit.role === 'coach' ? userToEdit.role : undefined,
                dob: userToEdit.dob ? userToEdit.dob.toDate() : undefined,
                plan: userToEdit.plan as 'basic' | 'premium' | 'pro' | undefined,
            });
        } else {
            form.reset({ name: '', email: '', role: undefined, dob: undefined, plan: undefined });
        }
    }, [userToEdit, form]);

    async function onSubmit(values: FormValues) {
        const collectionName = isEditing && userToEdit?.type === 'member' ? 'users' : 'invites';
        const docId = isEditing ? userToEdit.id : values.email.toLowerCase();
        const docRef = doc(db, collectionName, docId);

        const dataToSave: any = {
            gymId,
            email: values.email.toLowerCase(),
            name: values.name,
            role: values.role,
        };
        
        if (values.role === 'athlete') {
            dataToSave.dob = values.dob ? Timestamp.fromDate(values.dob) : null;
            dataToSave.plan = values.plan || null;
        }


        try {
            if (isEditing) {
                await updateDoc(docRef, dataToSave);
                toast({ title: 'Success!', description: `${values.name}'s details have been updated.` });
            } else {
                 const inviteData = { ...dataToSave, invitedAt: Timestamp.now() };
                await setDoc(docRef, inviteData);
                toast({ title: 'Success!', description: `Invitation sent to ${values.email}.` });
            }
            onFormSubmitted();
        } catch (error: any) {
            console.error("Error submitting form:", error);
            toast({ variant: 'destructive', title: 'Error', description: `Could not ${isEditing ? 'update' : 'send'} the ${isEditing ? 'member' : 'invitation'}.` });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="member@example.com" {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                
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
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            captionLayout="dropdown"
                                            fromYear={1940}
                                            toYear={new Date().getFullYear()}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1940-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="plan" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plan</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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
                <DialogFooter className='pt-4'>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (isEditing ? 'Saving...' : 'Sending...') : (isEditing ? 'Save Changes' : 'Send Invitation')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export function AdminUserManagement({ gymId }: { gymId: string }) {
    const { toast } = useToast();
    const [allUsers, setAllUsers] = useState<CombinedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<CombinedUser | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const usersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
        const invitesQuery = query(collection(db, 'invites'), where('gymId', '==', gymId));

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, type: 'member' as const, ...doc.data() } as Member));
            setAllUsers(prev => [...fetchedUsers.filter(u => u.role), ...prev.filter(p => p.type !== 'member')]);
            setIsLoading(false);
        });

        const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
            const fetchedInvites = snapshot.docs.map(doc => ({ id: doc.id, type: 'invite' as const, ...doc.data() } as Invite));
            setAllUsers(prev => [...fetchedInvites, ...prev.filter(p => p.type !== 'invite')]);
        });
        
        const timer = setTimeout(() => setIsLoading(false), 2000);

        return () => {
            unsubscribeUsers();
            unsubscribeInvites();
            clearTimeout(timer);
        };
    }, [gymId]);
    
    async function deleteItem(item: CombinedUser) {
        const collectionName = item.type === 'member' ? 'users' : 'invites';
        if (!window.confirm(`Are you sure you want to delete ${item.name || item.email}? This action cannot be undone.`)) return;
        
        try {
            await deleteDoc(doc(db, collectionName, item.id));
            toast({ title: `${item.type === 'member' ? 'Member' : 'Invitation'} Deleted`, description: `${item.name || item.email} has been removed.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the item.' });
        }
    }

    const openInviteDialog = () => {
        setUserToEdit(null);
        setFormModalOpen(true);
    };

    const openEditDialog = (user: CombinedUser) => {
        setUserToEdit(user);
        setFormModalOpen(true);
    };

    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(user => {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = searchLower === '' ||
                    user.name?.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower);

                const matchesFilter = roleFilter === 'all' ||
                    user.role === roleFilter ||
                    (roleFilter === 'invited' && user.type === 'invite');
                
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    }, [allUsers, searchTerm, roleFilter]);


    const getStatusBadge = (user: CombinedUser) => {
        if (user.type === 'invite') return <Badge variant="outline" className='bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'>Invited</Badge>;
        switch(user.role) {
            case 'gym-admin': return <Badge variant="default">Admin</Badge>;
            case 'coach': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">Coach</Badge>;
            case 'athlete': return <Badge variant="secondary">Athlete</Badge>;
            default: return <Badge variant="outline">N/A</Badge>;
        }
    }

    return (
        <Dialog open={isFormModalOpen} onOpenChange={setFormModalOpen}>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Gym Members</CardTitle>
                            <CardDescription>Search, filter, and manage all members and invitations.</CardDescription>
                        </div>
                        <Button className="w-full sm:w-auto" onClick={openInviteDialog}>
                            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                        </Button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 pt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by name or email..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="athlete">Athletes</SelectItem>
                                <SelectItem value="coach">Coaches</SelectItem>
                                <SelectItem value="invited">Invited</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No users found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try adjusting your search or filter, or invite a new member.
                                </p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                    <Avatar>
                                        <AvatarFallback>
                                            {user.name ? user.name.charAt(0).toUpperCase() : <User />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center">
                                        <div className="sm:col-span-1">
                                            <div className='flex items-center gap-2 flex-wrap'>
                                                <p className="font-semibold truncate">{user.name || 'No Name'}</p>
                                                <div className='sm:hidden'>{getStatusBadge(user)}</div>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <div className="hidden sm:block">
                                            {getStatusBadge(user)}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-sm font-semibold">{user.plan || 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground">Plan</p>
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-sm font-semibold">{user.dob ? format(user.dob.toDate(), 'PPP') : 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground">DOB</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            {user.type === 'member' && (
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/coach?athleteId=${user.id}`}>
                                                        <ClipboardList className="mr-2" /> View Routines
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            {user.type === 'invite' && (
                                                <DropdownMenuItem>
                                                    <Send className="mr-2" /> Resend Invite
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => deleteItem(user)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <Trash2 className="mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{userToEdit ? 'Edit Member' : 'Invite New Member'}</DialogTitle>
                    <DialogDescription>
                        {userToEdit ? `Update the details for ${userToEdit.name}.` : 'Add a new coach or athlete to your gym. They will receive an email to sign up.'}
                    </DialogDescription>
                </DialogHeader>
                <MemberForm gymId={gymId} onFormSubmitted={() => setFormModalOpen(false)} userToEdit={userToEdit} />
            </DialogContent>
        </Dialog>
    );
}
