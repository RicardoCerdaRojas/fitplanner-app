
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
            };

            const membershipData = {
                userId: user.uid,
                gymId: inviteData.gymId,
                role: inviteData.role,
                userName: inviteData.name,
                gymName: gymName,
                status: 'active'
            };

            // This is an "upsert". It will create the user doc if it doesn't exist,
            // or merge the data if it somehow already does. This avoids race conditions.
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
            // This is key: if profile doesn't exist yet, we still set it to null
            // to signal that this loading step is complete.
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
        
        // This is the logic that runs for a new user after registration.
        // It consumes the invite and creates their first membership.
        if (fetchedMemberships.length === 0 && !membershipsLoaded) {
            await consumeInvitation(user);
        }
        
        setMemberships(fetchedMemberships);
        setMembershipsLoaded(true); // Mark memberships as loaded
    }, (error) => {
        console.error("Error fetching memberships:", error);
        setMembershipsLoaded(true); // Also mark as loaded on error to unblock loading state
    });

    return () => unsubscribe();
  }, [user, membershipsLoaded]); // Depend on membershipsLoaded to prevent re-running consumeInvitation

  // Effect to set active membership
  useEffect(() => {
    if (memberships.length > 0) {
        if (!activeMembership || !memberships.find(m => m.id === activeMembership.id)) {
            const sorted = [...memberships].sort((a, b) => {
                const roles = { 'gym-admin': 0, 'coach': 1, 'athlete': 2 };
                return roles[a.role] - roles[b.role];
            });
            setActiveMembership(sorted[0]);
        }
    }
  }, [memberships, activeMembership]);

  // Effect to fetch active gym profile
  useEffect(() => {
    if (!activeMembership) {
        setGymProfile(null);
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
  }, [activeMembership]);

  // Final loading state determination
  useEffect(() => {
    // If auth state is confirmed to be logged out, we're not loading.
    if (!user && !auth.currentUser) {
        setLoading(false);
        return;
    }
    // If user is logged in, loading is finished ONLY when we have both
    // the user profile (even if null) AND the memberships have been loaded.
    if (user && userProfile !== undefined && membershipsLoaded) {
        setLoading(false);
    }
  }, [user, userProfile, membershipsLoaded]);

  // New Effect for centralized redirection logic
  useEffect(() => {
    if (loading) return; // Do nothing until all data is loaded

    const guestRoutes = ['/login', '/signup'];
    const currentPath = window.location.pathname;

    if (user) {
        // If user is logged in but on a guest route, do nothing. This allows them to visit the login page to log out.
        if (guestRoutes.includes(currentPath)) {
            return;
        }

        if (memberships.length === 0) {
            if (currentPath !== '/create-gym') {
                router.push('/create-gym');
            }
        } else if (activeMembership) {
            const role = activeMembership.role;
            if (role === 'gym-admin' && !currentPath.startsWith('/admin') && !currentPath.startsWith('/coach')) {
                router.push('/admin');
            } else if (role === 'coach' && !currentPath.startsWith('/coach')) {
                router.push('/coach');
            } else if (role === 'athlete' && (currentPath.startsWith('/admin') || currentPath.startsWith('/coach'))) {
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
