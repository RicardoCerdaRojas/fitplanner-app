
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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

    // Effect to listen to user document and gym document
    useEffect(() => {
        let userUnsubscribe: (() => void) | undefined;
        let gymUnsubscribe: (() => void) | undefined;

        const setupListeners = (authUser: User) => {
            const userProfileRef = doc(db, 'users', authUser.uid);
            userUnsubscribe = onSnapshot(userProfileRef, (userDoc) => {
                if (userDoc.exists()) {
                    const profileData = userDoc.data() as UserProfile;
                    setUserProfile(profileData);

                    // Check if gymId and role exist on the profile
                    if (profileData.gymId && profileData.role) {
                        // Capture the validated values in constants to preserve their types
                        const validatedGymId = profileData.gymId;
                        const validatedRole = profileData.role;

                        const gymDocRef = doc(db, 'gyms', validatedGymId);
                        gymUnsubscribe = onSnapshot(gymDocRef, (gymDocSnap) => {
                            if (gymDocSnap.exists()) {
                                const gymData = gymDocSnap.data() as Omit<GymProfile, 'id'>;
                                setGymProfile({ id: gymDocSnap.id, ...gymData });
                                
                                // Now use the validated constants, which TypeScript knows are strings
                                setActiveMembership({
                                    id: `${authUser.uid}_${validatedGymId}`,
                                    userId: authUser.uid,
                                    gymId: validatedGymId,
                                    role: validatedRole,
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
                        // If user has no gymId or role, they have no active membership
                        setGymProfile(null);
                        setActiveMembership(null);
                        setLoading(false);
                    }
                } else {
                    // If user profile doesn't exist
                    setUserProfile(null);
                    setGymProfile(null);
                    setActiveMembership(null);
                    setLoading(false);
                }
            });
        };

        if (user) {
            setupListeners(user);
        } else {
            // If no authenticated user
            setUserProfile(null);
            setGymProfile(null);
            setActiveMembership(null);
            setLoading(false);
        }

        // Cleanup listeners on unmount or when user changes
        return () => {
            if (userUnsubscribe) userUnsubscribe();
            if (gymUnsubscribe) gymUnsubscribe();
        };
    }, [user, setUserProfile, setGymProfile, setActiveMembership, setLoading]);

    // Effect for initial auth check
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
        });
        return () => unsubscribeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    return <>{children}</>;
}
