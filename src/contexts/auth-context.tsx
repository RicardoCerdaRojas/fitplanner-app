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

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect for profile data, dependent on user
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
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setLoading(false);
        }
      );

      // This cleanup function will be called when `user` changes (i.e., on logout)
      return () => unsubscribeSnapshot();
    } else {
      // User is null, so clear the profile
      setUserProfile(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
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
