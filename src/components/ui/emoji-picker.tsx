"use client"

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Common emoji reactions (frequently used)
const COMMON_EMOJIS = ['👍', '👎', '❤️', '😂', '🎉', '🤔', '👀', '🚀'];

// Extended emoji list
const EXTENDED_EMOJIS = [
  '💯', '🤗', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '👏', '🙌', '👋', '🤝', '💪', '💔', '✨',
  '🔥', '💫', '💭', '🔍', '🎊', '🎈', '🎂', '🎁',
  '🎯', '🌟', '⭐', '✅', '❌', '❓', '❗', '💡',
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😝', '😜', '📌'
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  selectedEmojis?: string[];
  triggerClassName?: string;
}

export function EmojiPicker({ 
  onEmojiSelect, 
  trigger, 
  selectedEmojis = [],
  triggerClassName
}: EmojiPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    // Don't close the popover after selection
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-6 px-2", triggerClassName)}
          >
            😊 React
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start">
        <div className="space-y-2">
          {/* Common emojis */}
          <div className="grid grid-cols-8 gap-1">
            {COMMON_EMOJIS.map(emoji => (
              <Button
                key={emoji}
                variant={selectedEmojis.includes(emoji) ? "secondary" : "ghost"}
                className="h-8 w-8 p-0 hover:bg-accent"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>

          {/* Expand/Collapse button */}
          <Button
            variant="ghost"
            className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </Button>

          {/* Extended emoji list */}
          {isExpanded && (
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-8 gap-1">
                {EXTENDED_EMOJIS.map(emoji => (
                  <Button
                    key={emoji}
                    variant={selectedEmojis.includes(emoji) ? "secondary" : "ghost"}
                    className="h-8 w-8 p-0 hover:bg-accent"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 