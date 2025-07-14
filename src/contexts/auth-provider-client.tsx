
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
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
        setIsTrialActive,
        setLoading,
        user,
        activeMembership
    } = useAuth();

    // Effect for handling Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                // If no user, clear all related state and finish loading
                setUserProfile(null);
                setMemberships([]);
                setActiveMembership(null);
                setGymProfile(null);
                setIsTrialActive(false);
                setLoading(false);
            }
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect for fetching user data (profile, memberships) when user object is available
    useEffect(() => {
        if (!user) return;

        let profileUnsub: (() => void) | undefined;
        let membershipsUnsub: (() => void) | undefined;

        setLoading(true);

        // Fetch user profile
        profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            setUserProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
        });

        // Fetch user memberships
        const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid), where('status', '==', 'active'));
        membershipsUnsub = onSnapshot(membershipsQuery, (snapshot) => {
            const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
            setMemberships(fetchedMemberships);

            if (fetchedMemberships.length > 0) {
                const sorted = [...fetchedMemberships].sort((a, b) => {
                    const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                    return roles[a.role] - roles[b.role];
                });
                setActiveMembership(sorted[0]);
            } else {
                setActiveMembership(null);
                setLoading(false); // Finish loading if no memberships
            }
        }, (error) => {
            console.error("Error fetching memberships:", error);
            setLoading(false);
        });

        return () => {
            if (profileUnsub) profileUnsub();
            if (membershipsUnsub) membershipsUnsub();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Effect for fetching gym profile when active membership changes
    useEffect(() => {
        if (!activeMembership) {
            setGymProfile(null);
            // If user exists but has no active membership, they are done loading
            if (user) {
                setLoading(false);
            }
            return;
        }

        const unsubGym = onSnapshot(doc(db, 'gyms', activeMembership.gymId), (doc) => {
            setGymProfile(doc.exists() ? ({ id: doc.id, ...doc.data() } as GymProfile) : null);
            setLoading(false); // Finish loading once gym profile is fetched
        }, (error) => {
            console.error("Error fetching gym profile:", error);
            setLoading(false);
        });

        return () => unsubGym();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMembership, user]);
    
    return <>{children}</>;
}
