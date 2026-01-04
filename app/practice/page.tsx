import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PracticeContent from './PracticeContent';

export const metadata: Metadata = {
  title: 'Practice | Integrated Human',
  description: 'Practice your skills through scenarios and simulated conversations. Get real-time AI feedback.',
};

export default async function PracticePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin?callbackUrl=/practice');
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-3">
            Practice Lab
          </h1>
          <p className="text-zinc-400 text-lg">
            Practice difficult conversations and skill demonstrations in a safe space.
            Get detailed AI feedback on your responses.
          </p>
        </div>

        <PracticeContent />
      </div>
    </main>
  );
}
