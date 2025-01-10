import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { cn } from "@/lib/utils"

interface AvatarWithStatusProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen?: string
  src?: string
  fallback: string
  showStatus?: boolean
}

export function AvatarWithStatus({ 
  status,
  lastSeen,
  src,
  fallback,
  showStatus = true,
  className,
  ...props 
}: AvatarWithStatusProps) {
  return (
    <div className="relative inline-block">
      <Avatar className={cn(className)} {...props}>
        <AvatarImage src={src} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {showStatus && (
        <StatusIndicator 
          status={status} 
          lastSeen={lastSeen}
        />
      )}
    </div>
  )
} 