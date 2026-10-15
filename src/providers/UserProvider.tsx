'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/Modal/LoginModal';

interface UserContextType {
  user: User | null;
  role: string;
  isAdmin: boolean;
  isPremium: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [role, setRole] = useState<string>('user');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const resolveRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setRole('guest');
      setIsPremium(false);
      return;
    }

    let roleFound: string | null = (currentUser.user_metadata?.role || currentUser.app_metadata?.role) as string | null;
    let premiumFound: boolean = Boolean(
      currentUser.user_metadata?.isPremium ??
      currentUser.user_metadata?.ispremium ??
      currentUser.app_metadata?.isPremium ??
      currentUser.app_metadata?.ispremium
    );

    try {
      const supabase = createClient();

      // 1. Tra cứu theo Auth ID
      const { data, error } = await supabase
        .from('users')
        .select('role, ispremium')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('resolveRole by id error:', error.message);
      } else if (data) {
        if (data.role) roleFound = data.role;
        if (data.ispremium !== undefined && data.ispremium !== null) {
          premiumFound = Boolean(data.ispremium);
        }
      }

      // 2. Fallback tra cứu theo email
      if ((!roleFound || !premiumFound) && currentUser.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('role, ispremium')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (emailError) {
          console.warn('resolveRole by email error:', emailError.message);
        } else if (emailData) {
          if (emailData.role) roleFound = emailData.role;
          if (emailData.ispremium !== undefined && emailData.ispremium !== null) {
            premiumFound = Boolean(emailData.ispremium);
          }
        }
      }

      // 3. Fallback tra cứu theo Google ID nếu có
      const googleId = currentUser.user_metadata?.provider_id || 
                       currentUser.identities?.[0]?.identity_data?.sub ||
                       currentUser.identities?.[0]?.id;
      if (!roleFound && googleId) {
        const { data: gData } = await supabase
          .from('users')
          .select('role, ispremium')
          .eq('googleid', googleId)
          .maybeSingle();

        if (gData) {
          if (gData.role) roleFound = gData.role;
          if (gData.ispremium !== undefined && gData.ispremium !== null) {
            premiumFound = Boolean(gData.ispremium);
          }
        }
      }
    } catch (e) {
      console.error('resolveRole catch error:', e);
    }

    setRole(roleFound || 'user');
    setIsPremium(premiumFound);
  };

  const refreshUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    await resolveRole(user);
    setIsLoading(false);
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setRole('guest');
    setIsPremium(false);
    router.refresh();
  };

  useEffect(() => {
    resolveRole(user);
  }, [user]);

  useEffect(() => {
    const supabase = createClient();
    
    // Listen for auth state changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      resolveRole(currentUser);
      setIsLoading(false);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const isAdmin = role === 'admin';
  const hasPremium = isPremium || isAdmin;

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isPremium: hasPremium,
        isLoading,
        refreshUser,
        logout,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
