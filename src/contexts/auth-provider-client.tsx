
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, GymProfile } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const {
        user,
        setUser,
        setUserProfile,
        setActiveMembership,
        setGymProfile,
        setLoading,
    } = useAuth();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [setUser, setLoading]);

    useEffect(() => {
        if (!user) {
            setUserProfile(null);
            setGymProfile(null);
            setActiveMembership(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const userProfileRef = doc(db, 'users', user.uid);

        const userUnsubscribe = onSnapshot(userProfileRef, (userDoc) => {
            let gymUnsubscribe: (() => void) | undefined;

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

            return () => {
                if (gymUnsubscribe) gymUnsubscribe();
            };
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
        });

        return () => userUnsubscribe();
    }, [user, setUserProfile, setGymProfile, setActiveMembership, setLoading]);

    return <>{children}</>;
}
