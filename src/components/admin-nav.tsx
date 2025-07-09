'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, ClipboardList } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Manage Members', icon: Users },
    { href: '/coach', label: 'Create Routines', icon: ClipboardList },
  ];

  return (
    <nav className="flex items-center gap-2 mb-8 border-b pb-4">
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
  );
}
