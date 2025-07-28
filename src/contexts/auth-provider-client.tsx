
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, GymProfile, Membership } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const { 
        user, 
        _setUser, 
        _setUserProfile, 
        _setActiveMembership, 
        _setGymProfile, 
        _setLoading 
    } = useAuth();

    // Effect 1: Manages the raw Firebase Auth state.
    // This is the entry point for our entire auth flow.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            _setUser(authUser);
            if (!authUser) {
                // If there's no user, we are done loading.
                _setLoading(false);
            }
        });
        
        // Cleanup the subscription on component unmount
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Effect 2: Manages fetching and subscribing to user data from Firestore.
    // This effect runs ONLY when the user's authentication state changes.
    useEffect(() => {
        if (!user) {
            // User is logged out, clear all profile data.
            _setUserProfile(null);
            _setGymProfile(null);
            _setActiveMembership(null);
            return;
        }

        // Start loading user-specific data.
        _setLoading(true);

        const userProfileRef = doc(db, 'users', user.uid);
        const userUnsubscribe = onSnapshot(userProfileRef, (userDoc) => {
            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                _setUserProfile(profileData);

                if (profileData.gymId && profileData.role) {
                    const gymDocRef = doc(db, 'gyms', profileData.gymId);
                    
                    const gymUnsubscribe = onSnapshot(gymDocRef, (gymDocSnap) => {
                        if (gymDocSnap.exists()) {
                            const gymData = gymDocSnap.data() as Omit<GymProfile, 'id'>;
                            _setGymProfile({ id: gymDocSnap.id, ...gymData });
                            _setActiveMembership({
                                id: `${user.uid}_${profileData.gymId}`,
                                userId: user.uid,
                                gymId: profileData.gymId,
                                role: profileData.role,
                                userName: profileData.name,
                                gymName: gymData.name,
                                status: 'active',
                            });
                        } else {
                            // Gym document was deleted or doesn't exist
                            _setGymProfile(null);
                            _setActiveMembership(null);
                        }
                        // We are done loading data for this user.
                        _setLoading(false);
                    });

                    // Return cleanup function for gym listener
                    return () => gymUnsubscribe();

                } else {
                    // User exists but has no gym/role assigned
                    _setGymProfile(null);
                    _setActiveMembership(null);
                    _setLoading(false);
                }
            } else {
                // User document doesn't exist in Firestore
                _setUserProfile(null);
                _setGymProfile(null);
                _setActiveMembership(null);
                _setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching user profile:", error);
            _setLoading(false);
        });

        // Cleanup the user profile listener when the user object changes
        return () => userUnsubscribe();
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // This effect ONLY depends on the user object.

    return <>{children}</>;
}
