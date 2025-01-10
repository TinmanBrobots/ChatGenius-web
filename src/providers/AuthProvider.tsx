"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Profile } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; username: string; full_name: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { 
    login: loginMutation, 
    register: registerMutation, 
    logout: logoutFn,
    initializeAuth,
    currentUser,
    isInitialized
  } = useAuth();

  // Initialize authentication state
  useEffect(() => {
    const initialize = async () => {
      try {
        // Wait for auth to initialize
        if (!isInitialized) return;

        const user = await initializeAuth();
        setUser(user);

        if (user && publicRoutes.includes(pathname)) {
          router.push('/chat');
        } else if (!user && !publicRoutes.includes(pathname)) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [pathname, router, initializeAuth, isInitialized]);

  // Keep user state in sync with currentUser from useAuth
  useEffect(() => {
    setUser(currentUser || null);
  }, [currentUser]);

  // Protect routes
  useEffect(() => {
    if (!isLoading && !isInitialized) return;
    
    if (!user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router, isInitialized]);

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (data: { email: string; password: string; username: string; full_name: string }) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = () => {
    logoutFn();
    setUser(null);
  };

  if (!isInitialized || isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 