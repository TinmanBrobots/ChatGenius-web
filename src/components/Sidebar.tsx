"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChannelList } from "@/components/ChannelList"
import { DirectMessageList } from "@/components/DirectMessageList"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/hooks/useAuth'
import { ChannelCreationForm } from "@/components/ChannelCreationForm"
import { SearchDialog } from "@/components/SearchDialog"
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
import { Settings, LogOut, Plus, FileIcon, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const { logout, currentUser } = useAuth()
  const router = useRouter()

  const handleSettingsClick = () => {
    router.push('/settings')
  }

  console.log(currentUser)
  
  return (
    <div className="w-64 border-r bg-muted/50 flex flex-col h-screen">
      <div className="p-4 flex items-center justify-between">
        <span className="font-semibold text-lg">ChatGenius</span>
        <SearchDialog />
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
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
                profileId={currentUser?.id || ''}
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
            <DropdownMenuItem onClick={() => router.push('/files')}>
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Files</span>
            </DropdownMenuItem>
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

