
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Search, MoreVertical, UserX, Edit, ShieldCheck, Dumbbell, ClipboardList, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
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
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from './ui/avatar';
import { User } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CompleteProfileForm, type UserProfileData } from './complete-profile-form';
import { AddMemberForm } from './add-member-form';

type Member = {
    id: string; // userId
    type: 'member';
    email: string;
    name?: string;
    role: 'member' | 'coach' | 'gym-admin';
    dob?: Timestamp;
    gender?: 'male' | 'female' | 'other';
    gymName: string;
    gymId: string;
};

type PendingMembership = {
    id: string; // email as id
    type: 'pending';
    email: string;
    role: 'member' | 'coach';
    gymName: string;
    name?: string; // name is not captured at this stage anymore
}

export type CombinedUser = Member | PendingMembership;

export function AdminUserManagement({ gymId }: { gymId: string }) {
    const { toast } = useToast();
    const { gymProfile } = useAuth();
    const [allUsers, setAllUsers] = useState<CombinedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    
    const [dialogType, setDialogType] = useState<'addMember' | 'editProfile' | null>(null);
    const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
    
    useEffect(() => {
        if (!gymId) return;
        setIsLoading(true);

        const usersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
        const pendingQuery = query(collection(db, 'memberships'), where('gymId', '==', gymId), where('status', '==', 'pending'));

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, type: 'member' as const, ...doc.data() } as Member));
            setAllUsers(prev => [...fetchedUsers, ...prev.filter(p => p.type !== 'member')]);
        }, (error) => {
            console.error("Error fetching users:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load users. Check permissions.' });
        });

        const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
            const fetchedPending = snapshot.docs.map(doc => ({ id: doc.id, type: 'pending' as const, ...doc.data() } as PendingMembership));
            setAllUsers(prev => [...fetchedPending, ...prev.filter(p => p.type !== 'pending')]);
        }, (error) => {
            console.error("Error fetching pending members:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load pending members. Check permissions.' });
        });
        
        const timer = setTimeout(() => setIsLoading(false), 1500);

        return () => {
            unsubscribeUsers();
            unsubscribePending();
            clearTimeout(timer);
        };
    }, [gymId, toast]);
    
    async function deleteItem(item: CombinedUser) {
        if (item.type === 'member' && item.role === 'gym-admin') {
            toast({ variant: 'destructive', title: 'Action Forbidden', description: 'Cannot delete the primary gym admin.' });
            return;
        }

        const isConfirmed = window.confirm(`Are you sure you want to delete ${item.name || item.email}? This action cannot be undone.`);
        if (!isConfirmed) return;
        
        try {
            if (item.type === 'member') {
                const membershipId = `${item.id}_${item.gymId}`;
                await deleteDoc(doc(db, 'memberships', membershipId));
                // We're not deleting the user document, just their link to this gym.
                await updateDoc(doc(db, 'users', item.id), { gymId: null, role: null });
            } else {
                await deleteDoc(doc(db, 'memberships', item.id));
            }
            toast({ title: `Record Deleted`, description: `${item.name || item.email} has been removed.`});
        } catch (error) {
            console.error("Error deleting item:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the item.' });
        }
    }

    const openDialog = (type: 'addMember' | 'editProfile', user: CombinedUser | null = null) => {
        if (type === 'editProfile' && user?.type === 'pending') {
            toast({ title: 'Action Not Allowed', description: 'Cannot edit a pending membership. Please delete and recreate it if changes are needed.'});
            return;
        }
        setSelectedUser(user);
        setDialogType(type);
    };

    const handleDialogClose = () => {
        setDialogType(null);
        setSelectedUser(null);
    }

    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(user => {
                const searchLower = searchTerm.toLowerCase();
                const name = (user.type === 'member') ? user.name : 'Pending Invitation';
                const matchesSearch = searchLower === '' ||
                    name?.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower);

                const matchesFilter = roleFilter === 'all' ||
                    user.role === roleFilter ||
                    (roleFilter === 'pending' && user.type === 'pending');
                
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                const nameA = a.type === 'member' ? a.name : 'Pending';
                const nameB = b.type === 'member' ? b.name : 'Pending';
                return (nameA || a.email).localeCompare(nameB || b.email);
            });
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
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Gym Members</CardTitle>
                            <CardDescription>Search, filter, and manage all members and pending sign-ups.</CardDescription>
                        </div>
                        <Button className="w-full sm:w-auto" onClick={() => openDialog('addMember')}>
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
                                            {user.type === 'member' && user.name ? user.name.charAt(0).toUpperCase() : <User />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                                        <div className="sm:col-span-1">
                                            <div className='flex items-center gap-2'>
                                                {getRoleIcon(user)}
                                                <p className="font-semibold truncate">{user.type === 'member' ? user.name : 'Pending Invitation'}</p>
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
                                            <DropdownMenuItem onClick={() => openDialog('editProfile', user)} disabled={user.type === 'pending'}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                            </DropdownMenuItem>
                                            {user.type === 'member' && user.role !== 'gym-admin' && (
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/coach?memberId=${user.id}`}>
                                                        <ClipboardList className="mr-2 h-4 w-4" /> View Routines
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => deleteItem(user)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!dialogType} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
                <DialogContent>
                    <DialogHeader>
                         <DialogTitle>
                            {dialogType === 'addMember' ? 'Add New Member' : `Edit Profile: ${selectedUser?.type === 'member' ? selectedUser.name : ''}`}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'addMember' 
                                ? 'Create a new membership. The user can then sign up with this email to get access.'
                                : 'Update the user\'s role and demographic information.'}
                        </DialogDescription>
                    </DialogHeader>
                   
                    {dialogType === 'addMember' && (
                        <AddMemberForm
                            gymId={gymId}
                            gymName={gymProfile?.name ?? ''}
                            onFormSubmitted={handleDialogClose}
                        />
                    )}

                    {dialogType === 'editProfile' && selectedUser?.type === 'member' && (
                        <CompleteProfileForm 
                            user={selectedUser} 
                            onFormSubmitted={handleDialogClose}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
