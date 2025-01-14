import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message, MessageMap, MessageReaction } from '@/types';
import api from '@/lib/axios';
import { supabase } from '@/lib/supabase';
import { socket } from '@/lib/socket';
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

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    // Join the channel room
    socket.emit('join_channel', channelId);

    // Handle new messages
    function handleNewMessage(message: Message) {
      queryClient.setQueryData(
        ['messages', channelId],
        (oldData: { rootMessages: MessageMap[]; messageMap: Map<string, MessageMap> } | undefined) => {
          if (!oldData) return oldData;

          // Create a new message map for the incoming message
          const newMessageMap: MessageMap = {
            message,
            children: new Map()
          };

          // If it's a reply, add it to the parent's children
          if (message.parent_id && oldData.messageMap.has(message.parent_id)) {
            const parentMap = oldData.messageMap.get(message.parent_id)!;
            parentMap.children.set(message.id, newMessageMap);
            
            return {
              ...oldData,
              messageMap: new Map(oldData.messageMap)
            };
          }

          // If it's a root message, add it to the root messages
          const newRootMessages = [...oldData.rootMessages];
          newRootMessages.push(newMessageMap);
          newRootMessages.sort((a, b) => 
            new Date(a.message.created_at).getTime() - new Date(b.message.created_at).getTime()
          );

          const newMessageMap2 = new Map(oldData.messageMap);
          newMessageMap2.set(message.id, newMessageMap);

          return {
            rootMessages: newRootMessages,
            messageMap: newMessageMap2
          };
        }
      );
    }

    // Handle new reactions
    function handleReactionUpdate({ messageId, reaction, type }: { 
      messageId: string; 
      reaction: MessageReaction;
      type: 'add' | 'remove';
    }) {
      queryClient.setQueryData(
        ['messages', channelId],
        (oldData: { rootMessages: MessageMap[]; messageMap: Map<string, MessageMap> } | undefined) => {
          if (!oldData) return oldData;

          // Find the message in the map structure
          let targetMessage: MessageMap | undefined;
          let isRoot = false;

          // Check root messages
          targetMessage = oldData.rootMessages.find(m => m.message.id === messageId);
          if (targetMessage) {
            isRoot = true;
          }

          // If not found in root, check all messages in the map
          if (!targetMessage) {
            for (const [, messageMap] of oldData.messageMap) {
              if (messageMap.message.id === messageId) {
                targetMessage = messageMap;
                break;
              }
              // Check children
              for (const [, childMap] of messageMap.children) {
                if (childMap.message.id === messageId) {
                  targetMessage = childMap;
                  break;
                }
              }
              if (targetMessage) break;
            }
          }

          if (!targetMessage) return oldData;

          // Update reactions
          const reactions = targetMessage.message.reactions || [];
          if (type === 'add') {
            reactions.push(reaction);
          } else {
            const index = reactions.findIndex(r => 
              r.profile_id === reaction.profile_id && r.emoji === reaction.emoji
            );
            if (index !== -1) {
              reactions.splice(index, 1);
            }
          }

          // Create new message with updated reactions
          const updatedMessage = {
            ...targetMessage.message,
            reactions
          };

          // Update the message map
          const newMessageMap = new Map(oldData.messageMap);
          const updatedMessageMap: MessageMap = {
            message: updatedMessage,
            children: targetMessage.children
          };

          if (isRoot) {
            // Update in root messages
            const newRootMessages = oldData.rootMessages.map(m =>
              m.message.id === messageId ? updatedMessageMap : m
            );
            return {
              rootMessages: newRootMessages,
              messageMap: newMessageMap
            };
          } else {
            // Update in message map
            newMessageMap.set(messageId, updatedMessageMap);
            return {
              rootMessages: oldData.rootMessages,
              messageMap: newMessageMap
            };
          }
        }
      );
    }

    // Handle typing indicators
    function handleTyping({ user_id, channel_id }: { user_id: string; channel_id: string }) {
      if (channel_id === channelId) {
        queryClient.setQueryData(['typing', channelId], (old: Set<string> | undefined) => {
          const typingUsers = old ? new Set(old) : new Set<string>();
          typingUsers.add(user_id);
          
          setTimeout(() => {
            queryClient.setQueryData(['typing', channelId], (current: Set<string> | undefined) => {
              if (!current) return current;
              const updated = new Set(current);
              updated.delete(user_id);
              return updated;
            });
          }, 3000);

          return typingUsers;
        });
      }
    }

    socket.on('new_message', handleNewMessage);
    socket.on('reaction_update', handleReactionUpdate);
    socket.on('user_typing', handleTyping);

    // Cleanup
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('reaction_update', handleReactionUpdate);
      socket.off('user_typing', handleTyping);
      socket.emit('leave_channel', channelId);
    };
  }, [channelId, queryClient]);

  // Set up Supabase realtime subscription (keep existing subscription for backup/redundancy)
  useEffect(() => {
    const channel = supabase
      .channel(`room:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async () => {
          const response = await api.get<Message[]>(`/messages/channel/${channelId}`);
          const newData = organizeThreads(response.data);
          queryClient.setQueryData(['messages', channelId], newData);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=in.(${
            messages.data?.messageMap 
              ? Array.from(messages.data.messageMap.keys()).join(',')
              : ''
          })`
        },
        async () => {
          const response = await api.get<Message[]>(`/messages/channel/${channelId}`);
          const newData = organizeThreads(response.data);
          queryClient.setQueryData(['messages', channelId], newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient, messages.data?.messageMap]);

  // Mutation for sending messages
  const sendMessage = useMutation({
    mutationFn: async (data: SendMessageData) => {
      const response = await api.post<Message>('/messages', data);
      socket.emit('send_message', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });

  // Mutation for adding reactions
  const addReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.post<MessageReaction>(`/messages/${messageId}/reactions`, { emoji });
      socket.emit('reaction_update', { 
        channel_id: channelId,
        messageId, 
        reaction: response.data,
        type: 'add'
      });
      return response.data;
    }
  });

  // Mutation for removing reactions
  const removeReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.delete(`/messages/${messageId}/reactions/${emoji}`);
      socket.emit('reaction_update', { 
        channel_id: channelId,
        messageId, 
        reaction: response.data,
        type: 'remove'
      });
      return response.data;
    }
  });

  // Function to emit typing status
  const emitTyping = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      socket.emit('typing', {
        user_id: userId,
        channel_id: channelId
      });
    }
  };

  return {
    messages,
    sendMessage,
    addReaction,
    removeReaction,
    emitTyping,
  };
} 