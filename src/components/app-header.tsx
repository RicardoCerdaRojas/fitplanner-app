
'use client';
    
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { Dumbbell, LogOut, LogIn, UserPlus, Moon, Sun } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/theme-provider';
import Image from 'next/image';
import { cn } from '@/lib/utils';

function AuthDebugInfo() {
    const { loading, user, activeMembership, memberships } = useAuth();
    return (
        <div className="absolute top-full left-0 w-full bg-yellow-200 text-yellow-900 p-2 text-xs font-mono flex justify-center gap-4 z-50">
            <span>Loading: {loading.toString()}</span>
            <span>User: {user?.email || 'null'}</span>
            <span>Role: {activeMembership?.role || 'null'}</span>
            <span>Memberships: {memberships.length}</span>
        </div>
    )
}

export function AppHeader() {
    const { user, gymProfile, loading } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="w-full max-w-5xl flex items-center justify-between mb-10 relative">
            <AuthDebugInfo />
            <Link href="/" className="flex items-center gap-4 group">
                {gymProfile?.logoUrl ? (
                    <Image src={gymProfile.logoUrl} alt={gymProfile.name ? `${gymProfile.name} Logo` : 'Gym Logo'} width={100} height={50} className="object-contain h-12 w-auto" priority />
                ) : (
                    <Dumbbell className="w-10 h-10 text-primary group-hover:animate-bounce" />
                )}
                <h1 className={cn(
                    "font-headline font-bold text-card-foreground",
                    gymProfile?.logoUrl ? "text-2xl" : "text-4xl"
                )}>
                    {gymProfile?.logoUrl ? 'Fitness Flow' : (gymProfile?.name || 'Fitness Flow')}
                </h1>
            </Link>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={toggleTheme}>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
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
                    <>
                        <Button asChild variant="ghost">
                            <Link href="/login">
                                <LogIn className="mr-2 h-4 w-4" /> Login
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">
                                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                            </Link>
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}
