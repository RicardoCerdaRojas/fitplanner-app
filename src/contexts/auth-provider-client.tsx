
'use client';

import { useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
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

    // Effect to handle the initial auth state change from Firebase
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setLoading(true);
            setUser(authUser); // This will trigger the below effect
        });
        return () => unsubscribeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // This effect runs only when the user object changes (login/logout)
    useEffect(() => {
        if (!user) {
            setUserProfile(null);
            setGymProfile(null);
            setActiveMembership(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        let userUnsubscribe: (() => void) | undefined;
        let gymUnsubscribe: (() => void) | undefined;

        const userProfileRef = doc(db, 'users', user.uid);
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
                                id: `${user.uid}_${profileData.gymId}`,
                                userId: user.uid,
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

        // Cleanup function
        return () => {
            if (userUnsubscribe) userUnsubscribe();
            if (gymUnsubscribe) gymUnsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return <>{children}</>;
}
