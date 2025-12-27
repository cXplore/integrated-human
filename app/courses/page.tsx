import { Suspense } from 'react';
import Navigation from '../components/Navigation';
import CoursesContent from '../components/CoursesContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses | Integrated Human',
  description: 'Deep-dive courses on shadow work, nervous system regulation, attachment repair, and integration. Transform understanding into lasting change.',
};

function CoursesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse mb-3" />
        <div className="h-5 w-96 bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="h-12 bg-zinc-800 rounded-lg animate-pulse mb-6" />

      {/* Content skeleton */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="h-96 bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <Suspense fallback={<CoursesLoading />}>
          <CoursesContent />
        </Suspense>
      </main>
    </>
  );
}
