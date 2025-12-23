import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ChatInterface from './ChatInterface';

export const metadata: Metadata = {
  title: 'AI Companion | Integrated Human',
  description: 'Have a meaningful conversation with your AI companion about personal growth, integration, and wellbeing.',
};

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin?callbackUrl=/chat');
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <ChatInterface userName={session.user.name || undefined} />
    </div>
  );
}
