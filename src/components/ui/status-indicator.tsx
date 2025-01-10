import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDistanceToNow } from 'date-fns'

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen?: string
  showTooltip?: boolean
}

export function StatusIndicator({ 
  status, 
  lastSeen, 
  showTooltip = true,
  className,
  ...props 
}: StatusIndicatorProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  }

  const statusMessages = {
    online: 'Online',
    offline: lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen))} ago` : 'Offline',
    away: 'Away',
    busy: 'Do not disturb'
  }

  const indicator = (
    <div
      className={cn(
        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
        statusColors[status],
        className
      )}
      {...props}
    />
  )

  if (!showTooltip) return indicator

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusMessages[status]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 