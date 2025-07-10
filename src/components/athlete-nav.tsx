'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ClipboardList, WandSparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AthleteNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'My Routines', mobileLabel: 'Routines', icon: ClipboardList },
    { href: '/stats', label: 'My Stats', mobileLabel: 'Stats', icon: BarChart3 },
    { href: '/generate-routine', label: 'AI Generator', mobileLabel: 'Generator', icon: WandSparkles },
  ];

  return (
    <>
      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
        <div className="flex justify-around items-center h-full">
          {links.map(({ href, mobileLabel, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground transition-colors",
                pathname === href ? "text-primary font-semibold" : "hover:text-primary"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{mobileLabel}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Top Nav for Desktop */}
      <nav className="hidden md:flex items-center gap-2 mb-4 border-b pb-4">
        {links.map(({ href, label, icon: Icon }) => (
          <Button
            key={href}
            asChild
            variant={pathname === href ? 'default' : 'ghost'}
            className="font-semibold"
          >
            <Link href={href}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Link>
          </Button>
        ))}
      </nav>
    </>
  );
}
