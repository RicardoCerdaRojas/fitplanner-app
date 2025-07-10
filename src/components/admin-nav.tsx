'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, ClipboardList, Layers, Palette, LayoutDashboard } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/members', label: 'Manage Members', icon: Users },
    { href: '/admin/routine-types', label: 'Routine Types', icon: Layers },
    { href: '/admin/settings', label: 'Gym Branding', icon: Palette },
    { href: '/coach', label: 'Create Routines', icon: ClipboardList },
  ];

  return (
    <nav className="grid grid-cols-2 gap-2 mb-8 border-b pb-4 md:flex md:items-center">
      {links.map((link) => (
        <Button
          key={link.href}
          asChild
          variant={pathname === link.href ? 'default' : 'ghost'}
          className="font-semibold justify-start"
        >
          <Link href={link.href}>
            <link.icon className="mr-2 h-4 w-4" />
            {link.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
