'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/Modal/LoginModal';

interface UserContextType {
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const refreshUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setIsLoading(false);
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  useEffect(() => {
    const supabase = createClient();
    
    // Listen for auth state changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser, logout, openLoginModal, closeLoginModal }}>
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
