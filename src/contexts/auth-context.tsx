
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, getDoc, runTransaction, collection, query, where, setDoc } from 'firebase/firestore';
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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setUserProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setGymProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let unsubProfile: (() => void) | undefined;
    let unsubMemberships: (() => void) | undefined;
  
    const loadData = async () => {
      let profileLoaded = false;
      let membershipsLoaded = false;
      let profileData: UserProfile | null = null;
      let membershipsData: Membership[] = [];

      const checkCompletion = () => {
        if (profileLoaded && membershipsLoaded) {
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
      
      unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        profileData = docSnap.exists() ? (docSnap.data() as UserProfile) : null;
        profileLoaded = true;
        checkCompletion();
      });

      unsubMemberships = onSnapshot(query(collection(db, 'memberships'), where('userId', '==', user.uid)), async (snapshot) => {
        if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
            const consumed = await consumeInvitation(user);
            if (!consumed) {
                membershipsData = [];
                membershipsLoaded = true;
                checkCompletion();
            }
        } else {
            membershipsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
            membershipsLoaded = true;
            checkCompletion();
        }
      });
    };

    loadData();

    return () => {
      if (unsubProfile) unsubProfile();
      if (unsubMemberships) unsubMemberships();
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

  useEffect(() => {
    if (loading) return;

    const guestRoutes = ['/login', '/signup'];
    const currentPath = window.location.pathname;

    if (user) {
      if (activeMembership) {
        if (guestRoutes.includes(currentPath)) {
            router.push('/'); // Redirect from guest pages if logged in with a role
            return;
        }
        
        const role = activeMembership.role;
        const isAdminPath = currentPath.startsWith('/admin');
        const isCoachPath = currentPath.startsWith('/coach');
        
        if (role === 'gym-admin' && !isAdminPath && (currentPath === '/' || currentPath.startsWith('/coach'))) {
            router.push('/admin');
        } else if (role === 'coach' && !isCoachPath && (currentPath === '/' || currentPath.startsWith('/admin'))) {
            router.push('/coach');
        } else if (role === 'athlete' && (isAdminPath || isCoachPath)) {
            router.push('/');
        }
      } else {
        // Logged in but no membership
        if (currentPath !== '/create-gym') {
          router.push('/create-gym');
        }
      }
    } else {
      // Not logged in
      if (!guestRoutes.includes(currentPath) && currentPath !== '/') {
        router.push('/');
      }
    }
  }, [user, activeMembership, loading, router]);
  
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
