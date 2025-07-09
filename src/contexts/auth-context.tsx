'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
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
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect for user profile data, dependent on user
  useEffect(() => {
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          } else {
            setUserProfile(null);
            setLoading(false);
          }
          // Do not set loading to false here, wait for gym profile
        },
        (error) => {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setLoading(false);
        }
      );
      return () => unsubscribeSnapshot();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // Effect for gym profile data, dependent on userProfile
  useEffect(() => {
    if (userProfile?.gymId) {
        const gymDocRef = doc(db, 'gyms', userProfile.gymId);
        const unsubscribe = onSnapshot(gymDocRef, (doc) => {
            if(doc.exists()) {
                setGymProfile(doc.data() as GymProfile);
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
    } else if (user && !userProfile?.gymId) {
        // User exists but has no gym, so we are done loading
        setGymProfile(null);
        setLoading(false);
    }
  }, [userProfile, user]);

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
