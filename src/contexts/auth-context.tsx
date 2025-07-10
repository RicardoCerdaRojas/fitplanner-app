
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

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

  const router = useRouter();
  const pathname = usePathname();

  // Handle user authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setLoading(true);
      setUser(authUser);
      if (!authUser) {
        setUserProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setGymProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch user profile and memberships when user is available
  useEffect(() => {
    if (!user) {
      if (auth.currentUser === null) {
        setLoading(false);
      }
      return;
    }

    const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      setUserProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
    });

    const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    const membershipsUnsub = onSnapshot(membershipsQuery, (snapshot) => {
      const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
      setMemberships(fetchedMemberships);
      setLoading(false); 
    }, (error) => {
        console.error("Error fetching memberships: ", error);
        setLoading(false);
    });

    return () => {
      profileUnsub();
      membershipsUnsub();
    };
  }, [user]);

  // Determine active membership
  useEffect(() => {
    if (memberships.length > 0) {
      const sorted = [...memberships].sort((a, b) => {
        const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
        return roles[a.role] - roles[b.role];
      });
      setActiveMembership(sorted[0]);
    } else {
      setActiveMembership(null);
    }
  }, [memberships]);

  // Fetch gym profile based on active membership
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

  // Centralized redirection logic
  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }
    
    const isGuestPage = pathname === '/login' || pathname === '/signup';
    const isCreateGymPage = pathname === '/create-gym';
    
    // If logged in...
    if (user) {
      // And has a membership...
      if (activeMembership) {
        // ...but is on a guest or create-gym page, redirect them away.
        if (isGuestPage || isCreateGymPage) {
          if (activeMembership.role === 'gym-admin') router.push('/admin');
          else if (activeMembership.role === 'coach') router.push('/coach');
          else router.push('/');
        }
        // ...and is on the home page but should be on a specific dashboard.
        else if (pathname === '/') {
          if (activeMembership.role === 'gym-admin') router.push('/admin');
          else if (activeMembership.role === 'coach') router.push('/coach');
        }
      } 
      // ...but has NO membership, send to create a gym, unless they are already there or on a guest page.
      else if (!isCreateGymPage && !isGuestPage) {
        router.push('/create-gym');
      }
    }
    
    // If not logged in and tries to access a protected page
    else if (!isGuestPage) {
        // Allow access to home page for guests
        if (pathname !== '/') {
           router.push('/login');
        }
    }

  }, [user, activeMembership, loading, pathname, router]);
  
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
