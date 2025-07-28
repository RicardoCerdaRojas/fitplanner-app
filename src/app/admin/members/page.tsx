
'use client';
import { AppHeader } from '@/components/app-header';
import { AdminUserManagement } from '@/components/admin-user-management';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminBottomNav } from '@/components/admin-bottom-nav';

export default function AdminMembersPage() {
    const { activeMembership, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center p-4 sm:p-8">
                <AppHeader />
                <div className="w-full max-w-6xl space-y-8 mt-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
                 <p className='mt-8 text-lg text-muted-foreground'>Verifying admin access...</p>
            </div>
        );
    }
    
    if (!activeMembership || activeMembership.role !== 'gym-admin') {
        router.push('/');
        return null;
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
             <main className="flex-1 flex flex-col items-center p-4 sm:p-8 pb-28 md:pb-8">
                 <div className="w-full max-w-4xl">
                    <h1 className="text-3xl font-bold font-headline mb-4">Admin Dashboard</h1>
                    <AdminBottomNav />
                    {activeMembership.gymId && <AdminUserManagement gymId={activeMembership.gymId} />}
                 </div>
            </main>
             <footer className="w-full text-center p-4 text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Fitness Flow. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
