"use client"

import { useChannels } from '@/hooks/useChannels'
import { useProfiles } from '@/hooks/useProfiles'
import { useAuth } from '@/hooks/useAuth'
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ComboboxMulti } from "@/components/ui/combobox-multi"
import { useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Channel } from '@/types'

export function DirectMessageList() {
  const { channels, createChannel } = useChannels({ types: ['direct'] })
  const { useSearchProfiles } = useProfiles()
  const { currentUser } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const searchProfilesQuery = useSearchProfiles(searchQuery)
  const router = useRouter()
  const params = useParams()
  const currentChannelId = params?.channelId as string

  const directChannels = channels.data?.filter(channel => channel.type === 'direct') || []

  // Helper function to get the other member's info from a DM channel
  const getOtherMember = (channel: Channel) => {
    if (!channel.members || !currentUser) return null;
    return channel.members.find(
      member => member.profile_id !== currentUser.id
    )?.profile;
  }

  // Find existing DM channel with a user
  const findExistingDMChannel = (userId: string) => {
    return directChannels.find(channel => 
      channel.members?.some(member => member.profile_id === userId)
    );
  }

  const handleSearch = async (query: string) => {
    if (!query) return []
    
    try {
      setSearchQuery(query)
      await searchProfilesQuery.refetch()
      
      if (!searchProfilesQuery.data) return []
      
      // Filter out current user and users we already have DMs with
      const availableProfiles = searchProfilesQuery.data.filter(profile => 
        profile.id !== currentUser?.id && !findExistingDMChannel(profile.id)
      )
      
      return availableProfiles.map(profile => ({
        value: profile.id,
        label: profile.username,
        description: profile.full_name || undefined
      }))
    } catch (error) {
      console.error('Failed to search profiles:', error)
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Failed to search for users. Please try again.",
      })
      return []
    }
  }

  const handleStartChat = async () => {
    if (!selectedUser.length) return

    try {
      // Check if DM channel already exists
      const existingChannel = findExistingDMChannel(selectedUser[0])
      if (existingChannel) {
        setSelectedUser([])
        setIsDialogOpen(false)
        router.push(`/chat/${existingChannel.id}`)
        return
      }

      // Create new DM channel
      const channel = await createChannel.mutateAsync({
        channelData: {
          name: `dm-${Date.now()}`, // We'll use a timestamp to ensure uniqueness
          type: 'direct'
        },
        member_ids: selectedUser
      })

      toast({
        title: "Chat started",
        description: "Direct message channel created successfully.",
      })
      setSelectedUser([])
      setIsDialogOpen(false)
      router.push(`/chat/${channel.id}`)
    } catch (error) {
      console.error('Failed to create direct message:', error)
      toast({
        variant: "destructive",
        title: "Failed to start chat",
        description: "There was an error starting the chat. Please try again.",
      })
    }
  }

  if (channels.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Direct Messages</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a Direct Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <ComboboxMulti
                placeholder="Search users..."
                onSearch={handleSearch}
                value={selectedUser}
                onChange={setSelectedUser}
                maxSelected={1}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartChat}
                  disabled={selectedUser.length === 0}
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1">
        {channels.data?.filter(channel => channel.type === 'direct').map((channel) => {
          const otherUser = channel.members?.find(member => member.profile_id !== currentUser?.id)?.profile;
          
          return (
            <Link 
              key={channel.id} 
              href={`/chat/${channel.id}`}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors",
                params?.channelId === channel.id && "bg-accent"
              )}
            >
              <AvatarWithStatus
                className="h-8 w-8"
                src={otherUser?.avatar_url || undefined}
                fallback={otherUser?.username?.charAt(0).toUpperCase() || ''}
                status={otherUser?.status || 'offline'}
                lastSeen={otherUser?.last_seen_at}
              />
              <span className="text-sm font-medium">{otherUser?.username || 'Unknown User'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  )
} 