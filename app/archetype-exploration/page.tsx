import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Navigation from '../components/Navigation';
import { AIErrorBoundary } from '../components/ErrorBoundary';
import ArchetypeChat from './ArchetypeChat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Archetype Exploration | Integrated Human',
  description: 'A guided conversation to discover your archetypal patterns, shadows, and paths to integration.',
};

export default async function ArchetypeExplorationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/archetype-exploration');
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-3xl mx-auto px-6 pt-24 pb-12">
          <AIErrorBoundary>
            <ArchetypeChat userId={session.user.id!} userName={session.user.name || undefined} />
          </AIErrorBoundary>
        </div>
      </main>
    </>
  );
}
