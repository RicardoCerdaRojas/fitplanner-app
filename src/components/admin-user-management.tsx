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
import { addUserAction, getGymUsersAction } from '@/app/admin/actions';
import { UserPlus } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  role: z.enum(['coach', 'athlete'], { required_error: 'Please select a role.' }),
});

type FormValues = z.infer<typeof formSchema>;
type User = {
    id: string;
    email: string;
    role: 'athlete' | 'coach' | 'gym-admin' | null;
    status?: string;
};

export function AdminUserManagement({ gymId }: { gymId: string }) {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '', role: undefined },
    });

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        const result = await getGymUsersAction(gymId);
        if (result.success && result.data) {
            setUsers(result.data);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load gym users.' });
        }
        setIsLoadingUsers(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [gymId]);

    async function onSubmit(values: FormValues) {
        const result = await addUserAction({ ...values, gymId });
        if (result.success) {
            toast({ title: 'Success!', description: `Invitation sent to ${values.email}. The user will appear once they sign up.` });
            form.reset();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Gym Members</CardTitle>
                        <CardDescription>A list of all coaches and athletes in your gym.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingUsers ? (
                                    <TableRow><TableCell colSpan={3}>Loading users...</TableCell></TableRow>
                                ) : users.length === 0 ? (
                                     <TableRow><TableCell colSpan={3}>No active users found in your gym yet.</TableCell></TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.email}</TableCell>
                                            <TableCell><Badge variant={user.role === 'gym-admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                            <TableCell><Badge variant={user.status === 'active' ? 'default' : 'outline'}>{user.status || 'active'}</Badge></TableCell>
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
                        <CardTitle className="flex items-center gap-2">
                           <UserPlus/> Invite New Member
                        </CardTitle>
                        <CardDescription>Add a new coach or athlete to your gym.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="member@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
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
                                    )}
                                />
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
