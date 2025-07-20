
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
  userProfile: UserProfile | null;
  activeMembership: Membership | null;
  gymProfile: GymProfile | null;
  isTrialActive: boolean | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [isTrialActive, setIsTrialActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to listen for auth state changes from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        setLoading(true);
        if (authUser) {
            setUser(authUser);
        } else {
            setUser(null);
            setUserProfile(null);
            setActiveMembership(null);
            setGymProfile(null);
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);

  // Effect to fetch user and gym data when user object is available
  useEffect(() => {
      const fetchData = async () => {
          if (user) {
              const userProfileRef = doc(db, 'users', user.uid);
              try {
                  const userDoc = await getDoc(userProfileRef);
                  if (userDoc.exists()) {
                      const profileData = userDoc.data() as UserProfile;
                      setUserProfile(profileData);

                      if (profileData.gymId && profileData.role) {
                          const gymDocRef = doc(db, 'gyms', profileData.gymId);
                          const gymDocSnap = await getDoc(gymDocRef);

                          if (gymDocSnap.exists()) {
                              const gymData = gymDocSnap.data() as Omit<GymProfile, 'id'>;
                              setGymProfile({ id: gymDocSnap.id, ...gymData });
                              setActiveMembership({
                                  id: `${user.uid}_${profileData.gymId}`,
                                  userId: user.uid,
                                  gymId: profileData.gymId,
                                  role: profileData.role,
                                  userName: profileData.name,
                                  gymName: gymData.name,
                                  status: 'active',
                              });
                          } else {
                              setGymProfile(null);
                              setActiveMembership(null);
                          }
                      } else {
                          setActiveMembership(null);
                          setGymProfile(null);
                      }
                  } else {
                      setUserProfile(null);
                      setActiveMembership(null);
                      setGymProfile(null);
                  }
              } catch (error) {
                  console.error("Firebase read error:", error);
                  setUserProfile(null);
                  setActiveMembership(null);
                  setGymProfile(null);
              }
          }
          setLoading(false);
      };
      
      fetchData();
  }, [user]);

  // Effect to determine trial status
  useEffect(() => {
    if (loading) return;
    
    if (activeMembership && activeMembership.role === 'member') {
        setIsTrialActive(true);
        return;
    }
    
    if (userProfile?.stripeSubscriptionStatus === 'active' || userProfile?.stripeSubscriptionStatus === 'trialing') {
        setIsTrialActive(true);
        return;
    }
    
    if (gymProfile?.trialEndsAt) {
        const trialEndDate = gymProfile.trialEndsAt.toDate();
        setIsTrialActive(new Date() < trialEndDate);
    } else {
        setIsTrialActive(false);
    }
  }, [loading, userProfile, gymProfile, activeMembership]);

  const contextValue: AuthContextType = {
    user,
    userProfile,
    activeMembership,
    gymProfile,
    isTrialActive,
    loading,
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
