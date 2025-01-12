"use client"

import { Sidebar } from "@/components/Sidebar"
import { FileList } from "@/components/ui/file-list"
import { useChannels } from "@/hooks/useChannels"
import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { Channel, ChannelMember } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { Hash, Lock, Users } from 'lucide-react'


export default function FilesPage() {
  const { currentUser } = useAuth()
  const { channels } = useChannels()
  const [isLoading, setIsLoading] = useState(false)
  const [shouldRefresh, setShouldRefresh] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

	const getOtherMemberName = (channel: Channel) => {
    if (!channel.members || !currentUser) return 'Direct Message'
    const otherMember = channel.members.find(member => 
      member.profile_id !== currentUser.id
    )
    return otherMember?.profile?.full_name || otherMember?.profile?.username || 'Direct Message'
  }

	const sortChannels = (channels?: Channel[]) => {
		if (!channels) return []
		return channels.sort((a, b) => {
			if (a.type === b.type) {
				return a.name.localeCompare(b.name)
			}
			return a.type === 'public' ? -1 
				: a.type === 'private' ? 0
				: 1 // 'direct'
		})
	}

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-muted-foreground">All files from your channels and conversations</p>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {sortChannels(channels.data).map((channel) => (
              <div key={channel.id} className="space-y-4">
                <h2 className="text-lg font-semibold">{
									channel.type === 'private' ? <span className="flex items-center gap-1"><Lock className="h-4 w-4" />{channel.name}</span> :
									channel.type === 'public' ? <span className="flex items-center gap-1"><Hash className="h-4 w-4" />{channel.name}</span> :
									<span className="flex items-center gap-1"><Users className="h-4 w-4" />{getOtherMemberName(channel)}</span> // 'direct'		
								}</h2>
                <FileList
                  channelId={channel.id}
                  currentUserRole={channel.members?.find(member => member.profile_id === currentUser?.id)?.role}
                  shouldRefresh={shouldRefresh}
                  onRefresh={() => setShouldRefresh(!shouldRefresh)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 