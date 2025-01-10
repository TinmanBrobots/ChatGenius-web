"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChannelList } from "@/components/ChannelList"
import { DirectMessageList } from "@/components/DirectMessageList"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/hooks/useAuth'
import { ChannelCreationForm } from "@/components/ChannelCreationForm"
import { useState } from 'react'
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const { logout, currentUser } = useAuth()
  const [showChannelForm, setShowChannelForm] = useState(false)
  const router = useRouter()

  const handleSettingsClick = () => {
    router.push('/settings')
  }

  console.log(currentUser)
  
  return (
    <div className="w-64 border-r bg-muted/50 flex flex-col h-screen">
      <div className="p-4 font-semibold">
        <span>ChatGenius</span>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Channels</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowChannelForm(true)}>+</Button>
          </div>
          {showChannelForm && (
            <ChannelCreationForm 
              onClose={() => setShowChannelForm(false)} 
            />
          )}
          <ChannelList />
          <Separator className="my-4" />
          <DirectMessageList />
        </div>
      </ScrollArea>
      
      {/* User Profile Section */}
      <div className="p-4 border-t bg-muted/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-start gap-2 px-2 hover:bg-accent"
            >
              <AvatarWithStatus
                className="h-8 w-8"
                src={currentUser?.avatar_url || undefined}
                fallback={currentUser?.full_name?.charAt(0).toUpperCase() || ''}
                status={currentUser?.status || 'offline'}
                lastSeen={currentUser?.last_seen_at}
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium leading-none">{currentUser?.full_name}</p>
                {currentUser?.username && (
                  <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

