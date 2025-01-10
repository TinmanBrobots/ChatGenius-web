import { Metadata } from 'next';
import ProtectedLayout from '@/components/layouts/ProtectedLayout';
import { ChatArea } from '@/components/ChatArea';
import { Sidebar } from '@/components/Sidebar';

type Props = {
  params: { channelId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ChatChannelPage({ params }: Props) {
  return (
    <ProtectedLayout>
      <div className="flex h-screen">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1">
          <ChatArea channelId={params.channelId} />
        </main>
      </div>
    </ProtectedLayout>
  );
} 