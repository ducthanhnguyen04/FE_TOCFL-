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
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const resolveRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setRole('guest');
      return;
    }

    if (currentUser.user_metadata?.role) {
      setRole(currentUser.user_metadata.role);
      return;
    }

    if (currentUser.app_metadata?.role) {
      setRole(currentUser.app_metadata.role);
      return;
    }

    try {
      const supabase = createClient();
      let roleFound: string | null = null;

      // 1. Tra cứu theo Auth ID
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('resolveRole by id error:', error.message);
      } else if (data?.role) {
        roleFound = data.role;
      }

      // 2. Fallback tra cứu theo email
      if (!roleFound && currentUser.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('role')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (emailError) {
          console.warn('resolveRole by email error:', emailError.message);
        } else if (emailData?.role) {
          roleFound = emailData.role;
        }
      }

      // 3. Fallback tra cứu theo Google ID nếu có
      const googleId = currentUser.user_metadata?.provider_id || 
                       currentUser.identities?.[0]?.identity_data?.sub ||
                       currentUser.identities?.[0]?.id;
      if (!roleFound && googleId) {
        const { data: gData } = await supabase
          .from('users')
          .select('role')
          .eq('googleid', googleId)
          .maybeSingle();

        if (gData?.role) {
          roleFound = gData.role;
        }
      }

      if (roleFound) {
        setRole(roleFound);
        return;
      }
    } catch (e) {
      console.error('resolveRole catch error:', e);
    }

    setRole('user');
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

  return (
    <UserContext.Provider value={{ user, role, isAdmin, isLoading, refreshUser, logout, openLoginModal, closeLoginModal }}>
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
