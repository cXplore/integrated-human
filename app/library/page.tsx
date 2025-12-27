import { Suspense } from 'react';
import Navigation from '../components/Navigation';
import LibraryContent from '../components/LibraryContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library | Integrated Human',
  description: 'All articles on psychology, embodiment, relationships, and meaning. Browse the complete collection of essays for the integration journey.',
  openGraph: {
    title: 'Library | Integrated Human',
    description: 'All articles on psychology, embodiment, relationships, and meaning.',
  },
};

function LibraryLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filter skeleton */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 p-4 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-24 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-zinc-800 rounded" />
            ))}
          </div>
        </div>
      </aside>

      {/* Content skeleton */}
      <div className="flex-1">
        <div className="h-12 bg-zinc-900 rounded-lg mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-1/4 mb-3" />
              <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-16 px-6 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
              Library
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              Long-form essays on psychology, embodiment, relationships, and meaning.
              Filter by pillar, dimension, or use search to find what you need.
            </p>
          </div>
        </section>

        {/* Library Content */}
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<LibraryLoading />}>
              <LibraryContent />
            </Suspense>
          </div>
        </section>
      </main>
    </>
  );
}
