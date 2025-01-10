import { Button } from "@/components/ui/button"
import { Users, FileBox } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChannelMembers } from "@/components/ChannelMembers"
import { FileList } from "@/components/ui/file-list"
import { Channel, Profile } from "@/types"

interface ChatHeaderProps {
  channel: Channel;
  otherUser?: Profile | null;
  currentUserRole?: string;
}

export function ChatHeader({ channel, otherUser, currentUserRole }: ChatHeaderProps) {
  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {channel.type === 'direct' ? otherUser?.full_name : `#${channel.name}`}
          </h2>
          {channel.description ? (
            <p className="text-sm text-muted-foreground">{channel.description}</p>
          ) : (
            channel.type === 'direct' ? (
              <p className="text-sm text-muted-foreground">@{otherUser?.username}</p>
            ) : null
          )}
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <FileBox className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Channel Files</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FileList channelId={channel.id} currentUserRole={currentUserRole} />
              </div>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Users className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Channel Members</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ChannelMembers channelId={channel.id} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
} 