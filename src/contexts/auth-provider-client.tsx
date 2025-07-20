
'use client';

import { useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, Membership, GymProfile } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const {
        setUser,
        setUserProfile,
        setActiveMembership,
        setGymProfile,
        setLoading,
        user
    } = useAuth();

    const fetchAndSetData = useCallback(async (authUser: User) => {
        const userProfileRef = doc(db, 'users', authUser.uid);

        // This is our main listener for all user-related data.
        const unsubscribe = onSnapshot(userProfileRef, async (userDoc) => {
            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                setUserProfile(profileData);

                // DERIVE activeMembership from userProfile
                if (profileData.gymId && profileData.role) {
                    const gymRef = doc(db, 'gyms', profileData.gymId);
                    const gymSnap = await getDoc(gymRef);
                    const gymName = gymSnap.exists() ? gymSnap.data().name : 'Unknown Gym';

                    setActiveMembership({
                        id: `${authUser.uid}_${profileData.gymId}`,
                        userId: authUser.uid,
                        gymId: profileData.gymId,
                        role: profileData.role,
                        userName: profileData.name,
                        gymName: gymName,
                        status: 'active',
                    });

                    if (gymSnap.exists()) {
                        setGymProfile({ id: gymSnap.id, ...gymSnap.data() } as GymProfile);
                    } else {
                        setGymProfile(null);
                    }

                } else {
                    // User does not have a gymId/role, they are not part of any gym.
                    setActiveMembership(null);
                    setGymProfile(null);
                }
            } else {
                // User document doesn't exist.
                setUserProfile(null);
                setActiveMembership(null);
                setGymProfile(null);
            }
            // All data fetching paths conclude here.
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setLoading(false);
        });

        return unsubscribe;

    }, [setActiveMembership, setGymProfile, setLoading, setUserProfile]);

    // This is the primary effect that kicks off the entire data loading sequence.
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                setLoading(true);
                setUser(authUser);
            } else {
                setUser(null);
                setUserProfile(null);
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false);
            }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // This effect responds to the user object being set by onAuthStateChanged.
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (user) {
            fetchAndSetData(user).then(unsub => {
                if (unsub) unsubscribe = unsub;
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, fetchAndSetData]);
    
    return <>{children}</>;
}
