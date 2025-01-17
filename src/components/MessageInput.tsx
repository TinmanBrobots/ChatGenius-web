import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, Send, Loader2, AtSign } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { FileUploadDialog } from "@/components/ui/file-upload-dialog"
import { ComboboxMulti, ComboboxOption } from '@/components/ui/combobox-multi'
import { useProfiles } from '@/hooks/useProfiles'
import { toast } from '@/components/ui/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/hooks/useAuth"

interface MessageInputProps {
  channelId: string;
  onSendMessage: (content: string, mentionedUsers?: string[]) => Promise<void>;
  isLoading: boolean;
  replyingTo: string | null;
  onCancelReply: () => void;
}

interface MentionedUser {
  id: string;
  username: string;
}

export function MessageInput({ 
  channelId, 
  onSendMessage, 
  isLoading,
  replyingTo,
  onCancelReply
}: MessageInputProps) {
  const [newMessage, setNewMessage] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { useSearchProfiles } = useProfiles();
  const { currentUser } = useAuth();
  const searchProfilesQuery = useSearchProfiles(searchQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Extract just the IDs for the API call
      const mentionIds = mentionedUsers.map(user => user.id);
      await onSendMessage(newMessage, mentionIds.length > 0 ? mentionIds : undefined);
      setNewMessage('');
      setMentionedUsers([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNewMessage(newValue);
    const selectionStart = e.target.selectionStart || 0;
    setCursorPosition(selectionStart);

    // Check if @ was just typed
    if (newValue.charAt(selectionStart - 1) === '@') {
      setShowMentionSearch(true);
      setSearchQuery('');

      // Let the component render before focusing
      setTimeout(() => {
        const searchInput = document.querySelector('#combobox-multi-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 10);
    } else {
      setShowMentionSearch(false);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
    
    // Close mention search on escape
    if (e.key === 'Escape') {
      setShowMentionSearch(false);
    }
  };

  const handleUserSelect = async (userId: string) => {
    try {
      const { data: user } = await searchProfilesQuery.refetch();
      const selectedUser = user?.find(p => p.id === userId);
      if (!selectedUser || cursorPosition === null) return;

      // Find the position of the @ symbol before the cursor
      const beforeCursor = newMessage.slice(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf('@');
      
      // If we found an @, use it as the start of our replacement
      const startPos = lastAtIndex >= 0 ? lastAtIndex : cursorPosition - 1;
      
      // Insert the mention
      const beforeMention = newMessage.slice(0, startPos);
      const afterMention = newMessage.slice(cursorPosition);
      const mentionText = `@${selectedUser.username} `;
      const newValue = beforeMention + mentionText + afterMention;

      // Update message and cursor position
      setNewMessage(newValue);
      const newPosition = startPos + mentionText.length;
      setCursorPosition(newPosition);

      // Add to mentioned users
      setMentionedUsers([...mentionedUsers, {
        id: selectedUser.id,
        username: selectedUser.username,
      }]);

      // Reset mention search
      setShowMentionSearch(false);
      setSearchQuery('');

      // Focus input and set cursor position
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    } catch (error) {
      console.error('Failed to handle user selection:', error);
      toast({
        variant: "destructive",
        title: "Failed to mention user",
        description: "There was an error mentioning the user. Please try again.",
      });
    }
  };

  const handleUserDeselect = (userId: string) => {
    // Find the user being deselected
    const userToRemove = mentionedUsers.find(user => user.id === userId);
    if (!userToRemove) return;

    // Remove the @username from the message text
    const mentionText = `@${userToRemove.username}`;
    const mentionTextPosition = newMessage.indexOf(mentionText);
    const beforeMention = newMessage.slice(0, mentionTextPosition);
    const afterMention = newMessage.slice(mentionTextPosition + mentionText.length);
    const newValue = beforeMention + afterMention.trimStart();

    // Update message
    setNewMessage(newValue);

    // Remove from mentioned users
    setMentionedUsers(mentionedUsers.filter(user => user.id !== userId));

    // Focus input at the position where the mention was removed
    if (inputRef.current) {
      inputRef.current.focus();
      if (mentionTextPosition < (cursorPosition || 0)) {
        const newPosition = cursorPosition ? cursorPosition - mentionText.length : 0;
        inputRef.current.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }
    }
  };

  // Handle click outside of mention search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const mentionSearch = document.querySelector('.mention-search');
      const comboboxOptions = document.querySelectorAll('.combobox-option');
      const comboboxInput = document.querySelector('.combobox-input');
      const atButton = document.querySelector('[data-at-button]');

      if (!mentionSearch || !comboboxOptions || !comboboxInput || !atButton) return;

      if (!mentionSearch.contains(event.target as Node) && 
          !Array.from(comboboxOptions).some(option => option.contains(event.target as Node)) &&
          !comboboxInput.contains(event.target as Node) &&
          !atButton.contains(event.target as Node)) {
        setShowMentionSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string): Promise<ComboboxOption[]> => {
    if (!query) return [];
    
    try {
      setSearchQuery(query);
      await searchProfilesQuery.refetch();
      
      if (!searchProfilesQuery.data) return [];
      
      return searchProfilesQuery.data.map(profile => ({
        value: profile.id,
        label: profile.username,
        description: profile.full_name || undefined
      }));
    } catch (error) {
      console.error('Failed to search profiles:', error);
      return [];
    }
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

  return (
    <div className="border-t p-4">
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 p-2 bg-muted rounded">
          <span className="text-sm text-muted-foreground">
            Replying to a message
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
          >
            Cancel
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <FileUploadDialog 
          channelId={channelId} 
          onUploadComplete={() => {
            // Optionally handle upload completion
          }} 
        />
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyUp={handleInputKeyUp}
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
            className="flex-1"
            id="message-input"
          />
          {showMentionSearch && (
            <div className="absolute bottom-full mb-1 left-0">
              <div className="bg-popover text-popover-foreground shadow-md rounded-md border p-1 mention-search" style={{ width: '300px' }}>
                <ComboboxMulti
                  placeholder="Search users..."
                  onSearch={handleSearch}
                  value={mentionedUsers.map(user => user.id)}
                  onChange={(values) => {
                    const currentIds = mentionedUsers.map(u => u.id);
                    // Check if a value was removed
                    if (values.length < currentIds.length) {
                      const removedId = currentIds.find(id => !values.includes(id));
                      if (removedId) {
                        handleUserDeselect(removedId);
                      }
                    } else if (values.length > currentIds.length) {
                      // New value added
                      const newId = values.find(id => !currentIds.includes(id));
                      if (newId) {
                        handleUserSelect(newId);
                      }
                    }
                  }}
                  startOpen={true}
                  excludeValues={currentUser ? [currentUser.id] : []}
                  side="top"
                  initSelectedValues={mentionedUsers.reduce((acc, user) => {
                    acc[user.id] = user.username;
                    return acc;
                  }, {} as Record<string, string>)}
                />
              </div>
            </div>
          )}
        </div>
        <Button 
          type="button" 
          size="icon" 
          variant="ghost"
          onClick={() => setShowMentionSearch(!showMentionSearch)}
          data-at-button
        >
          <AtSign className="w-4 h-4" />
        </Button>
        <EmojiPicker
          onEmojiSelect={insertEmoji}
          trigger={
            <Button type="button" size="icon" variant="ghost">
              <Smile className="w-4 h-4" />
            </Button>
          }
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {replyingTo ? 'Reply' : 'Send'}
        </Button>
      </form>
    </div>
  );
} 