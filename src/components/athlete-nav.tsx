'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ClipboardList, WandSparkles, BarChart3 } from 'lucide-react';

export function AthleteNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'My Routines', icon: ClipboardList },
    { href: '/stats', label: 'My Stats', icon: BarChart3 },
    { href: '/generate-routine', label: 'AI Generator', icon: WandSparkles },
  ];

  return (
    <nav className="flex items-center gap-2 mb-4 border-b pb-4">
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
