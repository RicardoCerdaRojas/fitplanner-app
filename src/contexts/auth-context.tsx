
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
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const [membershipsLoaded, setMembershipsLoaded] = useState(false);
  const router = useRouter();


  // Effect for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setLoading(true);
      setMembershipsLoaded(false);
      setUser(authUser);
      
      if (!authUser) {
        // User logged out, reset everything
        setUserProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setGymProfile(null);
        setLoading(false);
      }
      setInitialAuthCheck(true);
    });
    return () => unsubscribeAuth();
  }, []);
  
  // Effect to fetch user's global profile and memberships
  useEffect(() => {
    if (!user) return;
    
    // Reset states on user change
    setUserProfile(null);
    setMemberships([]);
    setMembershipsLoaded(false);

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        setUserProfile(docSnap.exists() ? docSnap.data() as UserProfile : null);
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
    });

    const membershipsQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    const unsubscribeMemberships = onSnapshot(membershipsQuery, async (snapshot) => {
        const fetchedMemberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
        
        if (fetchedMemberships.length === 0 && !snapshot.metadata.hasPendingWrites && !membershipsLoaded) {
            await consumeInvitation(user);
        } else {
            setMemberships(fetchedMemberships);
        }
        setMembershipsLoaded(true);
    }, (error) => {
        console.error("Error fetching memberships:", error);
        setMembershipsLoaded(true);
    });
    
    return () => {
        unsubscribeUser();
        unsubscribeMemberships();
    };
  }, [user]);
  
  // Effect to set active membership
  useEffect(() => {
    if (!membershipsLoaded) return;

    if (memberships.length > 0) {
        if (!activeMembership || !memberships.find(m => m.id === activeMembership.id)) {
            const sorted = [...memberships].sort((a, b) => {
                const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                return roles[a.role] - roles[b.role];
            });
            setActiveMembership(sorted[0]);
        }
    } else {
        setActiveMembership(null);
    }
  }, [memberships, membershipsLoaded, activeMembership]);

  // Effect to fetch active gym profile
  useEffect(() => {
    if (!activeMembership) {
        setGymProfile(null);
        return;
    }

    const gymDocRef = doc(db, 'gyms', activeMembership.gymId);
    const unsubscribe = onSnapshot(gymDocRef, (doc) => {
        setGymProfile(doc.exists() ? { id: doc.id, ...doc.data() } as GymProfile : null);
    }, (error) => {
        console.error('Error fetching gym profile:', error);
        setGymProfile(null);
    });
    return () => unsubscribe();
  }, [activeMembership]);

  // Final loading state determination
  useEffect(() => {
    // Loading is true until we've checked auth and loaded memberships for a logged-in user
    if (!initialAuthCheck) {
        setLoading(true);
        return;
    }
    if (user) {
        // If there's a user, we wait until memberships are loaded
        setLoading(!membershipsLoaded);
    } else {
        // If no user, we are done loading
        setLoading(false);
    }
  }, [user, membershipsLoaded, initialAuthCheck]);


  // Centralized redirection logic
  useEffect(() => {
    if (loading) return; // Do nothing until all data is loaded

    const guestRoutes = ['/login', '/signup'];
    const currentPath = window.location.pathname;

    if (user) {
        if (memberships.length === 0) {
            if (currentPath !== '/create-gym') {
                router.push('/create-gym');
            }
        } else if (activeMembership) {
            const role = activeMembership.role;
            const isAdminPath = currentPath.startsWith('/admin');
            const isCoachPath = currentPath.startsWith('/coach');
            const isRootPath = currentPath === '/';

            if (role === 'gym-admin' && !isAdminPath) {
                 if (currentPath === '/coach' || isRootPath) {
                    router.push('/admin');
                }
            } else if (role === 'coach' && !isCoachPath) {
                 if (isRootPath || isAdminPath) {
                     router.push('/coach');
                }
            } else if (role === 'athlete' && (isAdminPath || isCoachPath)) {
                router.push('/');
            }
        }
    } else {
        if (!guestRoutes.includes(currentPath) && currentPath !== '/') {
            router.push('/');
        }
    }

  }, [user, memberships, activeMembership, loading, router]);


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
