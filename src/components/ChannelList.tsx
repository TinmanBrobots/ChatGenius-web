'use client';

import { useChannels } from '@/hooks/useChannels';
import { useAuth } from '@/hooks/useAuth';
import { Channel } from '@/types';
import { Hash, Lock, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function ChannelList() {
  const { channels, addMember } = useChannels({ types: ['public', 'private'] });
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const currentChannelId = params?.channelId as string;

  if (channels.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (channels.isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>
          Failed to load channels. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!channels.data || channels.data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No channels available
      </div>
    );
  }

  // Sort channels: public first, then private, alphabetically within each group
  const sortedChannels = [...channels.data]
    .filter(channel => channel.type !== 'direct')
    .sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'private' ? 1 : -1;
    });

  const handleChannelClick = async (channel: Channel, e: React.MouseEvent) => {
    // If user is not a member of a public channel, join it first
    if (channel.type === 'public' && !channel.members?.some(member => member.profile_id === currentUser?.id)) {
      e.preventDefault();
      try {
        await addMember.mutateAsync({ channelId: channel.id, profileId: currentUser?.id as string });
        toast({
          title: "Channel joined",
          description: `You have joined #${channel.name}`,
        });
        router.push(`/chat/${channel.id}`);
      } catch (error) {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Failed to join channel",
          description: "There was an error joining the channel. Please try again.",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase px-2">
          Channels
        </div>
        <ul className="space-y-1">
          {sortedChannels.map((channel: Channel) => {
            const isMember = channel.members?.some(member => member.profile_id === currentUser?.id);
            return (
              <li key={channel.id}>
                <Link 
                  href={`/chat/${channel.id}`} 
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors",
                    "group relative",
                    currentChannelId === channel.id && "bg-accent"
                  )}
                  onClick={(e) => handleChannelClick(channel, e)}
                >
                  {channel.type === 'private' ? (
                    <Lock className="w-4 h-4 mr-2 text-muted-foreground" />
                  ) : (
                    <Hash className="w-4 h-4 mr-2 text-muted-foreground" />
                  )}
                  <span className="truncate flex-1">{channel.name}</span>
                  {channel.type === 'public' && !isMember && (
                    <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {channel.description && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md invisible group-hover:visible whitespace-nowrap">
                      {channel.description}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 