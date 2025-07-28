
'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
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
  setUser: (user: User | null) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  activeMembership: Membership | null;
  setActiveMembership: (membership: Membership | null) => void;
  gymProfile: GymProfile | null;
  setGymProfile: (gymProfile: GymProfile | null) => void;
  isTrialActive: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isTrialActive = useMemo(() => {
    if (!activeMembership) return false;
    // Members and coaches inherit access from the gym
    if (activeMembership.role === 'member' || activeMembership.role === 'coach') {
        return true;
    }
    // Admin access depends on the trial period
    if (activeMembership.role === 'gym-admin' && gymProfile?.trialEndsAt) {
      return new Date() < gymProfile.trialEndsAt.toDate();
    }
    // Default to no access if conditions aren't met
    return false;
  }, [activeMembership, gymProfile]);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    userProfile,
    setUserProfile,
    activeMembership,
    setActiveMembership,
    gymProfile,
    setGymProfile,
    isTrialActive,
    loading,
    setLoading
  }), [user, userProfile, activeMembership, gymProfile, isTrialActive, loading]);

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
