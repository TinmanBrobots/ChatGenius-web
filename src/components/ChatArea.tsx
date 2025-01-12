"use client"

import { useState } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useChannels } from '@/hooks/useChannels'
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/components/ui/use-toast"
import { ChatHeader } from "@/components/ChatHeader"
import { MessagesArea } from "@/components/MessagesArea"
import { MessageInput } from "@/components/MessageInput"

interface ChatAreaProps {
  channelId: string;
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const { currentUser } = useAuth();
  const { messages, sendMessage } = useMessages(channelId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { getChannel, getChannelMembers } = useChannels();
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const channel = getChannel(channelId);
  const members = getChannelMembers(channelId);

  const handleScroll = () => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollArea) return;
    
    const { scrollHeight, scrollTop, clientHeight } = scrollArea;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  };

  const handleSendMessage = async (content: string) => {
    try {
      setShouldAutoScroll(true);
      await sendMessage.mutateAsync({
        content,
        parent_id: replyingTo || undefined,
        channel_id: channelId
      });
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
      })
    }
  };

  const getOtherUser = () => {
    if (!members.data) return null;
    return members.data.find(member => member.profile_id !== currentUser?.id)?.profile;
  }

  const getCurrentUserRole = () => {
    if (!members.data || !currentUser) return undefined;
    const currentMember = members.data.find(member => member.profile_id === currentUser.id);
    return currentMember?.role;
  }

  const getLastReadAt = () => {
    if (!members.data || !currentUser) return undefined;
    const currentMember = members.data.find(member => member.profile_id === currentUser.id);
    return currentMember?.last_read_at;
  }

  if (channel.isError || !channel.data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Channel not found
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ChatHeader 
        channel={channel.data} 
        otherUser={getOtherUser()} 
        currentUserRole={getCurrentUserRole()}
      />
      <MessagesArea 
        messages={messages.data?.rootMessages}
        isLoading={channel.isLoading || messages.isLoading}
        onReply={setReplyingTo}
        shouldAutoScroll={shouldAutoScroll}
        onScroll={handleScroll}
        lastReadAt={getLastReadAt()}
      />
      <MessageInput 
        channelId={channelId}
        onSendMessage={handleSendMessage}
        isLoading={sendMessage.isPending}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}

