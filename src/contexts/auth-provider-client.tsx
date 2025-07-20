
'use client';

import { useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDoc, writeBatch } from 'firebase/firestore';
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

                if (profileData.gymId) {
                    // User has a gym, let's fetch gym and membership details.
                    const gymRef = doc(db, 'gyms', profileData.gymId);
                    const membershipRef = doc(db, 'memberships', `${authUser.uid}_${profileData.gymId}`);

                    // Use Promise.all to fetch them in parallel for speed.
                    try {
                        const [gymSnap, membershipSnap] = await Promise.all([
                            getDoc(gymRef),
                            getDoc(membershipRef)
                        ]);
                        
                        if (gymSnap.exists()) {
                            setGymProfile({ id: gymSnap.id, ...gymSnap.data() } as GymProfile);
                        } else {
                            setGymProfile(null);
                        }

                        if (membershipSnap.exists()) {
                             setActiveMembership({ id: membershipSnap.id, ...membershipSnap.data() } as Membership);
                        } else {
                            // This is an inconsistent state, user has gymId but no membership doc.
                            // Clear active membership to prevent issues.
                            setActiveMembership(null);
                        }

                    } catch (error) {
                        console.error("Error fetching gym/membership details:", error);
                        setActiveMembership(null);
                        setGymProfile(null);
                    }
                } else {
                    // User does not have a gymId, they are not part of any gym.
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
        });
        return () => unsubscribeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // This effect responds to the user object being set by onAuthStateChanged.
    useEffect(() => {
        let unsubscribe: () => void;
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
