
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, ClipboardList, Layers, Palette, LayoutDashboard, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/live', label: 'Live Activity', icon: Activity },
    { href: '/admin/members', label: 'Manage Members', icon: Users },
    { href: '/admin/routine-types', label: 'Routine Types', icon: Layers },
    { href: '/admin/settings', label: 'Gym Branding', icon: Palette },
    { href: '/coach', label: 'Create Routines', icon: ClipboardList },
  ];

  return (
    <nav className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Button
            key={link.href}
            asChild
            variant={isActive ? 'default' : 'ghost'}
            className={cn(
              "h-auto justify-start p-3",
              isActive ? "shadow" : ""
            )}
          >
            <Link href={link.href} className="flex items-center gap-3">
              <link.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-semibold">{link.label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
