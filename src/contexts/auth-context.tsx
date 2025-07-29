
'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  name: string;
  email: string;
  createdAt: Timestamp;
  gymId?: string | null;
  role?: 'member' | 'coach' | 'gym-admin';
  dob?: Timestamp;
  gender?: 'male' | 'female' | 'other';
};

export type Membership = {
    id: string;
    userId: string;
    gymId: string;
    role: 'member' | 'coach' | 'gym-admin';
    userName:string;
    gymName: string;
    status: 'active' | 'pending';
};

export type GymProfile = {
    id: string;
    name: string;
    theme?: { [key: string]: string };
    logoUrl?: string;
    trialEndsAt?: Timestamp;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  activeMembership: Membership | null;
  gymProfile: GymProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setActiveMembership: (membership: Membership | null) => void;
  setGymProfile: (gymProfile: GymProfile | null) => void;
  setLoading: (loading: boolean) => void;
  isTrialActive: boolean; // We'll keep this but simplify its logic
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log("LOG 1: AuthProvider se está renderizando.");

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // RADICAL REVERSION: Trial is always considered active.
  // This removes the dependency on subscription status which caused the infinite loop.
  const isTrialActive = true; 

  const contextValue = useMemo(() => {
    console.log("LOG 2: Recalculando el valor del contexto. Loading:", loading, "User:", !!user);
    return {
      user,
      userProfile,
      activeMembership,
      gymProfile,
      loading,
      isTrialActive,
      setUser,
      setUserProfile,
      setActiveMembership,
      setGymProfile,
      setLoading,
    };
  }, [user, userProfile, activeMembership, gymProfile, loading, isTrialActive]);

  useEffect(() => {
    console.log("LOG 3: AuthProvider se ha montado (useEffect una sola vez).");
  }, []);

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
