
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  
  useEffect(() => {
    if (loading) return;

    // For non-admin roles, access is always granted as it's controlled by the gym's subscription.
    if (activeMembership && (activeMembership.role === 'member' || activeMembership.role === 'coach')) {
        setIsTrialActive(true);
        return;
    }
    
    // A subscription is active if its status is active or they are in a trial period.
    const isSubscribed = userProfile?.stripeSubscriptionStatus === 'active' || userProfile?.stripeSubscriptionStatus === 'trialing';

    // A manual trial is active if the trialEndsAt date is in the future.
    const isManualTrialActive = gymProfile?.trialEndsAt ? new Date() < gymProfile.trialEndsAt.toDate() : false;
    
    // The user has access if they are subscribed OR if they are in a manual trial.
    setIsTrialActive(isSubscribed || isManualTrialActive);

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
