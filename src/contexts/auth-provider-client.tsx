
'use client';

import { useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, Membership, GymProfile } from '@/contexts/auth-context';

export function AuthProviderClient({ children }: { children: ReactNode }) {
    const {
        setUser,
        setUserProfile,
        setMemberships,
        setActiveMembership,
        setGymProfile,
        setLoading,
        user
    } = useAuth();

    // Effect for handling Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setLoading(true);
            if (!authUser) {
                // If no user, clear all related state and finish loading
                setUser(null);
                setUserProfile(null);
                setMemberships([]);
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false);
            } else {
                setUser(authUser);
            }
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const processUserData = useCallback(async (user: import('firebase/auth').User) => {
        const userProfileDoc = await getDoc(doc(db, 'users', user.uid));
        const profileData = userProfileDoc.exists() ? userProfileDoc.data() as UserProfile : null;
        setUserProfile(profileData);

        // Check for a pending membership ONLY if the user doesn't already have a gymId
        if (user.email && profileData && !profileData.gymId) {
            const pendingMembershipRef = doc(db, 'memberships', user.email.toLowerCase());
            const pendingSnap = await getDoc(pendingMembershipRef);

            if (pendingSnap.exists() && pendingSnap.data().status === 'pending') {
                const pendingData = pendingSnap.data();
                const batch = writeBatch(db);
                const newMembershipId = `${user.uid}_${pendingData.gymId}`;
                const newMembershipRef = doc(db, 'memberships', newMembershipId);
                batch.set(newMembershipRef, {
                    userId: user.uid,
                    gymId: pendingData.gymId,
                    role: pendingData.role,
                    userName: profileData.name,
                    gymName: pendingData.gymName,
                    status: 'active',
                });
                const userRef = doc(db, 'users', user.uid);
                batch.update(userRef, { gymId: pendingData.gymId, role: pendingData.role });
                batch.delete(pendingMembershipRef);
                await batch.commit();
                // After commit, the listeners below will pick up the new active membership
            }
        }

        const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid), where('status', '==', 'active'));
        const unsubscribeMemberships = onSnapshot(membershipsQuery, (snapshot) => {
            const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
            setMemberships(fetchedMemberships);

            if (fetchedMemberships.length > 0) {
                const sorted = [...fetchedMemberships].sort((a, b) => {
                    const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                    return roles[a.role] - roles[b.role];
                });
                const newActiveMembership = sorted[0];
                setActiveMembership(newActiveMembership);

                const unsubGym = onSnapshot(doc(db, 'gyms', newActiveMembership.gymId), (gymDoc) => {
                    setGymProfile(gymDoc.exists() ? ({ id: gymDoc.id, ...gymDoc.data() } as GymProfile) : null);
                    setLoading(false); // Definitive loading end point for a user with a gym
                });
                return () => unsubGym();
            } else {
                // If after all checks, there's still no membership, we are done loading
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false); // Definitive loading end point for a user without a gym
            }
        });
        
        return () => unsubscribeMemberships();

    }, [setActiveMembership, setGymProfile, setLoading, setMemberships, setUserProfile]);


    // Master effect to orchestrate data loading when user object changes
    useEffect(() => {
        if (user) {
            const unsubscribe = processUserData(user);
            return () => {
                unsubscribe.then(unsub => unsub && unsub());
            };
        }
    }, [user, processUserData]);
    
    return <>{children}</>;
}
