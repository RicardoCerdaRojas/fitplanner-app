
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, getDoc, runTransaction, collection, query, where, getDocs } from 'firebase/firestore';
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

    const inviteRef = doc(db, 'invites', user.email.toLowerCase());

    try {
        const inviteSnap = await getDoc(inviteRef);
        if (!inviteSnap.exists()) {
            return; // No invitation found.
        }
        
        const inviteData = inviteSnap.data();
        const gymRef = doc(db, 'gyms', inviteData.gymId);
        const gymSnap = await getDoc(gymRef);
        const gymName = gymSnap.exists() ? gymSnap.data().name : 'Unknown Gym';

        const membershipRef = doc(db, 'memberships', `${user.uid}_${inviteData.gymId}`);

        // Create the membership and delete the invite in a transaction
        await runTransaction(db, async (transaction) => {
             transaction.set(membershipRef, {
                userId: user.uid,
                gymId: inviteData.gymId,
                role: inviteData.role,
                userName: userProfile.name,
                gymName: gymName,
                status: 'active'
            });
            transaction.delete(inviteRef);
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
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
        } else {
            // This might happen briefly on first signup.
            setUserProfile(null);
        }
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Effect to fetch all of a user's memberships
  useEffect(() => {
    if (!user) return;
    
    const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(membershipsQuery, (snapshot) => {
        const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
        setMemberships(fetchedMemberships);

        // Logic to consume invitation on first login
        if (fetchedMemberships.length === 0 && userProfile) {
            consumeInvitation(user, userProfile);
        }
        
        // If there's no active membership, set one.
        if (!activeMembership && fetchedMemberships.length > 0) {
            // Default to admin > coach > athlete if multiple roles exist
            const sorted = [...fetchedMemberships].sort((a, b) => {
                const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                return roles[a.role] - roles[b.role];
            });
            setActiveMembership(sorted[0]);
        } else if (activeMembership) {
            // If active membership is no longer valid, clear it.
            if (!fetchedMemberships.find(m => m.id === activeMembership.id)) {
                setActiveMembership(null);
            }
        }

    }, (error) => {
        console.error("Error fetching memberships:", error);
    });
    
    return () => unsubscribe();
  }, [user, userProfile, activeMembership]);

  // Effect to fetch active gym profile based on active membership
  useEffect(() => {
    if (activeMembership?.gymId) {
        const gymDocRef = doc(db, 'gyms', activeMembership.gymId);
        const unsubscribe = onSnapshot(gymDocRef, (doc) => {
            if (doc.exists()) {
                setGymProfile({ id: doc.id, ...doc.data() } as GymProfile);
            } else {
                setGymProfile(null);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching gym profile:', error);
            setGymProfile(null);
            setLoading(false);
        });
        return () => unsubscribe();
    } else if (user && memberships.length === 0) {
        // User is logged in but has no memberships, stop loading
        setGymProfile(null);
        setLoading(false);
    }
  }, [activeMembership, user, memberships]);
  

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
