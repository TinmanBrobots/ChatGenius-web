import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { LoginCredentials, RegisterCredentials, Profile } from '@/types';
import api from '@/lib/axios';
import { socket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthResponse {
  user: Profile;
  session: {
    access_token: string;
    refresh_token: string;
  };
}

// Initialize auth state from localStorage
const initializeAuthState = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    socket.auth = { token };
  }
  return !!token;
};

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const hasToken = initializeAuthState();
    setIsInitialized(true);
    if (!hasToken) {
      cleanupAuth();
    }
  }, []);

  const setupAuth = (token: string, user: Profile) => {
    // Store the token
    localStorage.setItem('token', token);
    
    // Update axios default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Connect socket with auth token
    socket.auth = { token };
    socket.connect();

    // Update user in React Query cache
    queryClient.setQueryData(['currentUser'], user);
  };

  const cleanupAuth = () => {
    // Clear token
    localStorage.removeItem('token');
    
    // Remove auth header
    delete api.defaults.headers.common['Authorization'];
    
    // Disconnect socket
    socket.disconnect();
    
    // Clear all queries from cache
    queryClient.clear();
  };

  // Query for current user
  const { data: currentUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<{ user: Profile }>('/auth/me');
      return response.data.user;
    },
    enabled: isInitialized && !!localStorage.getItem('token'), // Only run if initialized and has token
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: false // Don't retry on failure
  });

  // Handle auth error by cleaning up
  useEffect(() => {
    if (userError) {
      cleanupAuth();
      router.push('/login');
    }
  }, [userError, router]);

  const login = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: async (data) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setupAuth(data.session.access_token, data.user);
      router.push('/chat');
    },
    onError: () => {
      cleanupAuth();
    }
  });

  const register = useMutation<{ user: Profile }, Error, RegisterCredentials>({
    mutationFn: async (data) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    }
  });

  const initializeAuth = async () => {
    if (!isInitialized) return null;
    
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      // Use the existing user data from cache if available
      const cachedUser = queryClient.getQueryData<Profile>(['currentUser']);
      if (cachedUser) {
        return cachedUser;
      }

      // If no cached data, fetch from API
      const response = await api.get<{ user: Profile }>('/auth/me');
      const user = response.data.user;
      queryClient.setQueryData(['currentUser'], user);
      return user;
    } catch (error) {
      console.error('Error initializing auth:', error);
      cleanupAuth();
      return null;
    }
  };

  const logout = () => {
    cleanupAuth();
    router.push('/login');
  };

  return { 
    login, 
    register, 
    logout, 
    initializeAuth,
    currentUser,
    userError,
    isInitialized,
    setupAuth,
    cleanupAuth
  };
} 