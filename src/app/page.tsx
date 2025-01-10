"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from "@/components/Sidebar"
import { ChatArea } from "@/components/ChatArea"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const user = useAuth().currentUser
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-xl font-semibold"># general</h1>
            <p className="text-sm text-muted-foreground">123 members</p>
          </div>
          <ModeToggle />
        </header>
        <ChatArea channelId="1" />
      </main>
    </div>
  )
}

