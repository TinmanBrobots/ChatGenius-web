import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Profile } from '@/types';
import api from '@/lib/axios';
import { socket } from '@/lib/socket';
import { useEffect } from 'react';

interface UpdateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface UpdateStatusData {
  status: string;
  expires_at?: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  desktop_notifications: boolean;
}

interface ThemePreferences {
  theme: 'light' | 'dark' | 'system';
  custom_colors?: Record<string, string>;
}

export function useProfiles() {
  const queryClient = useQueryClient();

  // Socket event handlers for real-time status updates
  useEffect(() => {
    function handleStatusUpdate({ profileId, status, lastSeen }: { profileId: string; status: string; lastSeen?: string }) {
      queryClient.setQueryData(['profile', profileId], (oldData: Profile | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status,
          last_seen_at: lastSeen || oldData.last_seen_at
        };
      });
    }

    function handlePresenceSync(presenceData: { [key: string]: { status: string; lastSeen?: string } }) {
      Object.entries(presenceData).forEach(([profileId, data]) => {
        handleStatusUpdate({ profileId, ...data });
      });
    }

    socket.on('status_update', handleStatusUpdate);
    socket.on('presence_sync', handlePresenceSync);

    return () => {
      socket.off('status_update', handleStatusUpdate);
      socket.off('presence_sync', handlePresenceSync);
    };
  }, [queryClient]);

  function useSearchProfiles(query: string) {
    return useQuery({
      queryKey: ['profiles', 'search', query],
      queryFn: async () => {
        const response = await api.get<Profile[]>(`/profiles/search?q=${query}`);
        return response.data;
      },
      enabled: !!query,
    });
  }

  function useGetProfileByUsername(username: string) {
    return useQuery({
      queryKey: ['profile', 'username', username],
      queryFn: async () => {
        const response = await api.get<Profile>(`/profiles/username/${username}`);
        return response.data;
      },
      enabled: !!username,
    });
  }

  function useGetProfile(id: string) {
    return useQuery({
      queryKey: ['profile', id],
      queryFn: async () => {
        const response = await api.get<Profile>(`/profiles/${id}`);
        return response.data;
      },
      enabled: !!id,
    });
  }

  const updateProfile = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProfileData }) => {
      const response = await api.patch<Profile>(`/profiles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStatusData }) => {
      const response = await api.put<Profile>(`/profiles/${id}/status`, data);
      // Emit status update through socket
      socket.emit('status_change', { status: data.status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateNotificationPreferences = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NotificationPreferences }) => {
      const response = await api.put<Profile>(`/profiles/${id}/notifications`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateTheme = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ThemePreferences }) => {
      const response = await api.put<Profile>(`/profiles/${id}/theme`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    useSearchProfiles,
    useGetProfileByUsername,
    useGetProfile,
    updateProfile,
    updateStatus,
    updateNotificationPreferences,
    updateTheme,
  };
} 