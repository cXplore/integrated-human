import type { Metadata } from 'next';
import Navigation from '../components/Navigation';
import LearningPathsLibrary from './LearningPathsLibrary';

export const metadata: Metadata = {
  title: 'Learning Paths - Integrated Human',
  description: 'Structured article series for deeper learning. Physical foundation, inner work, soul work, and relationship foundations.',
};

export default function LearningPathsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
                Learning Paths
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl">
                Structured series designed to be read in order. Each path builds
                foundational understanding before moving to advanced topics.
              </p>
            </div>

            <LearningPathsLibrary />
          </div>
        </section>
      </main>
    </>
  );
}

