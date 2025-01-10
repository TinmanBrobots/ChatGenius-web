"use client"

import ProtectedLayout from '@/components/layouts/ProtectedLayout';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channel');

  return (
    <ProtectedLayout>
      <div className="flex h-screen">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1">
          {channelId ? (
            <ChatArea channelId={channelId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Welcome to ChatGenius!</h2>
                <p>Select a channel from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedLayout>
  );
} 