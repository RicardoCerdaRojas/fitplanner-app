
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, GymProfile, Membership } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const {
        setUser,
        user,
        setUserProfile,
        setActiveMembership,
        setGymProfile,
        setLoading,
    } = useAuth();

    // Effect to handle Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                setLoading(false);
            }
        });
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [setUser, setLoading]);

    // Effect to handle Firestore data subscriptions based on user
    useEffect(() => {
        if (!user) {
            setUserProfile(null);
            setGymProfile(null);
            setActiveMembership(null);
            return;
        }

        setLoading(true);
        const userProfileRef = doc(db, 'users', user.uid);
        
        const userUnsubscribe = onSnapshot(userProfileRef, (userDoc) => {
            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                setUserProfile(profileData);

                if (profileData.gymId && profileData.role) {
                    const gymDocRef = doc(db, 'gyms', profileData.gymId);
                    const gymUnsubscribe = onSnapshot(gymDocRef, (gymDocSnap) => {
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
                    return () => gymUnsubscribe();
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

        // Cleanup Firestore subscription
        return () => userUnsubscribe();
    }, [user, setUserProfile, setGymProfile, setActiveMembership, setLoading]);

    return <>{children}</>;
}
