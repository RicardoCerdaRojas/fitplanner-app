
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
                        const gymDocSnap = await getDoc(gymDocRef);

                        if (gymDocSnap.exists()) {
                            const gymData = gymDocSnap.data() as Omit<GymProfile, 'id'>;
                            setGymProfile({ id: gymDocSnap.id, ...gymData });
                            
                            // Derive activeMembership directly from user profile and gym data
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
                            // Gym doesn't exist, treat as no membership
                            setGymProfile(null);
                            setActiveMembership(null);
                        }
                    } catch (error) {
                        console.error("Error fetching gym document:", error);
                        // This might be a permissions error during initial load.
                        // We still set loading to false to unblock the UI.
                        setGymProfile(null);
                        setActiveMembership(null);
                    }
                } else {
                    // User has no gymId or role
                    setActiveMembership(null);
                    setGymProfile(null);
                }
            } else {
                // User document does not exist
                setUserProfile(null);
                setActiveMembership(null);
                setGymProfile(null);
            }
            setLoading(false); // End loading after all data is processed
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
