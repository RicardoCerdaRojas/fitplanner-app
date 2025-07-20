
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { AuthProviderClient } from '@/components/auth-provider-client';

export type UserProfile = {
  name: string;
  email: string;
  createdAt: Timestamp;
  gymId?: string | null; // Allow null
  role?: 'member' | 'coach' | 'gym-admin'; // Role can be on user profile
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
  userProfile: UserProfile | null;
  memberships: Membership[];
  activeMembership: Membership | null;
  gymProfile: GymProfile | null;
  isTrialActive: boolean | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setMemberships: (memberships: Membership[]) => void;
  setActiveMembership: (membership: Membership | null) => void;
  setGymProfile: (gym: GymProfile | null) => void;
  setLoading: (loading: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [isTrialActive, setIsTrialActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to determine trial status
  useEffect(() => {
    if (loading) return;
    
    // If user is a regular member, they always have access through their gym's subscription.
    if (activeMembership && activeMembership.role === 'member') {
        setIsTrialActive(true);
        return;
    }
    
    // If the user has an active Stripe subscription, they have access.
    if (userProfile?.stripeSubscriptionStatus === 'active' || userProfile?.stripeSubscriptionStatus === 'trialing') {
        setIsTrialActive(true);
        return;
    }
    
    // If they have a gym profile with a trial end date, calculate the status.
    if (gymProfile?.trialEndsAt) {
        const trialEndDate = gymProfile.trialEndsAt.toDate();
        setIsTrialActive(new Date() < trialEndDate);
    } else {
        // No subscription and no trial info means no access for admins/coaches.
        setIsTrialActive(false);
    }
  }, [loading, userProfile, gymProfile, activeMembership]);


  const contextValue: AuthContextType = {
    user,
    userProfile,
    memberships,
    activeMembership,
    gymProfile,
    isTrialActive,
    loading,
    setUser,
    setUserProfile,
    setMemberships,
    setActiveMembership,
    setGymProfile,
    setLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <AuthProviderClient>{children}</AuthProviderClient>
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
