
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, getDoc, runTransaction, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Global user profile, no gym-specific data
type UserProfile = {
  name: string;
  email: string;
  createdAt: Timestamp;
};

// Represents a user's role within a specific gym
export type Membership = {
    id: string; // {userId}_{gymId}
    userId: string;
    gymId: string;
    role: 'athlete' | 'coach' | 'gym-admin';
    userName: string;
    gymName: string;
    status: 'active' | 'pending';
};

// Profile for a specific gym
type GymProfile = {
    id: string;
    name: string;
    theme?: { [key: string]: string };
    logoUrl?: string;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  memberships: Membership[];
  activeMembership: Membership | null; // The currently selected role/gym
  gymProfile: GymProfile | null; // The profile of the active gym
  loading: boolean;
  setActiveMembership: (membership: Membership | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// Consumes an invitation for a newly signed-up user by creating a membership document.
const consumeInvitation = async (user: User, userProfile: UserProfile) => {
    if (!user.email) return;

    const lowerCaseEmail = user.email.toLowerCase();
    const inviteRef = doc(db, 'invites', lowerCaseEmail);
    const userDocRef = doc(db, 'users', user.uid);

    try {
        await runTransaction(db, async (transaction) => {
            const inviteSnap = await transaction.get(inviteRef);
            if (!inviteSnap.exists()) {
                return; // No invitation found.
            }
            
            const inviteData = inviteSnap.data();
            const gymRef = doc(db, 'gyms', inviteData.gymId);
            const gymSnap = await transaction.get(gymRef);
            const gymName = gymSnap.exists() ? gymSnap.data().name : 'Unknown Gym';

            const membershipRef = doc(db, 'memberships', `${user.uid}_${inviteData.gymId}`);
            const membershipData = {
                userId: user.uid,
                gymId: inviteData.gymId,
                role: inviteData.role,
                userName: userProfile.name,
                gymName: gymName,
                status: 'active'
            };

            // Use set with merge to create or update the membership
            transaction.set(membershipRef, membershipData, { merge: true });
            transaction.delete(inviteRef);

            // Ensure the user document is created/updated if needed
            const userDocSnap = await transaction.get(userDocRef);
            if (!userDocSnap.exists()) {
                 transaction.set(userDocRef, {
                    name: inviteData.name,
                    email: lowerCaseEmail,
                    createdAt: new Date(),
                 });
            }
        });

    } catch (error) {
        console.error("Error consuming invitation:", error);
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setLoading(true);
      setUser(authUser);
      if (!authUser) {
        // User logged out, reset everything
        setUserProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setGymProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch user's global profile
  useEffect(() => {
    if (!user) {
        if (!auth.currentUser) setLoading(false);
        return;
    }
    
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
        } else {
            setUserProfile(null);
        }
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Effect to fetch all of a user's memberships and consume invitation
  useEffect(() => {
    if (!user) return;

    const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(membershipsQuery, async (snapshot) => {
        const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
        
        // Logic to consume invitation on first login if no memberships exist
        if (fetchedMemberships.length === 0 && userProfile) {
            await consumeInvitation(user, userProfile);
        } else {
            setMemberships(fetchedMemberships);
        }
    }, (error) => {
        console.error("Error fetching memberships:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  // Effect to set active membership
  useEffect(() => {
    if (loading || !user) return;

    if (memberships.length > 0) {
        if (!activeMembership || !memberships.find(m => m.id === activeMembership.id)) {
            const sorted = [...memberships].sort((a, b) => {
                const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                return roles[a.role] - roles[b.role];
            });
            setActiveMembership(sorted[0]);
        }
    }
  }, [memberships, user, loading, activeMembership]);

  // Effect to fetch active gym profile
  useEffect(() => {
    if (!activeMembership) {
        if (user && !loading) {
            setGymProfile(null);
        }
        return;
    }

    const gymDocRef = doc(db, 'gyms', activeMembership.gymId);
    const unsubscribe = onSnapshot(gymDocRef, (doc) => {
        if (doc.exists()) {
            setGymProfile({ id: doc.id, ...doc.data() } as GymProfile);
        } else {
            setGymProfile(null);
        }
    }, (error) => {
        console.error('Error fetching gym profile:', error);
        setGymProfile(null);
    });
    return () => unsubscribe();
  }, [activeMembership, user, loading]);

  // Final loading state determination
  useEffect(() => {
    // Stop loading if user is logged out
    if (!user) {
        setLoading(false);
        return;
    }
    // If user is logged in, stop loading only when we have a definitive state
    // (i.e., we have memberships, or we have a profile and know there are no memberships)
    if (user && userProfile !== null) {
        setLoading(false);
    }
  }, [user, userProfile, memberships]);

  const contextValue: AuthContextType = {
    user,
    userProfile,
    memberships,
    activeMembership,
    gymProfile,
    loading,
    setActiveMembership,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
