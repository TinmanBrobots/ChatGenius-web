"use client"

import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthContext } from '@/providers/AuthProvider';
import { MessageReaction } from '@/types';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { useMessages } from '@/hooks/useMessages';
import _ from 'lodash';

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  channelId: string;
}

export function MessageReactions({ messageId, reactions, channelId }: MessageReactionsProps) {
  const { user } = useAuthContext();
  const { addReaction, removeReaction } = useMessages(channelId);

  // Group reactions by emoji, unique by profile_id
  const reactionGroups = reactions.reduce((acc: Record<string, MessageReaction[]>, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    if (!acc[reaction.emoji].some(r => r.profile_id === reaction.profile_id)) {
      acc[reaction.emoji].push(reaction);
    }
    return acc;
  }, {});

  const handleEmojiSelect = async (emoji: string) => {
    const hasReacted = reactions.some(
      r => r.emoji === emoji && r.profile_id === user?.id
    );

    if (hasReacted) {
      await removeReaction.mutateAsync({ messageId, emoji });
    } else {
      await addReaction.mutateAsync({ messageId, emoji });
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