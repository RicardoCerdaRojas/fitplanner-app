
'use client';
    
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { Dumbbell, LogOut, LogIn, UserPlus, Moon, Sun } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/theme-provider';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function AppHeader() {
    const { user, userProfile, activeMembership, gymProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };
    
    // Determine if we are on the guest homepage to apply specific styles
    const isGuestHomepage = !user && pathname === '/';

    return (
        <header className="w-full flex items-center justify-between mb-10 relative max-w-7xl mx-auto py-4">
            <Link href="/" className="flex items-center gap-4 group">
                {gymProfile?.logoUrl && !isGuestHomepage ? (
                    <Image src={gymProfile.logoUrl} alt={gymProfile.name ? `${gymProfile.name} Logo` : 'Gym Logo'} width={100} height={50} className="object-contain h-12 w-auto" priority />
                ) : (
                    <h1 className={cn(
                        "font-headline font-bold",
                        isGuestHomepage ? "text-2xl text-white" : "text-4xl text-card-foreground"
                    )}>
                        FITNESS FLOW
                    </h1>
                )}
                 {!isGuestHomepage && gymProfile?.name && (
                    <h1 className={cn(
                        "font-headline font-bold text-card-foreground",
                        gymProfile?.logoUrl ? "text-2xl" : "text-4xl"
                    )}>
                        {gymProfile.name}
                    </h1>
                )}
            </Link>

            {isGuestHomepage && (
                 <nav className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-white hover:text-gray-300 transition-colors">Features</Link>
                    <Link href="#about" className="text-white hover:text-gray-300 transition-colors">About</Link>
                    <Link href="#contact" className="text-white hover:text-gray-300 transition-colors">Contact</Link>
                </nav>
            )}

            <div className="flex items-center gap-2">
                 {!isGuestHomepage && (
                    <Button variant="outline" size="icon" onClick={toggleTheme}>
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                 )}
                {loading ? (
                    <Skeleton className="h-10 w-40 rounded-md" />
                ) : user ? (
                    <>
                        <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-0 sm:mr-2 h-4 w-4" /> <span className='hidden sm:inline'>Logout</span>
                        </Button>
                    </>
                ) : (
                     <div className='flex items-center gap-2'>
                        <Button asChild variant="secondary" className="bg-white text-gray-800 hover:bg-gray-200">
                            <Link href="/login">
                                Login
                            </Link>
                        </Button>
                         <Button asChild className="bg-[#3A7CFD] hover:bg-[#3a7cfd]/90 text-white">
                            <Link href="/signup">
                                Sign Up
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}
