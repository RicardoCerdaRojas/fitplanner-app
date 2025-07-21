
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

        const unsubscribe = onSnapshot(userProfileRef, async (userDoc) => {
            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                setUserProfile(profileData);

                if (profileData.gymId && profileData.role) {
                    const gymDocRef = doc(db, 'gyms', profileData.gymId);
                    try {
                        // Using a snapshot listener for the gym too for real-time theme changes.
                        const gymUnsubscribe = onSnapshot(gymDocRef, (gymDocSnap) => {
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
                        // We need to return this unsubscribe function to be cleaned up
                        return () => gymUnsubscribe();

                    } catch (error) {
                        console.error("Error fetching gym document:", error);
                        setGymProfile(null);
                        setActiveMembership(null);
                        setLoading(false);
                    }
                } else {
                    setActiveMembership(null);
                    setGymProfile(null);
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setUserProfile(null);
            setActiveMembership(null);
            setGymProfile(null);
            setLoading(false);
        });

        return unsubscribe;

    }, [setActiveMembership, setGymProfile, setLoading, setUserProfile]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setLoading(true);
            if (authUser) {
                setUser(authUser);
            } else {
                setUser(null);
                setUserProfile(null);
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let unsubscribeUser: (() => void) | undefined;
        let unsubscribeGym: (() => void) | undefined;

        if (user) {
            fetchAndSetData(user).then(unsub => {
                if (typeof unsub === 'function') {
                    // This can return a single unsubscribe or a function that returns one
                    const potentialGymUnsub = unsub();
                    if(typeof potentialGymUnsub === 'function') {
                         unsubscribeGym = potentialGymUnsub
                    } else {
                        unsubscribeUser = unsub;
                    }
                }
            });
        }

        return () => {
            if (unsubscribeUser) unsubscribeUser();
            if (unsubscribeGym) unsubscribeGym();
        };
    }, [user, fetchAndSetData]);
    
    return <>{children}</>;
}
