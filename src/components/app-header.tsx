
'use client';
    
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from './ui/avatar';
import { ThemeToggle } from './ui/theme-toggle';

export function AppHeader() {
    const { user, userProfile, activeMembership, gymProfile, loading, isTrialActive } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };
    
    const isTransparentHeader = (!user && ['/', '/login', '/create-gym', '/join'].includes(pathname)) || (user && !activeMembership) || isTrialActive === false;

    // --- Lógica de Renderizado del Logo con Diagnóstico ---
    const renderLogo = () => {
        const logoUrl = gymProfile?.logoUrl;
        const gymName = gymProfile?.name;

        // --- DIAGNOSTIC LOGGING RC2---
        console.log('[AppHeader Diagnostics] ====================');
        console.log(`[AppHeader Diagnostics] logoUrl value: ${logoUrl}`);
        console.log(`[AppHeader Diagnostics] isTransparentHeader: ${isTransparentHeader}`);

        if (logoUrl && !isTransparentHeader) {
            console.log('[AppHeader Diagnostics] Condition MET: logoUrl is present and header is NOT transparent.');
            if (logoUrl.includes('firebasestorage.googleapis.com')) {
                console.log('[AppHeader Diagnostics] Decision: Using Next.js <Image> component for Firebase URL.');
                return <Image src={logoUrl} alt={gymName ? `${gymName} Logo` : 'Gym Logo'} width={100} height={50} className="object-contain h-10 w-auto" priority />;
            } else {
                console.log('[AppHeader Diagnostics] Decision: Using standard <img> tag for non-Firebase URL.');
                // eslint-disable-next-line @next/next/no-img-element
                return <img src={logoUrl} alt={gymName ? `${gymName} Logo` : 'Gym Logo'} className="object-contain h-10 w-auto" />;
            }
        } else if (gymName && !isTransparentHeader) {
            console.log('[AppHeader Diagnostics] Decision: Rendering gym name as text.');
            return <h1 className="font-headline font-bold text-card-foreground text-xl">{gymName}</h1>;
        } else {
            console.log('[AppHeader Diagnostics] Decision: Rendering default "Fit Planner" text.');
            return <h1 className={cn("text-2xl font-black tracking-tight", isTransparentHeader ? "text-white" : "text-card-foreground")}>Fit Planner</h1>;
        }
    };

    return (
        <header className={cn(
            "w-full p-4",
            isTransparentHeader ? "absolute top-0 z-20 bg-black/10 backdrop-blur-sm" : "sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        )}>
            <div className="container mx-auto flex h-full items-center max-w-7xl">
                <Link href="/" className="flex items-center gap-4 group mr-6">
                    {renderLogo()}
                </Link>

                {pathname === '/' && !user && (
                    <nav className="hidden md:flex items-center gap-8 flex-1">
                        <Link href="#problem" className="text-white hover:text-gray-300 transition-colors text-sm font-medium">El Problema</Link>
                        <Link href="#solution" className="text-white hover:text-gray-300 transition-colors text-sm font-medium">La Solución</Link>
                        <Link href="#wow-factor" className="text-white hover:text-gray-300 transition-colors text-sm font-medium">La Magia</Link>
                        <Link href="#pricing" className="text-white hover:text-gray-300 transition-colors text-sm font-medium">Precios</Link>
                    </nav>
                )}

                <div className="flex flex-1 items-center justify-end gap-2">
                    {!isTransparentHeader && <ThemeToggle />}
                    
                    {loading ? (
                        <Skeleton className="h-9 w-24 rounded-md" />
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className={cn("relative h-9 w-9 rounded-full border-2", isTransparentHeader ? "border-white/20 hover:bg-white/10" : "border-primary/20")}>
                                    <Avatar className="h-8 w-8">
                                         <AvatarFallback className={cn(isTransparentHeader && "bg-transparent text-white")}>{userProfile?.name?.charAt(0) || user.email?.charAt(0) || <UserIcon />}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{userProfile?.name || 'User'}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className='flex items-center gap-2'>
                             <Button asChild className={cn(isTransparentHeader ? "bg-white text-black hover:bg-gray-200" : "bg-primary text-primary-foreground")}>
                                <Link href="/create-gym">Comenzar Prueba</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
