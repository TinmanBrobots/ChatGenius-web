import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { cn } from "@/lib/utils"
import { useProfiles } from "@/hooks/useProfiles"

interface AvatarWithStatusProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  profileId: string
  className?: string
}

export function AvatarWithStatus({ 
  profileId,
  className,
  ...props 
}: AvatarWithStatusProps) {
  const { useGetProfile } = useProfiles();
  const profile = useGetProfile(profileId);
  return (
    <div className="relative inline-block">
      <Avatar className={cn(className)} {...props}>
        <AvatarImage src={profile?.data?.avatar_url || undefined} />
        <AvatarFallback>{profile?.data?.username?.charAt(0).toUpperCase() || ''}</AvatarFallback>
      </Avatar>
      <StatusIndicator 
        status={profile?.data?.status || 'offline'} 
        lastSeen={profile?.data?.last_seen_at || undefined}
      />
    </div>
  )
} 