import Navigation from '../components/Navigation';
import WhereImStuck from '../components/WhereImStuck';
import { AIErrorBoundary } from '../components/ErrorBoundary';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Where I\'m Stuck | Integrated Human',
  description: 'Describe what you\'re struggling with and get matched to the right resources for your situation.',
};

export default function StuckPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
                Where Are You Stuck?
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Sometimes the hardest part is knowing where to start.
                Describe what you're struggling with, and we'll match you to the right resources.
              </p>
            </div>

            {/* Main Component */}
            <AIErrorBoundary>
              <WhereImStuck />
            </AIErrorBoundary>

            {/* How it works */}
            <div className="mt-16 pt-12 border-t border-zinc-800">
              <h2 className="font-serif text-2xl text-white mb-8 text-center">
                How This Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium">
                    1
                  </div>
                  <h3 className="text-white font-medium mb-2">Describe Your Struggle</h3>
                  <p className="text-gray-500 text-sm">
                    Tell us what pattern, challenge, or block you're experiencing
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium">
                    2
                  </div>
                  <h3 className="text-white font-medium mb-2">Get Matched</h3>
                  <p className="text-gray-500 text-sm">
                    Our AI finds relevant articles, courses, and practices from our library
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium">
                    3
                  </div>
                  <h3 className="text-white font-medium mb-2">Start Working</h3>
                  <p className="text-gray-500 text-sm">
                    Dive into the recommended content that speaks to your situation
                  </p>
                </div>
              </div>
            </div>

            {/* Alternative paths */}
            <div className="mt-12 p-6 bg-zinc-900 border border-zinc-800">
              <h3 className="text-white font-medium mb-4">Not sure what to type?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Here are some other ways to find what you need:
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/start-here"
                  className="text-sm text-gray-400 hover:text-white transition-colors underline"
                >
                  Take the guided quiz
                </Link>
                <span className="text-gray-700">·</span>
                <Link
                  href="/archetypes"
                  className="text-sm text-gray-400 hover:text-white transition-colors underline"
                >
                  Discover your archetypes
                </Link>
                <span className="text-gray-700">·</span>
                <Link
                  href="/learning-paths"
                  className="text-sm text-gray-400 hover:text-white transition-colors underline"
                >
                  Browse learning paths
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
