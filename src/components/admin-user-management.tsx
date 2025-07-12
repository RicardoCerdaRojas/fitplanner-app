
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
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Search, MoreVertical, UserX, Edit, ShieldCheck, Dumbbell, ClipboardList, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
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
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from './ui/avatar';
import { User } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  role: z.enum(['coach', 'member'], { required_error: 'Please select a role.' }),
});


type FormValues = z.infer<typeof formSchema>;

type Member = {
    id: string; // userId
    type: 'member';
    email: string;
    name?: string;
    role: 'member' | 'coach' | 'gym-admin';
    dob?: Timestamp;
    gymName: string;
};

type PendingMembership = {
    id: string; // email as id
    type: 'pending';
    email: string;
    role: 'member' | 'coach';
    gymName: string;
    name?: string; // name is not captured at this stage anymore
}

type CombinedUser = Member | PendingMembership;


function MemberForm({ gymId, gymName, onFormSubmitted, userToEdit }: { gymId: string, gymName: string, onFormSubmitted: () => void, userToEdit: CombinedUser | null }) {
    const { toast } = useToast();
    const isEditing = !!userToEdit;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '', role: undefined },
    });

    useEffect(() => {
        if (userToEdit) {
            form.reset({
                email: userToEdit.email,
                role: userToEdit.role === 'member' || userToEdit.role === 'coach' ? userToEdit.role : undefined,
            });
        } else {
            form.reset({ email: '', role: undefined });
        }
    }, [userToEdit, form]);

    async function onSubmit(values: FormValues) {
        if (isEditing) {
            // Logic to update an existing user (member)
            const docRef = doc(db, "users", userToEdit.id);
            const dataToUpdate: any = {
                role: values.role,
            };
            try {
                await updateDoc(docRef, dataToUpdate);
                toast({ title: 'Success!', description: `${userToEdit.name}'s role has been updated.` });
            } catch(error: any) {
                 toast({ variant: 'destructive', title: 'Error', description: `Could not update the member.` });
            }

        } else {
            // Logic to create a new pending membership
            const docRef = doc(db, 'memberships', values.email.toLowerCase());
            const dataToSave: any = {
                gymId,
                gymName,
                status: 'pending',
                email: values.email.toLowerCase(),
                role: values.role,
                createdAt: Timestamp.now(),
            };

            try {
                await setDoc(docRef, dataToSave);
                toast({ title: 'Success!', description: `Membership for ${values.email} is ready. They can now sign up.` });
            } catch (error: any) {
                console.error("Error creating pending membership:", error);
                toast({ variant: 'destructive', title: 'Error', description: `Could not create the membership.` });
            }
        }
        onFormSubmitted();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="member@example.com" {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="coach">Coach</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <DialogFooter className='pt-4'>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Membership')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export function AdminUserManagement({ gymId }: { gymId: string }) {
    const { toast } = useToast();
    const { gymProfile } = useAuth();
    const [allUsers, setAllUsers] = useState<CombinedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<CombinedUser | null>(null);
    
    useEffect(() => {
        setIsLoading(true);
        const usersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
        const pendingQuery = query(collection(db, 'memberships'), where('gymId', '==', gymId), where('status', '==', 'pending'));

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, type: 'member' as const, ...doc.data() } as Member));
            setAllUsers(prev => [...fetchedUsers, ...prev.filter(p => p.type !== 'member')]);
        });

        const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
            const fetchedPending = snapshot.docs.map(doc => ({ id: doc.id, type: 'pending' as const, ...doc.data() } as PendingMembership));
            setAllUsers(prev => [...fetchedPending, ...prev.filter(p => p.type !== 'pending')]);
        });
        
        const timer = setTimeout(() => setIsLoading(false), 1500);

        return () => {
            unsubscribeUsers();
            unsubscribePending();
            clearTimeout(timer);
        };
    }, [gymId]);
    
    async function deleteItem(item: CombinedUser) {
        const collectionName = item.type === 'member' ? 'memberships' : 'memberships';
        const docId = item.type === 'member' ? `${item.id}_${gymId}` : item.id;
        
        if (!window.confirm(`Are you sure you want to delete ${item.name || item.email}? This action cannot be undone.`)) return;
        
        try {
            await deleteDoc(doc(db, collectionName, docId));
            if(item.type === 'member') {
                // Also clear gymId from user profile
                await updateDoc(doc(db, 'users', item.id), { gymId: null });
            }
            toast({ title: `Record Deleted`, description: `${item.name || item.email} has been removed.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the item.' });
        }
    }

    const openCreateDialog = () => {
        setUserToEdit(null);
        setFormModalOpen(true);
    };

    const openEditDialog = (user: CombinedUser) => {
        if (user.type === 'pending') {
            toast({ title: 'Action Not Allowed', description: 'Please delete and recreate the pending membership to make changes.'});
            return;
        }
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
                    (roleFilter === 'pending' && user.type === 'pending');
                
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    }, [allUsers, searchTerm, roleFilter]);


    const getRoleIcon = (user: CombinedUser) => {
        let roleName: string;
        let icon: React.ReactNode;
        let className: string;
    
        if (user.type === 'pending') {
            roleName = 'Pending';
            icon = <Clock className="h-4 w-4" />;
            className = 'text-blue-500';
        } else {
            switch(user.role) {
                case 'gym-admin':
                    roleName = 'Admin';
                    icon = <ShieldCheck className="h-4 w-4" />;
                    className = 'text-primary';
                    break;
                case 'coach':
                    roleName = 'Coach';
                    icon = <ClipboardList className="h-4 w-4" />;
                    className = 'text-amber-500';
                    break;
                case 'member':
                    roleName = 'Member';
                    icon = <Dumbbell className="h-4 w-4" />;
                    className = 'text-green-500';
                    break;
                default:
                    roleName = 'N/A';
                    icon = <User className="h-4 w-4" />;
                    className = 'text-muted-foreground';
            }
        }
    
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn('flex items-center', className)}>
                            {icon}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{roleName}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Dialog open={isFormModalOpen} onOpenChange={setFormModalOpen}>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Gym Members</CardTitle>
                            <CardDescription>Search, filter, and manage all members and pending sign-ups.</CardDescription>
                        </div>
                        <Button className="w-full sm:w-auto" onClick={openCreateDialog}>
                            <UserPlus className="mr-2 h-4 w-4" /> Add Member
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
                                <SelectItem value="member">Members</SelectItem>
                                <SelectItem value="coach">Coaches</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
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
                                    Try adjusting your search or filter, or add a new member.
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
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                                        <div className="sm:col-span-1">
                                            <div className='flex items-center gap-2'>
                                                {getRoleIcon(user)}
                                                <p className="font-semibold truncate">{user.name || 'No Name'}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(user)} disabled={user.type === 'pending' || user.role === 'gym-admin'}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Role
                                            </DropdownMenuItem>
                                            {user.type === 'member' && user.role !== 'gym-admin' && (
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/coach?memberId=${user.id}`}>
                                                        <ClipboardList className="mr-2" /> View Routines
                                                    </Link>
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
                    <DialogTitle>{userToEdit ? 'Edit Member Role' : 'Add New Member'}</DialogTitle>
                    <DialogDescription>
                        {userToEdit ? `Update the role for ${userToEdit.name}.` : 'Create a new membership. The user can then sign up with this email to get access.'}
                    </DialogDescription>
                </DialogHeader>
                <MemberForm gymId={gymId} gymName={gymProfile?.name ?? ''} onFormSubmitted={() => setFormModalOpen(false)} userToEdit={userToEdit} />
            </DialogContent>
        </Dialog>
    );
}
