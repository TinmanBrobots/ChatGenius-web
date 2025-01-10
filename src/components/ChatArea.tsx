"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, Send, Loader2, Users } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useChannels } from '@/hooks/useChannels'
import { ChannelMember } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChannelMembers } from "@/components/ChannelMembers"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { MessageCard } from "@/components/ui/message-card"

interface ChatAreaProps {
  channelId: string;
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const { currentUser } = useAuth();
  const { messages, sendMessage } = useMessages(channelId);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { getChannel, getChannelMembers } = useChannels();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const channel = getChannel(channelId);
  const members = getChannelMembers(channelId);

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  };

  useEffect(() => {
    if (messages.data) {
      scrollToBottom();
    }
  }, [messages.data]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setShouldAutoScroll(true);
      await sendMessage.mutateAsync({
        content: newMessage,
        parent_id: replyingTo || undefined,
        channel_id: channelId
      });
      setNewMessage('');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const insertEmoji = (emoji: string) => {
    const position = cursorPosition !== null ? cursorPosition : newMessage.length;
    const newValue = newMessage.slice(0, position) + emoji + newMessage.slice(position);
    setNewMessage(newValue);
    const newPosition = position + emoji.length;
    setCursorPosition(newPosition);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(newPosition, newPosition);
    }
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    setShouldAutoScroll(true);
  };

  const getOtherUser = (members: ChannelMember[] | undefined) => {
    if (!members) return null;
    return members.find(member => member.profile_id !== currentUser?.id)?.profile;
  }

  if (channel.isLoading || messages.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
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
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{channel.data.type === 'direct' ? getOtherUser(members.data)?.full_name : `#${channel.data.name}`}</h2>
            {channel.data.description ? (
              <p className="text-sm text-muted-foreground">{channel.data.description}</p>
            ) : (
              channel.data.type === 'direct' ? <p className="text-sm text-muted-foreground">@{getOtherUser(members.data)?.username}</p> : null
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Users className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Channel Members</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ChannelMembers channelId={channelId} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <ScrollArea 
        className="flex-1 p-4" 
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="space-y-4">
          {messages.data?.rootMessages.map((messageMap) => (
            <MessageCard 
              key={messageMap.message.id} 
              messageMap={messageMap} 
              onReply={handleReply} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 p-2 bg-muted rounded">
            <span className="text-sm text-muted-foreground">
              Replying to a message
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyUp={handleInputKeyUp}
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
            className="flex-1"
          />
          <EmojiPicker
            onEmojiSelect={insertEmoji}
            trigger={
              <Button type="button" size="icon" variant="ghost">
                <Smile className="w-4 h-4" />
              </Button>
            }
          />
          <Button type="submit" disabled={sendMessage.isPending}>
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {replyingTo ? 'Reply' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}

