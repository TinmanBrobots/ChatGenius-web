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
  status: 'online' | 'offline' | 'away' | 'busy';
  customStatus?: string;
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

interface PresenceData {
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  customStatus?: string;
}

export function useProfiles() {
  const queryClient = useQueryClient();

  // Socket event handlers for real-time status updates
  useEffect(() => {
    function handleStatusUpdate({ profileId, status, lastSeen, customStatus }: { 
      profileId: string; 
      status: string; 
      lastSeen?: string;
      customStatus?: string;
    }) {
      queryClient.setQueryData(['profile', profileId], (oldData: Profile | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status,
          last_seen_at: lastSeen || oldData.last_seen_at,
          custom_status: customStatus
        };
      });

      // Also update profile in any lists or cached queries
      queryClient.setQueriesData(
        { queryKey: ['profiles'] },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              profiles: page.profiles.map((profile: Profile) =>
                profile.id === profileId
                  ? {
                      ...profile,
                      status,
                      last_seen_at: lastSeen || profile.last_seen_at,
                      custom_status: customStatus
                    }
                  : profile
              ),
            })),
          };
        }
      );
    }

    function handlePresenceSync(presenceData: Record<string, PresenceData>) {
      Object.entries(presenceData).forEach(([profileId, data]) => {
        handleStatusUpdate({ 
          profileId, 
          status: data.status,
          lastSeen: data.lastSeen,
          customStatus: data.customStatus
        });
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
      socket.emit('status_change', { 
        status: data.status,
        customStatus: data.customStatus
      });
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