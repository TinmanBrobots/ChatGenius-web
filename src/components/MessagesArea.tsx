import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, ArrowUp } from 'lucide-react'
import { MessageCard } from "@/components/ui/message-card"
import { MessageMap } from "@/types"
import { useRef, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

interface MessagesAreaProps {
  messages: MessageMap[] | undefined;
  isLoading: boolean;
  onReply: (messageId: string) => void;
  shouldAutoScroll: boolean;
  onScroll: () => void;
  lastReadAt?: string;
}

export function MessagesArea({ 
  messages, 
  isLoading, 
  onReply, 
  shouldAutoScroll,
  onScroll,
  lastReadAt 
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showUnreadButton, setShowUnreadButton] = useState(false);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);
	const [hasClicked, setHasClicked] = useState(false);

  // Handle initial highlight from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedMessageId(highlightId);
    }
  }, [searchParams]);

  // Handle click anywhere to remove highlight
  useEffect(() => {
    const handleClick = () => {
      setHighlightedMessageId(null);
			setHasClicked(true);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Set up intersection observer for the first unread message
  useEffect(() => {
    if (!firstUnreadMessageId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowUnreadButton(false);
          } else {
            // Only show the button if we have unread messages
            if (firstUnreadMessageId) {
              setShowUnreadButton(true);
            }
          }
        });
      },
      {
        root: scrollAreaRef.current,
        threshold: 0.5, // Message is considered visible when 50% in view
      }
    );

    const messageElement = document.getElementById(`message-${firstUnreadMessageId}`);
    if (messageElement) {
      observer.observe(messageElement);
    }

    return () => observer.disconnect();
  }, [firstUnreadMessageId]);

  // Check for unread messages and update button visibility
  useEffect(() => {
    if (!messages || !lastReadAt) {
      setShowUnreadButton(false);
      setFirstUnreadMessageId(null);
      return;
    }

    const firstUnreadMessage = messages.find(msg => hasUnreadMessage(msg));
    if (firstUnreadMessage) {
      setFirstUnreadMessageId(firstUnreadMessage.message.id);
      setShowUnreadButton(true);
    } else {
      setFirstUnreadMessageId(null);
      setShowUnreadButton(false);
    }
  }, [messages, lastReadAt]);

  // Handle auto-scroll
  useEffect(() => {
    if (!messages) return;

    // If there's a highlighted message, scroll to it
    if (highlightedMessageId) {
      const messageElement = document.getElementById(`message-${highlightedMessageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // If shouldAutoScroll is true, scroll to bottom
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll, highlightedMessageId]);

  const scrollToFirstUnread = () => {
    if (!messages || !lastReadAt) return;

    const firstUnreadMessage = messages.find(
      msg => hasUnreadMessage(msg)
    );

    if (firstUnreadMessage) {
      const messageElement = document.getElementById(`message-${firstUnreadMessage.message.id}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isUnread = (messageCreatedAt: string) => {
    if (!lastReadAt) return false;
    return new Date(messageCreatedAt).getTime() > new Date(lastReadAt).getTime();
  };

  const hasUnreadMessage = (messageMap: MessageMap) => {
    if (isUnread(messageMap.message.created_at)) return true;
    for (const child of messageMap.children) {
      if (hasUnreadMessage(child[1])) return true;
    }
    return false;
  };

  return (
		<ScrollArea 
			className="flex-1 p-4" 
			onScroll={onScroll}
			ref={scrollAreaRef}
		>
			{showUnreadButton && !hasClicked && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
            onClick={scrollToFirstUnread}
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Unread messages
          </Button>
        </div>
      )}
			<div className="space-y-4">
				{messages?.map((messageMap) => (
					<div
						key={messageMap.message.id}
						id={`message-${messageMap.message.id}`}
						ref={messageMap.message.id === firstUnreadMessageId ? firstUnreadRef : undefined}
					>
						<MessageCard
							highlighted={highlightedMessageId === messageMap.message.id}
							isUnread={message => isUnread(message.created_at)}
							messageMap={messageMap} 
							onReply={onReply} 
						/>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>
		</ScrollArea>
  );
} 