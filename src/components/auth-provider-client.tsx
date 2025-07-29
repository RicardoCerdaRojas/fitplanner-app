
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, GymProfile, Membership } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const {
        setUser,
        setUserProfile,
        setActiveMembership,
        setGymProfile,
        setLoading,
        user
    } = useAuth();

    // Effect to listen to user document and gym document
    useEffect(() => {
        let userUnsubscribe: (() => void) | undefined;
        let gymUnsubscribe: (() => void) | undefined;

        const setupListeners = (authUser: User) => {
            const userProfileRef = doc(db, 'users', authUser.uid);
            userUnsubscribe = onSnapshot(userProfileRef, (userDoc) => {
                if (userDoc.exists()) {
                    const profileData = userDoc.data() as UserProfile;
                    setUserProfile(profileData);

                    if (profileData.gymId && profileData.role) {
                        const gymDocRef = doc(db, 'gyms', profileData.gymId);
                        gymUnsubscribe = onSnapshot(gymDocRef, (gymDocSnap) => {
                            if (gymDocSnap.exists()) {
                                const gymData = gymDocSnap.data() as Omit<GymProfile, 'id'>;
                                setGymProfile({ id: gymDocSnap.id, ...gymData });
                                setActiveMembership({
                                    id: `${authUser.uid}_${profileData.gymId}`,
                                    userId: authUser.uid,
                                    gymId: profileData.gymId,
                                    role: profileData.role,
                                    userName: profileData.name,
                                    gymName: gymData.name,
                                    status: 'active',
                                });
                            } else {
                                setGymProfile(null);
                                setActiveMembership(null);
                            }
                            setLoading(false);
                        });
                    } else {
                        setGymProfile(null);
                        setActiveMembership(null);
                        setLoading(false);
                    }
                } else {
                    setUserProfile(null);
                    setGymProfile(null);
                    setActiveMembership(null);
                    setLoading(false);
                }
            });
        };

        if (user) {
            setupListeners(user);
        } else {
            setUserProfile(null);
            setGymProfile(null);
            setActiveMembership(null);
            setLoading(false);
        }

        return () => {
            if (userUnsubscribe) userUnsubscribe();
            if (gymUnsubscribe) gymUnsubscribe();
        };
    }, [user, setUserProfile, setGymProfile, setActiveMembership, setLoading]);

    // Effect for initial auth check
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            // DO NOT set loading to true here. This is the source of the infinite loop.
            // Loading is only true on the very first load, managed by AuthProvider itself.
            setUser(authUser);
        });
        return () => unsubscribeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    return <>{children}</>;
}
