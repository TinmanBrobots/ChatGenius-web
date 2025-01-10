"use client"

import { useState } from 'react'
import { useChannels } from '@/hooks/useChannels'
import { useProfiles } from '@/hooks/useProfiles'
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, MoreVertical, Crown, Shield, UserX, UserPlus, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ComboboxMulti } from "@/components/ui/combobox-multi"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from '@/hooks/useAuth'

interface ChannelMembersProps {
  channelId: string
}

export function ChannelMembers({ channelId }: ChannelMembersProps) {
  const { getChannel, getChannelMembers, updateMemberRole, removeMember, addMember } = useChannels()
  const { useSearchProfiles } = useProfiles()
  const { currentUser } = useAuth()
  const channel = getChannel(channelId)
  const members = getChannelMembers(channelId)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const searchProfilesQuery = useSearchProfiles(searchQuery)

  if (members.isLoading || channel.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (members.isError || channel.isError) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Failed to load members
      </div>
    )
  }

  const isAdmin = members.data?.some(
    member => member.profile_id === currentUser?.id && ['admin', 'owner'].includes(member.role)
  )

  const handleSearch = async (query: string) => {
    if (!query) return []
    
    try {
      setSearchQuery(query)
      await searchProfilesQuery.refetch()
      
      if (!searchProfilesQuery.data) return []
      
      // Filter out existing members
      const existingMemberIds = new Set(members.data?.map(member => member.profile_id))
      const availableProfiles = searchProfilesQuery.data.filter(
        profile => !existingMemberIds.has(profile.id)
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

  const handleAddMembers = async () => {
    if (!selectedMembers.length) return

    try {
      await Promise.all(
        selectedMembers.map(profileId =>
          addMember.mutateAsync({ channelId, profileId })
        )
      )

      toast({
        title: "Members added",
        description: "New members have been added to the channel.",
      })
      setSelectedMembers([])
      setIsAddMemberOpen(false)
    } catch (error) {
      console.error('Failed to add members:', error)
      toast({
        variant: "destructive",
        title: "Failed to add members",
        description: "There was an error adding the members. Please try again.",
      })
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      await updateMemberRole.mutateAsync({
        channelId,
        profileId: memberId,
        data: { role: newRole }
      })
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      })
    } catch (error) {
      console.error('Failed to update role:', error)
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: "There was an error updating the member role. Please try again.",
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember.mutateAsync({
        channelId,
        profileId: memberId
      })
      toast({
        title: "Member removed",
        description: "Member has been removed from the channel.",
      })
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: "There was an error removing the member. Please try again.",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

	console.log(isAdmin)
  return (
    <div className="space-y-4">
      {isAdmin && (
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Channel Members</DialogTitle>
              <DialogDescription>
                Search and select users to add to this channel.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <ComboboxMulti
                placeholder="Search users..."
                onSearch={handleSearch}
                value={selectedMembers}
                onChange={setSelectedMembers}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsAddMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMembers}
                  disabled={selectedMembers.length === 0}
                >
                  Add Selected Members
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {members.data?.map((member) => (
            <div key={member.profile_id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AvatarWithStatus
                  src={member.profile?.avatar_url || undefined}
                  fallback={member.profile?.username?.charAt(0).toUpperCase() || ''}
                  status={member.profile?.status || 'offline'}
                  lastSeen={member.profile?.last_seen_at}
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{member.profile?.username || ''}</span>
                    {getRoleIcon(member.role)}
                  </div>
                  {member.profile?.full_name && (
                    <p className="text-sm text-muted-foreground">{member.profile.full_name}</p>
                  )}
                </div>
              </div>
              {isAdmin && member.profile_id !== currentUser?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleRoleChange(member.profile_id, 'admin')}>
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(member.profile_id, 'moderator')}>
                      Make Moderator
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(member.profile_id, 'member')}>
                      Remove Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleRemoveMember(member.profile_id)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Remove from Channel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 