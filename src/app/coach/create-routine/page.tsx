
'use client';

import { Suspense } from 'react';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { TrialEnded } from '@/components/trial-ended';

function CreateRoutinePageSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                <div className="w-full max-w-4xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
                <p className='mt-8 text-lg text-muted-foreground'>Loading routine creator...</p>
            </main>
        </div>
    )
}

function PageContent() {
    const { isTrialActive, loading } = useAuth();
    
    if (loading) {
        return <CreateRoutinePageSkeleton />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            <AppHeader />
            {isTrialActive === false ? (
                 <TrialEnded />
            ) : (
                <>
                    <main className="flex-grow flex flex-col items-center p-4 sm:p-6 pb-28 md:pb-8">
                        <div className="w-full max-w-4xl">
                            <CoachRoutineCreator />
                        </div>
                    </main>
                    <footer className="w-full text-center p-4 text-muted-foreground text-sm bg-muted/30">
                        <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
                    </footer>
                </>
            )}
        </div>
    );
}

export default function CreateRoutinePage() {
    return (
        <Suspense fallback={<CreateRoutinePageSkeleton />}>
           <PageContent />
        </Suspense>
    )
}
