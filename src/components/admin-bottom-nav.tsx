'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ClipboardList, Layers, Palette, LayoutDashboard, Activity, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function AdminBottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/live', label: 'Live', icon: Activity },
    { href: '/coach', label: 'Routines', icon: ClipboardList },
    { href: '/admin/members', label: 'Members', icon: Users },
    { href: '/admin/routine-types', label: 'Types', icon: Layers },
    { href: '/admin/settings', label: 'Branding', icon: Palette },
    { href: '/admin/subscription', label: 'Subscription', icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/coach') return ['/coach', '/coach/create-routine', '/coach/templates'].includes(pathname);
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
        <div className="flex justify-around items-center h-full">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground transition-colors",
                  active ? "text-primary font-semibold" : "hover:text-primary"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Horizontal Bar */}
      <nav className="hidden md:flex flex-wrap items-center gap-2 mb-8 border-b pb-4">
         {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Button key={href} asChild variant={active ? 'default' : 'ghost'} className="font-semibold">
                <Link href={href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Link>
              </Button>
            );
          })}
      </nav>
    </>
  );
}
