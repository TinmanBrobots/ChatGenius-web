"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useChannels } from '@/hooks/useChannels'
import { useProfiles } from '@/hooks/useProfiles'
import { useRouter } from 'next/navigation'
import { Hash, Lock, Users } from 'lucide-react'
import { ComboboxMulti, ComboboxOption } from '@/components/ui/combobox-multi'
import { toast } from '@/components/ui/use-toast'
interface ChannelCreationFormProps {
  onClose: () => void
}

export function ChannelCreationForm({ onClose }: ChannelCreationFormProps) {
  const [channelName, setChannelName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const { createChannel } = useChannels()
  const { useSearchProfiles } = useProfiles()
  const searchProfilesQuery = useSearchProfiles(searchQuery)
  const router = useRouter()

  const handleSearch = async (query: string): Promise<ComboboxOption[]> => {
    if (!query) return []
    
    try {
      setSearchQuery(query)
      await searchProfilesQuery.refetch()
      
      if (!searchProfilesQuery.data) return []
      
      return searchProfilesQuery.data.map(profile => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const channel = await createChannel.mutateAsync({
        channelData: {
          name: channelName.toLowerCase().replace(/\s+/g, '-'),
          description,
          type: isPrivate ? 'private' : 'public',
        },
        member_ids: isPrivate ? selectedMembers : undefined,
      })

      toast({
        title: "Channel created",
        description: `#${channel.name} has been created successfully.`,
      })

      onClose()
      // Navigate to the new channel
      router.push(`/chat/${channel.id}`)
    } catch (error) {
      console.error('Failed to create channel:', error)
      toast({
        variant: "destructive",
        title: "Failed to create channel",
        description: "There was an error creating the channel. Please try again.",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="channel-name">Channel name</Label>
        <div className="relative">
          <div className="absolute left-2 top-2.5 text-muted-foreground">
            {isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
          </div>
          <Input
            id="channel-name"
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="new-channel"
            className="pl-8"
            required
            pattern="^[a-zA-Z0-9-]+$"
            title="Channel names can only contain letters, numbers, and hyphens"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Channel names can only contain lowercase letters, numbers, and hyphens.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel-description">Description</Label>
        <Textarea
          id="channel-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this channel about?"
          className="resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Let others know what this channel is for.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="private-channel" className="mr-2">Private channel</Label>
              <Switch
                id="private-channel"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Private channels are only visible to their members
            </p>
          </div>
        </div>

        {isPrivate && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Add members
            </Label>
            <ComboboxMulti
              placeholder="Search users..."
              onSearch={handleSearch}
              value={selectedMembers}
              onChange={setSelectedMembers}
            />
            <p className="text-xs text-muted-foreground">
              Add members who will have access to this private channel
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button 
          type="submit" 
          disabled={createChannel.isPending || !channelName.trim() || (isPrivate && selectedMembers.length === 0)}
        >
          {createChannel.isPending ? 'Creating...' : 'Create Channel'}
        </Button>
      </div>
    </form>
  )
}

