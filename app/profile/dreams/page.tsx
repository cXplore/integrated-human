import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import { AIErrorBoundary } from '@/app/components/ErrorBoundary';
import DreamJournal from './DreamJournal';

export const metadata: Metadata = {
  title: 'Dream Journal | Integrated Human',
  description: 'Record and explore the meaning of your dreams with AI-assisted interpretation.',
};

export default async function DreamsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-12">
              <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
                <a href="/profile" className="hover:text-gray-300 transition-colors">
                  Profile
                </a>
                <span>/</span>
                <span className="text-gray-400">Dream Journal</span>
              </div>

              <h1 className="font-serif text-4xl font-light text-white mb-4">
                Dream Journal
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Record your dreams upon waking and explore their deeper meaning.
                The unconscious speaks in symbols—let's learn its language together.
              </p>
            </header>

            <AIErrorBoundary>
              <DreamJournal />
            </AIErrorBoundary>
          </div>
        </div>
      </main>
    </>
  );
}
