
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

    // This effect runs only when the user object changes (login/logout)
    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                setLoading(false);
            }
        });

        return () => authUnsubscribe();
    }, [setUser, setLoading]);

    // This effect handles data fetching based on the user's authentication state
    useEffect(() => {
        if (!user) {
            // Clear all data if user logs out
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
                            // Gym document doesn't exist, clear gym-related data
                            setGymProfile(null);
                            setActiveMembership(null);
                        }
                        setLoading(false); // Final loading state
                    });
                    return () => gymUnsubscribe(); // Cleanup gym listener
                } else {
                    // User exists but has no gym/role, clear gym-related data
                    setGymProfile(null);
                    setActiveMembership(null);
                    setLoading(false); // Final loading state
                }
            } else {
                // User document doesn't exist
                setUserProfile(null);
                setGymProfile(null);
                setActiveMembership(null);
                setLoading(false); // Final loading state
            }
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
        });

        return () => userUnsubscribe(); // Cleanup user listener
        
    }, [user, setUserProfile, setGymProfile, setActiveMembership, setLoading]);

    return <>{children}</>;
}
