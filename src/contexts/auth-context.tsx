
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string;
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
  isTrialActive: boolean | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [isTrialActive, setIsTrialActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Effect to determine trial status
  useEffect(() => {
    if (loading) return;
    
    // Members are always considered to have an active "trial" for access purposes
    if (activeMembership && activeMembership.role === 'member') {
        setIsTrialActive(true);
        return;
    }
    
    // If the user has an active Stripe subscription, they are not in trial (they are paying)
    if (userProfile?.stripeSubscriptionStatus === 'active' || userProfile?.stripeSubscriptionStatus === 'trialing') {
        setIsTrialActive(true);
        return;
    }
    
    // If no subscription, check the gym's trial end date.
    if (gymProfile?.trialEndsAt) {
        const trialEndDate = gymProfile.trialEndsAt.toDate();
        setIsTrialActive(new Date() < trialEndDate);
    } else {
        // If no gym profile or no trial date, they are not in an active trial
        setIsTrialActive(false);
    }
  }, [loading, userProfile, gymProfile, activeMembership]);

  const contextValue: AuthContextType = {
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
