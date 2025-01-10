import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, Send, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { FileUploadDialog } from "@/components/ui/file-upload-dialog"

interface MessageInputProps {
  channelId: string;
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  replyingTo: string | null;
  onCancelReply: () => void;
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await onSendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
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