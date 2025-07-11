
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
  Timestamp
} from 'firebase/firestore';
import { AuthProviderClient } from '@/components/auth-provider-client';

type UserProfile = {
  name: string;
  email: string;
  createdAt: Timestamp;
  gymId?: string;
  dob?: Timestamp;
  plan?: 'basic' | 'premium' | 'pro';
};

export type Membership = {
    id: string;
    userId: string;
    gymId: string;
    role: 'athlete' | 'coach' | 'gym-admin';
    userName:string;
    gymName: string;
    status: 'active' | 'pending';
};

type GymProfile = {
    id: string;
    name: string;
    theme?: { [key: string]: string };
    logoUrl?: string;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  memberships: Membership[];
  activeMembership: Membership | null;
  gymProfile: GymProfile | null;
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
  const [loading, setLoading] = useState(true);

  // Effect to check for and process pending invitations when a user logs in.
  useEffect(() => {
    const checkForInvite = async () => {
      if (!user?.email || userProfile?.gymId) {
        // Don't run if there's no email, or if the user already belongs to a gym.
        return;
      }

      const inviteRef = doc(db, 'invites', user.email.toLowerCase());
      const inviteSnap = await getDoc(inviteRef);

      if (inviteSnap.exists()) {
        setLoading(true);
        const inviteData = inviteSnap.data();
        const gymRef = doc(db, 'gyms', inviteData.gymId);
        const gymSnap = await getDoc(gymRef);

        if (gymSnap.exists()) {
          const gymData = gymSnap.data();
          const batch = writeBatch(db);

          // 1. Create a new membership document
          const membershipId = `${user.uid}_${inviteData.gymId}`;
          const membershipRef = doc(db, 'memberships', membershipId);
          batch.set(membershipRef, {
            userId: user.uid,
            gymId: inviteData.gymId,
            role: inviteData.role,
            userName: userProfile?.name || inviteData.name,
            gymName: gymData.name,
            status: 'active',
          });

          // 2. Update the user's profile with gymId and other details from invite
          const userRef = doc(db, 'users', user.uid);
          const userUpdateData: Partial<UserProfile> = {
            gymId: inviteData.gymId,
          };
          if (inviteData.dob) userUpdateData.dob = inviteData.dob;
          if (inviteData.plan) userUpdateData.plan = inviteData.plan;
          batch.update(userRef, userUpdateData);

          // 3. Delete the processed invitation
          batch.delete(inviteRef);

          try {
            await batch.commit();
            // The onSnapshot listeners in AuthProviderClient will automatically
            // pick up the new membership and profile data.
          } catch (error) {
            console.error("Error claiming invitation:", error);
            setLoading(false);
          }
        }
      }
    };

    checkForInvite();
  }, [user, userProfile]);


  const contextValue: AuthContextType = {
    user,
    userProfile,
    memberships,
    activeMembership,
    gymProfile,
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
