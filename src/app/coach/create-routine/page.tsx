
'use client';

import { Suspense } from 'react';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';

function CreateRoutinePageSkeleton() {
    return (
        <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
            <AppHeader />
            <div className="w-full max-w-6xl space-y-8 mt-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
            <p className='mt-8 text-lg text-muted-foreground'>Loading routine creator...</p>
        </div>
    )
}

export default function CreateRoutinePage() {
    return (
        <Suspense fallback={<CreateRoutinePageSkeleton />}>
           <div className="flex flex-col min-h-screen">
                <AppHeader />
                <main className="flex-grow flex flex-col items-center p-4 sm:p-8">
                    <div className="w-full max-w-6xl">
                         <CoachRoutineCreator />
                    </div>
                </main>
                <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
                </footer>
            </div>
        </Suspense>
    )
}

