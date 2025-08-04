
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/client';
import { doc, setDoc, Timestamp, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  role: z.enum(['coach', 'member'], { required_error: 'Please select a role.' }),
});

type FormValues = z.infer<typeof formSchema>;

type AddMemberFormProps = {
  gymId: string;
  gymName: string;
  onFormSubmitted: () => void;
};

export function AddMemberForm({ gymId, gymName, onFormSubmitted }: AddMemberFormProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', role: 'member' },
  });

  async function onSubmit(values: FormValues) {
    const lowerCaseEmail = values.email.toLowerCase();
    
    // 1. Check if user with this email already exists
    const userQuery = query(collection(db, 'users'), where('email', '==', lowerCaseEmail));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
        toast({
            variant: 'destructive',
            title: 'User Exists',
            description: `A user with the email ${lowerCaseEmail} is already registered.`,
        });
        return;
    }

    // 2. Check for existing pending invitation
    const docRef = doc(db, 'memberships', `PENDING_${lowerCaseEmail}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        toast({
            variant: 'destructive',
            title: 'Invitation Exists',
            description: `An invitation for ${lowerCaseEmail} already exists.`,
        });
        return;
    }

    const dataToSave = {
      gymId,
      gymName,
      status: 'pending' as const,
      email: lowerCaseEmail,
      role: values.role,
      createdAt: Timestamp.now(),
    };

    try {
      await setDoc(docRef, dataToSave);
      toast({
        title: 'Success!',
        description: `Invitation for ${values.email} has been sent. They can now join from the signup page.`,
      });
      onFormSubmitted();
    } catch (error: any) {
      console.error("Error creating pending membership:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not create the invitation.`,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
