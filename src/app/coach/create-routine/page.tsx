
'use client';

import { Suspense } from 'react';
import { CoachRoutineCreator } from '@/components/coach-routine-creator';
import { Skeleton } from '@/components/ui/skeleton';

function CreateRoutinePage() {
    return (
        <Suspense fallback={<CreateRoutineSkeleton />}>
            <CoachRoutineCreator />
        </Suspense>
    );
}

function CreateRoutineSkeleton() {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-9 w-9" />
            </div>
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="p-4 mt-auto border-t">
                <Skeleton className="h-14 w-full" />
            </div>
        </div>
    );
}

export default CreateRoutinePage;
