import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import { AIErrorBoundary } from '@/app/components/ErrorBoundary';
import type { Metadata } from 'next';
import JournalView from './JournalView';

export const metadata: Metadata = {
  title: 'Journal | Integrated Human',
  description: 'Your personal journal for reflection, insights, and integration work.',
};

export default async function JournalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <div className="bg-gradient-to-b from-zinc-900 to-[var(--background)] pt-24 pb-8 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <a
                href="/profile"
                className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
              >
                Profile
              </a>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400 text-sm">Journal</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-white">
              Your Journal
            </h1>
            <p className="text-gray-400 mt-2">
              A space for reflection, insights, and tracking your integration journey
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <AIErrorBoundary>
              <JournalView />
            </AIErrorBoundary>
          </div>
        </div>
      </main>
    </>
  );
}
