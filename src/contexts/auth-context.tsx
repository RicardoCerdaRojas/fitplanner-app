'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db, initializePresence } from '@/lib/firebase';

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
  const [profileChecked, setProfileChecked] = useState(false);

  // Effect for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        initializePresence(authUser.uid); // Initialize presence system
      } else {
        setUser(null);
        setUserProfile(null);
        setGymProfile(null);
        setLoading(false);
      }
      setProfileChecked(false);
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
          setUserProfile(doc.exists() ? (doc.data() as UserProfile) : null);
          setProfileChecked(true);
        },
        (error) => {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setProfileChecked(true); // Also mark as checked on error
        }
      );
      return () => unsubscribeSnapshot();
    } else {
      setUserProfile(null);
      setProfileChecked(false);
    }
  }, [user]);

  // Effect for gym profile data, dependent on userProfile AND the check status
  useEffect(() => {
    if (!profileChecked) {
      return; // Do nothing until the user profile has been checked
    }

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
    } else {
        // The profile was checked and there's no gymId
        setGymProfile(null);
        setLoading(false);
    }
  }, [profileChecked, userProfile]);

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
