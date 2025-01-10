"use client"

import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthContext } from '@/providers/AuthProvider';
import { MessageReaction } from '@/types';
import { EmojiPicker } from '@/components/ui/emoji-picker';

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
}

export function MessageReactions({ messageId, reactions }: MessageReactionsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((acc: Record<string, MessageReaction[]>, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  const addReaction = useMutation({
    mutationFn: async (emoji: string) => {
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const removeReaction = useMutation({
    mutationFn: async (emoji: string) => {
      await api.delete(`/messages/${messageId}/reactions/${emoji}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const handleEmojiSelect = async (emoji: string) => {
    const hasReacted = reactions.some(
      r => r.emoji === emoji && r.profile_id === user?.id
    );

    if (hasReacted) {
      await removeReaction.mutateAsync(emoji);
    } else {
      await addReaction.mutateAsync(emoji);
    }
  };

  // Get array of emojis that the current user has reacted with
  const userReactions = reactions
    .filter(r => r.profile_id === user?.id)
    .map(r => r.emoji);

  return (
    <div className="flex items-center gap-2">
      <EmojiPicker
        onEmojiSelect={handleEmojiSelect}
        selectedEmojis={userReactions}
        trigger={
          <Button variant="ghost" size="sm" className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Smile className="h-4 w-4 mr-1" />
            React
          </Button>
        }
      />

      {/* Existing reactions */}
      <div className="flex gap-1">
        {Object.entries(reactionGroups).map(([emoji, reactions]) => {
          const hasReacted = reactions.some(r => r.profile_id === user?.id);
          return (
            <Button
              key={emoji}
              variant={hasReacted ? "secondary" : "outline"}
              size="sm"
              className="h-6 px-2 gap-1"
              onClick={() => handleEmojiSelect(emoji)}
            >
              <span>{emoji}</span>
              <span className="text-xs">{reactions.length}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
} 