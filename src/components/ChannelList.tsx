'use client';

import { useChannels } from '@/hooks/useChannels';
import { useAuth } from '@/hooks/useAuth';
import { Channel } from '@/types';
import { Hash, Lock, Loader2, Plus, RefreshCw, X } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ChannelCreationForm } from './ChannelCreationForm';
import { useState } from 'react';
import { Separator } from '@radix-ui/react-separator';

export function ChannelList() {
  const { channels, addMember } = useChannels({ types: ['public', 'private'] });
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const currentChannelId = params?.channelId as string;
  const [showChannelForm, setShowChannelForm] = useState(false)

  if (channels.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  // Sort channels: public first, then private, alphabetically within each group
  const sortedChannels = [...(channels.data || [])]
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
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Channels</h2>
        <div className="flex items-center gap-2">
          <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => channels.refetch()}
              disabled={channels.isRefetching}
            >
            <RefreshCw className={`h-3 w-3 ${channels.isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" className="px-2" onClick={() => setShowChannelForm(!showChannelForm)}>
            {showChannelForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {showChannelForm && (
        <ChannelCreationForm 
          onClose={() => setShowChannelForm(false)} 
        />
      )}
      {showChannelForm && <Separator className="my-4" />}
      <div className="space-y-2">
        <ul className="space-y-1">
          {channels.isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
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