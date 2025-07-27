
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, Membership, GymProfile } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const {
        user,
        setUser,
        setUserProfile,
        setActiveMembership,
        setGymProfile,
        setLoading,
    } = useAuth();

    // Effect to handle the initial auth state change from Firebase
    useEffect(() => {
        setLoading(true);
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    // This effect should only run once on mount to set up the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // Effect to fetch user data when the user object changes (login/logout)
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
                            // User has a gymId, but the gym doc doesn't exist
                            setGymProfile(null);
                            setActiveMembership(null);
                        }
                        setLoading(false);
                    });
                } else {
                    // User exists but has no gymId or role
                    setGymProfile(null);
                    setActiveMembership(null);
                    setLoading(false);
                }
            } else {
                // User document doesn't exist in Firestore
                setUserProfile(null);
                setGymProfile(null);
                setActiveMembership(null);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
        });

        // Cleanup function for this effect
        return () => {
            if (userUnsubscribe) userUnsubscribe();
            if (gymUnsubscribe) gymUnsubscribe();
        };
    // This effect should ONLY depend on the user object.
    }, [user, setUser, setUserProfile, setGymProfile, setActiveMembership, setLoading]);

    return <>{children}</>;
}
