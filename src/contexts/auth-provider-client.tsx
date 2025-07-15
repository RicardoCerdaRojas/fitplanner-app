
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
        setMemberships,
        setActiveMembership,
        setGymProfile,
        setLoading,
        user
    } = useAuth();

    const fetchAndSetData = useCallback(async (authUser: User) => {
        // Step 1: Fetch user profile
        const userProfileRef = doc(db, 'users', authUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        const profileData = userProfileSnap.exists() ? userProfileSnap.data() as UserProfile : null;
        setUserProfile(profileData);

        // Step 2: If user has no gym, check for and process a pending invitation
        if (authUser.email && profileData && !profileData.gymId) {
            const pendingMembershipRef = doc(db, 'memberships', authUser.email.toLowerCase());
            const pendingSnap = await getDoc(pendingMembershipRef);

            if (pendingSnap.exists() && pendingSnap.data().status === 'pending') {
                const pendingData = pendingSnap.data();
                const batch = writeBatch(db);
                
                const newMembershipRef = doc(db, 'memberships', `${authUser.uid}_${pendingData.gymId}`);
                batch.set(newMembershipRef, {
                    userId: authUser.uid,
                    gymId: pendingData.gymId,
                    role: pendingData.role,
                    userName: profileData.name,
                    gymName: pendingData.gymName,
                    status: 'active',
                });

                const userRef = doc(db, 'users', authUser.uid);
                batch.update(userRef, { gymId: pendingData.gymId, role: pendingData.role });
                
                batch.delete(pendingMembershipRef);
                await batch.commit();
                // After commit, the listeners below will pick up the new data automatically.
            }
        }

        // Step 3: Set up a listener for active memberships
        const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', authUser.uid), where('status', '==', 'active'));
        
        const unsubscribeMemberships = onSnapshot(membershipsQuery, (snapshot) => {
            const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
            setMemberships(fetchedMemberships);

            if (fetchedMemberships.length > 0) {
                const sorted = [...fetchedMemberships].sort((a, b) => {
                    const roles = { 'gym-admin': 0, 'coach': 1, 'member': 2 };
                    return roles[a.role] - roles[b.role];
                });
                const newActiveMembership = sorted[0];
                setActiveMembership(newActiveMembership);

                // Step 4: If there's an active membership, listen for the gym profile
                const unsubscribeGym = onSnapshot(doc(db, 'gyms', newActiveMembership.gymId), (gymDoc) => {
                    setGymProfile(gymDoc.exists() ? ({ id: gymDoc.id, ...gymDoc.data() } as GymProfile) : null);
                    setLoading(false); // DEFINITIVE END: User has membership and gym data is loaded.
                }, () => {
                    setLoading(false); // End loading even if gym fetch fails.
                });
                return () => unsubscribeGym(); // Cleanup gym listener
            } else {
                // DEFINITIVE END: User has no active memberships.
                setActiveMembership(null);
                setGymProfile(null);
                setLoading(false); 
            }
        }, () => {
             setLoading(false); // End loading if membership query fails.
        });

        return () => unsubscribeMemberships(); // Cleanup membership listener

    }, [setActiveMembership, setGymProfile, setLoading, setMemberships, setUserProfile]);

    // This is the primary effect that kicks off the entire data loading sequence.
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                setLoading(true);
                setUser(authUser);
                // The actual data fetching is now handled by the effect below, which listens on `user`.
            } else {
                // Clear all state and stop loading if user signs out.
                setUser(null);
                setUserProfile(null);
                setMemberships([]);
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
        if (user) {
            const unsubscribeData = fetchAndSetData(user);
            return () => {
                unsubscribeData.then(unsub => unsub && unsub());
            };
        }
    }, [user, fetchAndSetData]);
    
    return <>{children}</>;
}
