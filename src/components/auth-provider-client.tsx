
'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, Membership, GymProfile } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const {
        user,
        activeMembership,
        loading,
        setUser,
        setUserProfile,
        setMemberships,
        setActiveMembership,
        setGymProfile,
        setLoading,
    } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Effect for handling Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                // If no user, clear all related state and finish loading
                setUserProfile(null);
                setMemberships([]);
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect for fetching user data (profile, memberships) when user object is available
    useEffect(() => {
        if (!user) return;

        let profileUnsub: (() => void) | undefined;
        let membershipsUnsub: (() => void) | undefined;

        setLoading(true);

        // Fetch user profile
        profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            setUserProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
        });

        // Fetch user memberships
        const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid), where('status', '==', 'active'));
        membershipsUnsub = onSnapshot(membershipsQuery, (snapshot) => {
            const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
            setMemberships(fetchedMemberships);

            if (fetchedMemberships.length > 0) {
                const sorted = [...fetchedMemberships].sort((a, b) => {
                    const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                    return roles[a.role] - roles[b.role];
                });
                setActiveMembership(sorted[0]);
            } else {
                setActiveMembership(null);
                setLoading(false); // Finish loading if no memberships
            }
        }, (error) => {
            console.error("Error fetching memberships:", error);
            setLoading(false);
        });

        return () => {
            if (profileUnsub) profileUnsub();
            if (membershipsUnsub) membershipsUnsub();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Effect for fetching gym profile when active membership changes
    useEffect(() => {
        if (!activeMembership) {
            setGymProfile(null);
            return;
        }

        const unsubGym = onSnapshot(doc(db, 'gyms', activeMembership.gymId), (doc) => {
            setGymProfile(doc.exists() ? ({ id: doc.id, ...doc.data() } as GymProfile) : null);
            setLoading(false); // Finish loading once gym profile is fetched
        }, (error) => {
            console.error("Error fetching gym profile:", error);
            setLoading(false);
        });

        return () => unsubGym();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMembership]);

    // Effect for handling routing logic after authentication state is resolved
    useEffect(() => {
        if (loading) {
            return; // Don't do anything while loading
        }

        const isGuestPage = ['/login', '/signup'].includes(pathname);
        const isCreateGymPage = pathname === '/create-gym';

        if (user) {
            if (isGuestPage) {
                // If user is logged in and on a guest page, redirect to home
                router.replace('/');
                return;
            }

            if (activeMembership) {
                // User has a gym membership
                if (isCreateGymPage) {
                    router.replace('/'); // Don't let them create another gym
                    return;
                }
                // Redirect to the correct dashboard from the root page
                if (pathname === '/') {
                    switch (activeMembership.role) {
                        case 'gym-admin':
                            router.replace('/admin');
                            break;
                        case 'coach':
                            router.replace('/coach');
                            break;
                        // Athlete stays on '/' to see their dashboard
                        default:
                            break;
                    }
                }
            } else {
                // User is logged in but has no membership
                if (!isCreateGymPage) {
                    router.replace('/create-gym');
                }
            }
        } else {
            // No user is logged in
            const isProtectedRoute = !isGuestPage && !isCreateGymPage && pathname !== '/';
            if (isProtectedRoute) {
                router.replace('/login');
            }
        }
    }, [user, activeMembership, loading, pathname, router]);


    // Renders a loading screen for protected pages, or the page itself for public pages
    // This prevents flicker while auth state is being determined.
    if (loading && !['/login', '/signup', '/'].includes(pathname)) {
         return (
            <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-muted-foreground">Loading Your Dashboard...</p>
                </div>
            </div>
        );
    }
    
    // For the root path, we need to show the correct content based on auth state, not just a loader
    if (pathname === '/') {
      if (loading) return (
            <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
      if (user && activeMembership?.role === 'athlete') {
        // Handled by AthleteDashboard component rendered in page.tsx
      } else if (!user) {
        // Handled by GuestHomepage component rendered in page.tsx
      }
    }


    return <>{children}</>;
}
