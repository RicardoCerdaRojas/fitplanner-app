
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, runTransaction, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Global user profile, no gym-specific data
type UserProfile = {
  name: string;
  email: string;
  createdAt: Timestamp;
  dob?: Timestamp; // Added for athlete profiles created via AI generator
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
const consumeInvitation = async (user: User) => {
    if (!user.email) return false;

    const lowerCaseEmail = user.email.toLowerCase();
    const inviteRef = doc(db, 'invites', lowerCaseEmail);
    const userDocRef = doc(db, 'users', user.uid);
    let consumed = false;

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
            
            const userData = {
                name: inviteData.name,
                email: lowerCaseEmail,
                createdAt: new Date(),
                dob: inviteData.dob || null, // Carry over DOB if it exists
            };

            const membershipData = {
                userId: user.uid,
                gymId: inviteData.gymId,
                role: inviteData.role,
                userName: inviteData.name,
                gymName: gymName,
                status: 'active'
            };
            
            transaction.set(userDocRef, userData, { merge: true });
            transaction.set(membershipRef, membershipData);
            transaction.delete(inviteRef);
            consumed = true;
        });
        return consumed;
    } catch (error) {
        console.error("Error consuming invitation:", error);
        return false;
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setLoading(true);
      setUser(authUser);
      if (!authUser) {
        // Clear all state on logout
        setUserProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setGymProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      // If user is logged out, no further data fetching needed.
      // The loading state is handled by the auth state change.
      return;
    }

    // Set up listeners for user profile and memberships
    const profileRef = doc(db, 'users', user.uid);
    const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    
    let profileUnsub: (() => void) | null = null;
    let membershipsUnsub: (() => void) | null = null;

    const loadData = async () => {
        let profileData: UserProfile | null = null;
        let membershipsData: Membership[] | null = null;
    
        const checkCompletion = () => {
            // Only stop loading when both profile and memberships have been loaded.
            if (profileData !== null && membershipsData !== null) {
                setUserProfile(profileData);
                setMemberships(membershipsData);
                const sorted = [...membershipsData].sort((a, b) => {
                    const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                    return roles[a.role] - roles[b.role];
                });
                setActiveMembership(sorted[0] || null);
                setLoading(false);
            }
        };

        profileUnsub = onSnapshot(profileRef, (docSnap) => {
            profileData = docSnap.exists() ? (docSnap.data() as UserProfile) : { name: '', email: '', createdAt: Timestamp.now() }; // Provide a default object to signal completion
            checkCompletion();
        }, (error) => {
            console.error("Error fetching user profile:", error);
            profileData = { name: '', email: '', createdAt: Timestamp.now() };
            checkCompletion();
        });

        membershipsUnsub = onSnapshot(membershipsQuery, async (snapshot) => {
            if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
                const consumed = await consumeInvitation(user);
                if (!consumed) {
                    membershipsData = [];
                    checkCompletion();
                }
                // If consumed, the listener will be triggered again with the new data.
            } else {
                membershipsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
                checkCompletion();
            }
        }, (error) => {
            console.error("Error fetching memberships:", error);
            membershipsData = [];
            checkCompletion();
        });
    }

    loadData();

    return () => {
      if (profileUnsub) profileUnsub();
      if (membershipsUnsub) membershipsUnsub();
    };
  }, [user]);

  useEffect(() => {
    if (!activeMembership) {
      setGymProfile(null);
      return;
    }
    const unsubGym = onSnapshot(doc(db, 'gyms', activeMembership.gymId), (doc) => {
      setGymProfile(doc.exists() ? ({ id: doc.id, ...doc.data() } as GymProfile) : null);
    });
    return () => unsubGym();
  }, [activeMembership]);
  
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
