'use client';
    
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { Dumbbell, LogOut, LogIn, UserPlus } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';

export function AppHeader() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    return (
        <header className="w-full max-w-5xl flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-4 group">
                <Dumbbell className="w-10 h-10 text-primary group-hover:animate-bounce" />
                <h1 className="font-headline text-4xl font-bold text-card-foreground">
                    Fitness Flow
                </h1>
            </Link>
            <div className="flex items-center gap-2">
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
