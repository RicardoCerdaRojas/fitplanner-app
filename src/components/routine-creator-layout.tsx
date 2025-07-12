'use client';

import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { PanelLeft } from 'lucide-react';

type RoutineCreatorLayoutProps = {
  navigation: React.ReactNode;
  children: React.ReactNode;
};

export function RoutineCreatorLayout({ navigation, children }: RoutineCreatorLayoutProps) {
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);

  if (isMobile === undefined) {
    return null; // or a skeleton loader
  }

  const enhancedNavigation = isMobile ? React.cloneElement(navigation as React.ReactElement, { onCloseNav: () => setIsNavOpen(false) }) : navigation;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8">
      {isMobile ? (
        <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden flex items-center gap-2 font-semibold">
              <PanelLeft />
              Routine Navigation
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Routine Structure</SheetTitle>
            </SheetHeader>
            {enhancedNavigation}
          </SheetContent>
        </Sheet>
      ) : (
        <div className="w-full md:w-1/3 lg:w-1/4">
          {enhancedNavigation}
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
