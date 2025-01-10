import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message, MessageMap } from '@/types';
import api from '@/lib/axios';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

interface SendMessageData {
  content: string;
  channel_id: string;
  parent_id?: string;
}

// Helper function to create a message map structure
function createMessageMap(messages: Message[]): Map<string, MessageMap> {
  const messageMap = new Map<string, MessageMap>();
  
  // First, create map entries for all messages
  messages.forEach(message => {
    messageMap.set(message.id, {
      message,
      children: new Map()
    });
  });
  
  // Then, organize messages into threads
  messages.forEach(message => {
    if (message.parent_id && messageMap.has(message.parent_id)) {
      const parentMap = messageMap.get(message.parent_id)!;
      const childMap = messageMap.get(message.id)!;
      parentMap.children.set(message.id, childMap);
      messageMap.delete(message.id); // Remove from root level
    }
  });
  
  return messageMap;
}

// Helper function to organize messages into threads
function organizeThreads(messages: Message[]): {
  rootMessages: MessageMap[];
  messageMap: Map<string, MessageMap>;
} {
  const messageMap = createMessageMap(messages);
  const rootMessages = Array.from(messageMap.values());
  
  // Sort root messages by created_at
  rootMessages.sort((a, b) => 
    new Date(a.message.created_at).getTime() - new Date(b.message.created_at).getTime()
  );
  
  return { rootMessages, messageMap };
}

export function useMessages(channelId: string) {
  const queryClient = useQueryClient();

  // Query for fetching messages
  const messages = useQuery<{ rootMessages: MessageMap[]; messageMap: Map<string, MessageMap> }>({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      const response = await api.get<Message[]>(`/messages/channel/${channelId}`);
      return organizeThreads(response.data);
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    // Create a channel for both messages and reactions
    const channel = supabase
      .channel(`room:${channelId}`)
      // Subscribe to messages changes
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async () => {
          // Fetch the latest messages to ensure we have all related data
          const response = await api.get<Message[]>(`/messages/channel/${channelId}`);
          const newData = organizeThreads(response.data);
          queryClient.setQueryData(['messages', channelId], newData);
        }
      )
      // Subscribe to message reactions changes
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=in.(${
            messages.data?.messageMap 
              ? Array.from(messages.data.messageMap.keys()).join(',')
              : ''
          })`
        },
        async () => {
          // Fetch the latest messages to ensure we have all related data
          const response = await api.get<Message[]>(`/messages/channel/${channelId}`);
          const newData = organizeThreads(response.data);
          queryClient.setQueryData(['messages', channelId], newData);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient, messages.data?.messageMap]);

  // Mutation for sending messages
  const sendMessage = useMutation({
    mutationFn: async (data: SendMessageData) => {
      const response = await api.post<Message>('/messages', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });

  return {
    messages,
    sendMessage,
  };
} 