
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/client';
import { themes } from '@/lib/themes';
import { addDays } from 'date-fns';
import { useMultiStepForm } from '@/hooks/use-multi-step-form';
import { AnimatePresence, motion } from 'framer-motion';
import { FormStepper } from './form-stepper';
import { UserInfoStep } from './step-1-user-info';
import { PasswordStep } from './step-2-password';
import { GymInfoStep } from './step-3-gym-info';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';

// 1. Define the base schema without refinement
const baseSchema = z.object({
  name: z.string().min(2, { message: 'Your name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  gymName: z.string().min(3, { message: 'Gym name must be at least 3 characters.' }),
  theme: z.string({ required_error: 'Please select a theme.' }),
});

// 2. Use the base schema's shape for step validation
const stepsValidation = [
  z.object({ name: baseSchema.shape.name, email: baseSchema.shape.email }),
  z.object({ password: baseSchema.shape.password, confirmPassword: baseSchema.shape.confirmPassword }),
  z.object({ gymName: baseSchema.shape.gymName, theme: baseSchema.shape.theme }),
];

// 3. Create the final schema with refinement for the form resolver
const formSchema = baseSchema.refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});


type FormData = z.infer<typeof formSchema>;

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export function CreateGymForm() {
  const { toast } = useToast();
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema), // Use the final schema here
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      gymName: '',
      theme: 'slate-mint',
    },
  });

  const { steps, currentStepIndex, step, isFirstStep, isLastStep, back, next } = useMultiStepForm([
    <UserInfoStep key="step1" />,
    <PasswordStep key="step2" />,
    <GymInfoStep key="step3" />,
  ]);

  const [direction, setDirection] = useState(0);

  const handleNext = async () => {
    const currentStepSchema = stepsValidation[currentStepIndex];
    const fieldsToValidate = Object.keys(currentStepSchema.shape);
    const result = await methods.trigger(fieldsToValidate as (keyof FormData)[]);
    
    if (result) {
      setDirection(1);
      next();
    }
  };

  const handleBack = () => {
    setDirection(-1);
    back();
  };

  async function onSubmit(values: FormData) {
    const selectedTheme = themes.find(t => t.id === values.theme);
    if (!selectedTheme) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid theme.' });
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const authUser = userCredential.user;

        const batch = writeBatch(db);
        const trialEndDate = addDays(new Date(), 14);
        
        const gymRef = doc(collection(db, 'gyms'));
        batch.set(gymRef, {
            name: values.gymName,
            adminUid: authUser.uid,
            createdAt: Timestamp.now(),
            trialEndsAt: Timestamp.fromDate(trialEndDate),
            logoUrl: `https://placehold.co/100x50.png?text=${encodeURIComponent(values.gymName)}`,
            theme: selectedTheme.colors,
        });
        
        const userRef = doc(db, 'users', authUser.uid);
        batch.set(userRef, {
            name: values.name,
            email: values.email.toLowerCase(),
            createdAt: Timestamp.now(),
            gymId: gymRef.id,
            role: 'gym-admin'
        });

        await batch.commit();
        await signInWithEmailAndPassword(auth, values.email, values.password);
        
        toast({ title: 'Success!', description: 'Your gym has been created. Redirecting...' });
        
        // Redirect to the dedicated home/dashboard page instead of the root
        window.location.href = '/home';

    } catch (error: any) {
      console.error("Error creating gym:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || "Could not create gym." });
    }
  }
  
  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <FormStepper currentStep={currentStepIndex} steps={steps.length} />
          <div className="overflow-hidden relative" style={{ minHeight: '300px' }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentStepIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute w-full"
              >
                {step}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center pt-4">
            {!isFirstStep ? (
              <Button type="button" variant="ghost" onClick={handleBack} className="text-white hover:text-gray-300">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : <div />}

            <Button 
              type={isLastStep ? 'submit' : 'button'} 
              className="bg-emerald-400 text-black font-bold hover:bg-emerald-500"
              disabled={methods.formState.isSubmitting}
              onClick={!isLastStep ? handleNext : undefined}
            >
              {methods.formState.isSubmitting ? 'Creating...' : isLastStep ? 'Create Gym & Continue' : 'Next'}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
