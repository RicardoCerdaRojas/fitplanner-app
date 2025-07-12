'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { PanelLeftOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

type RoutineCreatorLayoutProps = {
    sidebar: React.ReactNode;
    children: React.ReactNode;
};

export function RoutineCreatorLayout({ sidebar, children }: RoutineCreatorLayoutProps) {
    const isMobile = useIsMobile();
    const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
    const router = useRouter();

    if (isMobile) {
        return (
            <div className="space-y-4">
                <Button variant="outline" onClick={() => setMobileNavOpen(true)}>
                    <PanelLeftOpen className="mr-2" /> Show Routine Plan
                </Button>
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                    <SheetContent side="left" className="w-full max-w-sm p-4 overflow-y-auto">
                        {sidebar}
                    </SheetContent>
                </Sheet>
                <div>
                    {children}
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-8 items-start">
            <aside className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto bg-card p-4 rounded-lg border">
                {sidebar}
            </aside>
            <main>
                {children}
            </main>
        </div>
    );
}
