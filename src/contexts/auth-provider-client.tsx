
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
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

    // Effect for initial auth check
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // Effect to listen to user document and gym document
    useEffect(() => {
        if (!user) {
            setUserProfile(null);
            setGymProfile(null);
            setActiveMembership(null);
            setLoading(false);
            return;
        }

        const userProfileRef = doc(db, 'users', user.uid);
        const userUnsubscribe = onSnapshot(userProfileRef, (userDoc) => {
            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                setUserProfile(profileData);

                // Check if gymId and role exist on the profile
                if (profileData.gymId && profileData.role) {
                    // Capture the validated values in constants to preserve their types
                    const validatedGymId = profileData.gymId;
                    const validatedRole = profileData.role;

                    const gymDocRef = doc(db, 'gyms', validatedGymId);
                    const gymUnsubscribe = onSnapshot(gymDocRef, (gymDocSnap) => {
                        if (gymDocSnap.exists()) {
                            const gymData = gymDocSnap.data() as Omit<GymProfile, 'id'>;
                            setGymProfile({ id: gymDocSnap.id, ...gymData });
                            
                            // Now use the validated constants, which TypeScript knows are strings
                            setActiveMembership({
                                id: `${user.uid}_${validatedGymId}`,
                                userId: user.uid,
                                gymId: validatedGymId,
                                role: validatedRole,
                                userName: profileData.name,
                                gymName: gymData.name,
                                status: 'active',
                            });
                        } else {
                            // The user's gym doesn't exist.
                            setGymProfile(null);
                            setActiveMembership(null);
                        }
                        setLoading(false);
                    });
                    return () => gymUnsubscribe();
                } else {
                    // User has no gym or role assigned.
                    setGymProfile(null);
                    setActiveMembership(null);
                    setLoading(false);
                }
            } else {
                // User profile does not exist.
                setUserProfile(null);
                setGymProfile(null);
                setActiveMembership(null);
                setLoading(false);
            }
        });

        return () => userUnsubscribe();
    }, [user, setUser, setUserProfile, setGymProfile, setActiveMembership, setLoading]);

    return <>{children}</>;
}
