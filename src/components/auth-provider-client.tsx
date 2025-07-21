
'use client';

import { useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, GymProfile } from '@/contexts/auth-context';

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
        // This function now uses onSnapshot for real-time updates.
        const userProfileRef = doc(db, 'users', authUser.uid);

        const unsubscribe = onSnapshot(userProfileRef, async (userDoc) => {
            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                setUserProfile(profileData);

                if (profileData.gymId && profileData.role) {
                    const gymDocRef = doc(db, 'gyms', profileData.gymId);
                    
                    // We can use a snapshot listener for the gym too, or a one-time get
                    const gymDocSnap = await getDoc(gymDocRef);

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
                } else {
                    setActiveMembership(null);
                    setGymProfile(null);
                }
            } else {
                setUserProfile(null);
                setActiveMembership(null);
                setGymProfile(null);
            }
            setLoading(false); 
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
            setLoading(true); // Always start loading on auth state change
            if (authUser) {
                setUser(authUser);
                // Data fetching is now handled by the next effect that depends on `user`
            } else {
                // Clear all state and stop loading
                setUser(null);
                setUserProfile(null);
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only runs once on mount

    useEffect(() => {
        let unsubscribeUser: (() => void) | undefined;
        
        if (user) {
            fetchAndSetData(user).then(unsub => {
                if (unsub) {
                    unsubscribeUser = unsub;
                }
            });
        }

        return () => {
            if (unsubscribeUser) {
                unsubscribeUser();
            }
        };
    }, [user, fetchAndSetData]);
    
    return <>{children}</>;
}
