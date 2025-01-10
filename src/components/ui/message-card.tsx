import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { MessageMap } from '@/types'
import { MessageReactions } from '@/components/MessageReactions'

interface MessageCardProps {
  messageMap: MessageMap;
  onReply: (messageId: string) => void;
  depth?: number;
}

const threadColors = [
  'border-primary',
  'border-blue-500',
  'border-green-500',
  'border-purple-500',
  'border-orange-500'
];

export function MessageCard({ messageMap, onReply, depth = 0 }: MessageCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasReplies = messageMap.children.size > 0;
  const message = messageMap.message;

  return (
    <div className="space-y-2">
      <div className="flex relative">
        <div className={`flex space-x-8 group relative w-full`}>
          {depth > 0 && Array.from({ length: depth }).map((_, index) => (
            <div
              key={index}
              className={`top-0 bottom-0 border-l-2 ${threadColors[index % threadColors.length]} opacity-30`}
              style={{ marginLeft: index > 0 ? '32px' : '0' }}
            />
          ))}
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={message.sender?.avatar_url || undefined} alt={message.sender?.username || ''} />
                  <AvatarFallback>{message.sender?.username?.charAt(0).toUpperCase() || ''}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{message.sender?.username || ''}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                    {message.is_edited && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                    {hasReplies && (
                      <span className="text-xs text-muted-foreground">
                        ({messageMap.children.size} repl{messageMap.children.size === 1 ? 'y' : 'ies'})
                      </span>
                    )}
                  </div>
                  <p className="mt-1">{message.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {hasReplies && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onReply(message.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <MessageReactions messageId={message.id} reactions={message.reactions || []} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {!isCollapsed && messageMap.children.size > 0 && (
        <div className="space-y-2 relative">
          {Array.from(messageMap.children.values()).map(childMap => (
            <MessageCard 
              key={childMap.message.id} 
              messageMap={childMap} 
              onReply={onReply} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
} 