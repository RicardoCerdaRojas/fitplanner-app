
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { CombinedUser } from './admin-user-management';

const formSchema = z.object({
  role: z.enum(['coach', 'member', 'gym-admin']),
  dob: z.date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export type UserProfileData = z.infer<typeof formSchema>;

type CompleteProfileFormProps = {
  user: Extract<CombinedUser, { type: 'member' }>;
  onFormSubmitted: () => void;
};

export function CompleteProfileForm({ user, onFormSubmitted }: CompleteProfileFormProps) {
  const { toast } = useToast();

  const form = useForm<UserProfileData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role,
      dob: user.dob ? user.dob.toDate() : undefined,
      gender: user.gender,
    },
  });

  async function onSubmit(values: UserProfileData) {
    const userRef = doc(db, 'users', user.id);
    const dataToUpdate: any = {
      role: values.role,
      gender: values.gender || null,
      dob: values.dob ? Timestamp.fromDate(values.dob) : null,
    };

    try {
      await updateDoc(userRef, dataToUpdate);
      toast({ title: 'Success!', description: `${user.name}'s profile has been updated.` });
      onFormSubmitted();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update the profile.' });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={user.role === 'gym-admin'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                   <SelectItem value="gym-admin" disabled>Admin (Cannot be changed)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1930}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

