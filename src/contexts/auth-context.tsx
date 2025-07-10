
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type UserProfile = {
  name: string;
  email: string;
  createdAt: Timestamp;
  dob?: Timestamp;
};

export type Membership = {
    id: string;
    userId: string;
    gymId: string;
    role: 'athlete' | 'coach' | 'gym-admin';
    userName: string;
    gymName: string;
    status: 'active' | 'pending';
};

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
  activeMembership: Membership | null;
  gymProfile: GymProfile | null;
  loading: boolean;
  setActiveMembership: (membership: Membership | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Clear all state and stop loading when user logs out.
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
      if (auth.currentUser === null) {
          setLoading(false);
      }
      return;
    }

    let profileUnsub: (() => void) | undefined;
    let membershipsUnsub: (() => void) | undefined;
    
    let profileLoaded = false;
    let membershipsLoaded = false;

    const checkLoadingDone = () => {
        if (profileLoaded && membershipsLoaded) {
            setLoading(false);
        }
    }

    profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      setUserProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
      profileLoaded = true;
      checkLoadingDone();
    });

    const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    membershipsUnsub = onSnapshot(membershipsQuery, (snapshot) => {
      const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
      setMemberships(fetchedMemberships);
      membershipsLoaded = true;
      checkLoadingDone();
    }, () => {
        membershipsLoaded = true;
        checkLoadingDone();
    });

    return () => {
      if (profileUnsub) profileUnsub();
      if (membershipsUnsub) membershipsUnsub();
    };
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (memberships.length > 0) {
      const sorted = [...memberships].sort((a, b) => {
        const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
        return roles[a.role] - roles[b.role];
      });
      setActiveMembership(sorted[0]);
    } else {
      setActiveMembership(null);
    }
  }, [memberships, loading]);

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
