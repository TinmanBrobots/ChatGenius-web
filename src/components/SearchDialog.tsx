import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import api from '@/lib/axios'
import { Message } from '@/types'

interface SearchResult extends Message {
  channel_name?: string;
}

export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const searchResults = useQuery<SearchResult[]>({
    queryKey: ['messageSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await api.get<SearchResult[]>(`/messages/search?q=${encodeURIComponent(searchQuery)}`).catch(error => {
        console.error('Search error:', error);
        return { data: [] };
      });
      return response.data;
    },
    enabled: searchQuery.length > 0,
  });

  const handleMessageClick = (channelId: string) => {
    router.push(`/chat/${channelId}`);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <ScrollArea className="h-[400px]">
            {searchResults.isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : searchResults.data?.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                {searchQuery ? 'No messages found' : 'Start typing to search messages'}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.data?.map((message) => (
                  <button
                    key={message.id}
                    className="w-full p-4 text-left hover:bg-muted rounded-lg transition-colors"
                    onClick={() => handleMessageClick(message.channel_id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {message.sender?.username}
                        {message.channel_name && (
                          <span className="text-muted-foreground"> in #{message.channel_name}</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{message.content}</p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
} 