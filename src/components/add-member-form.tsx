
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
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

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
    defaultValues: { email: '', role: undefined },
  });

  async function onSubmit(values: FormValues) {
    const docRef = doc(db, 'memberships', values.email.toLowerCase());
    const dataToSave = {
      gymId,
      gymName,
      status: 'pending' as const,
      email: values.email.toLowerCase(),
      role: values.role,
      createdAt: Timestamp.now(),
    };

    try {
      await setDoc(docRef, dataToSave);
      toast({
        title: 'Success!',
        description: `Membership for ${values.email} is ready. They can now sign up.`,
      });
      onFormSubmitted();
    } catch (error: any) {
      console.error("Error creating pending membership:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not create the membership.`,
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
            {form.formState.isSubmitting ? 'Creating...' : 'Create Membership'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
