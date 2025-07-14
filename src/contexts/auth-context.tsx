
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  collection,
  query,
  where,
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
  setIsTrialActive: (isActive: boolean | null) => void;
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

  // Effect to check for and process pending memberships when a user logs in.
  useEffect(() => {
    const claimPendingMembership = async () => {
      // Don't run if we don't have a user/email, or if the user already has a gymId
      if (!user?.email || (userProfile && userProfile.gymId)) {
        return;
      }

      const pendingMembershipRef = doc(db, 'memberships', user.email.toLowerCase());
      const pendingSnap = await getDoc(pendingMembershipRef);

      // If a pending membership exists for this email, claim it.
      if (pendingSnap.exists() && pendingSnap.data().status === 'pending') {
        setLoading(true);
        const pendingData = pendingSnap.data();
        const batch = writeBatch(db);

        // 1. Create a new 'active' membership document with the correct composite key
        const newMembershipId = `${user.uid}_${pendingData.gymId}`;
        const newMembershipRef = doc(db, 'memberships', newMembershipId);
        batch.set(newMembershipRef, {
          userId: user.uid,
          gymId: pendingData.gymId,
          role: pendingData.role,
          userName: userProfile?.name, // Use name from user's profile
          gymName: pendingData.gymName,
          status: 'active',
        });

        // 2. Update the user's profile with gymId and role
        const userRef = doc(db, 'users', user.uid);
        const userUpdateData: any = {
          gymId: pendingData.gymId,
          role: pendingData.role,
        };
        batch.update(userRef, userUpdateData);

        // 3. Delete the processed pending membership document
        batch.delete(pendingMembershipRef);

        try {
          await batch.commit();
          // State will be updated by the realtime listeners in AuthProviderClient
        } catch (error) {
          console.error("Error claiming pending membership:", error);
          setLoading(false); // Stop loading on error
        }
      }
    };

    // We need both the user and their profile to be loaded before we can check for pending memberships
    if (user && userProfile) {
        claimPendingMembership();
    }
  }, [user, userProfile]);
  
  // Effect to determine trial status
  useEffect(() => {
    if (loading) return;
    
    // If the user is subscribed, they always have active access.
    if (userProfile?.stripeSubscriptionStatus === 'active' || userProfile?.stripeSubscriptionStatus === 'trialing') {
        setIsTrialActive(true);
        return;
    }
    
    // If they have a gym profile with a trial end date, calculate the status.
    if (gymProfile?.trialEndsAt) {
        const trialEndDate = gymProfile.trialEndsAt.toDate();
        setIsTrialActive(new Date() < trialEndDate);
    } else {
        // No subscription and no trial info means no access (unless they are a member of a gym)
        // Let's assume non-admins/coaches always have access if they have a membership.
        if (activeMembership && activeMembership.role === 'member') {
            setIsTrialActive(true);
        } else {
            setIsTrialActive(false);
        }
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
    setIsTrialActive,
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
