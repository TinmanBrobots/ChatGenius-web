import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from 'lucide-react'
import { MessageCard } from "@/components/ui/message-card"
import { MessageMap } from "@/types"
import { useRef, useEffect } from "react"

interface MessagesAreaProps {
  messages: MessageMap[] | undefined;
  isLoading: boolean;
  onReply: (messageId: string) => void;
  shouldAutoScroll: boolean;
  onScroll: () => void;
}

export function MessagesArea({ 
  messages, 
  isLoading, 
  onReply, 
  shouldAutoScroll,
  onScroll 
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldAutoScroll && messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea 
      className="flex-1 p-4" 
      onScroll={onScroll}
      ref={scrollAreaRef}
    >
      <div className="space-y-4">
        {messages?.map((messageMap) => (
          <MessageCard 
            key={messageMap.message.id} 
            messageMap={messageMap} 
            onReply={onReply} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
} 