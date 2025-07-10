
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, getDoc, runTransaction, DocumentReference, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type UserProfile = {
  role: 'athlete' | 'coach' | 'gym-admin' | null;
  email?: string;
  gymId?: string | null;
  name?: string;
  dob?: Timestamp;
  plan?: 'basic' | 'premium' | 'pro';
  status?: string;
};

type GymProfile = {
    name: string;
    theme?: { [key: string]: string };
    logoUrl?: string;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  gymProfile: GymProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to consume an invitation after a user's first login
const consumeInvitation = async (user: User) => {
    if (!user.email) return;

    const userDocRef = doc(db, 'users', user.uid);
    const inviteRef = doc(db, 'invites', user.email.toLowerCase());

    try {
        await runTransaction(db, async (transaction) => {
            const inviteSnap = await transaction.get(inviteRef);
            if (!inviteSnap.exists()) {
                // No invitation found for this email, nothing to do.
                return;
            }

            const inviteData = inviteSnap.data();
            const userData: any = {
                email: user.email?.toLowerCase(),
                role: inviteData.role,
                gymId: inviteData.gymId,
                name: inviteData.name,
                status: 'active',
            };

            if (inviteData.role === 'athlete') {
                userData.dob = inviteData.dob;
                userData.plan = inviteData.plan;
            }
            
            // Use set with merge to either create or update the user document.
            // This prevents race conditions during signup.
            transaction.set(userDocRef, userData, { merge: true });
            
            // Delete the consumed invitation
            transaction.delete(inviteRef);
        });
    } catch (error) {
        console.error("Error consuming invitation:", error);
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        // User logged out, reset everything and stop loading
        setUserProfile(null);
        setGymProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect for user profile data, dependent on user
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = docSnapshot.data() as UserProfile;
            
            // If the user profile is incomplete (new signup), try to consume an invitation
            if (profileData.role === null) {
              consumeInvitation(user);
            }
            setUserProfile(profileData);
          } else {
             // This case happens on first signup. The profile is not yet created.
             // We'll try to consume an invitation. If one exists, it will create the doc.
             // If not, the user will be prompted to create a gym.
             consumeInvitation(user);
             setUserProfile(null); // Set to null initially
          }
        },
        (error) => {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setLoading(false);
        }
      );
      return () => unsubscribeSnapshot();
    }
  }, [user]);

  // Effect for gym profile data, dependent on userProfile
  useEffect(() => {
    if (userProfile?.gymId) {
        const gymDocRef = doc(db, 'gyms', userProfile.gymId);
        const unsubscribe = onSnapshot(gymDocRef, (doc) => {
            setGymProfile(doc.exists() ? (doc.data() as GymProfile) : null);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching gym profile:', error);
            setGymProfile(null);
            setLoading(false);
        });
        return () => unsubscribe();
    } else if (user) {
        // If user is logged in but has no gymId (or profile hasn't loaded yet),
        // we might still be in a loading state. The check for userProfile !== null
        // makes sure we stop loading if the profile is loaded and has no gym.
        if (userProfile !== null) {
          setGymProfile(null);
          setLoading(false);
        }
    }
  }, [user, userProfile]);

  return (
    <AuthContext.Provider value={{ user, userProfile, gymProfile, loading }}>
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
