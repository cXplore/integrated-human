import type { Metadata } from 'next';
import Navigation from '../components/Navigation';
import Link from 'next/link';
import { getPostsBySeries } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Learning Paths - Integrated Human',
  description: 'Structured article series for deeper learning. Physical foundation, inner work, soul work, and relationship foundations.',
};

const seriesInfo = [
  {
    id: 'physical-foundation',
    title: 'Physical Foundation',
    description: 'The body is where everything else lives. These guides build on each other—from philosophy to strength to movement to breath to recovery.',
    category: 'Body',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 'inner-work',
    title: 'Inner Work Foundations',
    description: 'Understanding your patterns, your shadow, and how to actually change. The psychological groundwork for transformation.',
    category: 'Mind',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'soul-foundations',
    title: 'Soul Foundations',
    description: 'Practices and perspectives for going deeper. Meditation, consciousness, meaning, and the tools for inner exploration.',
    category: 'Soul',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 'relationship-foundations',
    title: 'Relationship Foundations',
    description: 'Understanding how you attach, what you need, and why love sometimes hurts. The relational patterns that shape your life.',
    category: 'Relationships',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'from-seeking-to-being',
    title: 'From Seeking to Being',
    description: 'For those transitioning out of the endless search. Integration, establishment, and building a life you actually want to live.',
    category: 'Soul',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 'body-work',
    title: 'Body Work',
    description: 'Practical somatic practices for nervous system regulation, anxiety relief, and embodiment. Tools you can use today.',
    category: 'Body',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 'integration-work',
    title: 'Integration Work',
    description: 'Making transformation stick. Practical guides for integrating insights from psychedelics, therapy, and peak experiences into lasting change.',
    category: 'Soul',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'attachment',
    title: 'Attachment Deep Dive',
    description: 'Understanding attachment styles beyond the basics. How patterns form, how they show up, and how to heal toward earned security.',
    category: 'Relationships',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export default function LearningPathsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Learning Paths
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-16">
              Structured series designed to be read in order. Each path builds
              foundational understanding before moving to advanced topics.
            </p>

            <div className="space-y-12">
              {seriesInfo.map((series) => {
                const posts = getPostsBySeries(series.id);
                const totalReadingTime = posts.reduce((acc, post) => acc + post.readingTime, 0);

                return (
                  <div
                    key={series.id}
                    className="bg-zinc-900 border border-zinc-800 p-8"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center text-gray-400 flex-shrink-0">
                        {series.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="font-serif text-2xl font-light text-white">
                            {series.title}
                          </h2>
                          <Link
                            href={`/${series.category.toLowerCase()}`}
                            className="text-xs uppercase tracking-wide text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            {series.category}
                          </Link>
                        </div>
                        <p className="text-gray-400 leading-relaxed">
                          {series.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>{posts.length} articles</span>
                          <span>·</span>
                          <span>{totalReadingTime} min total</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-6">
                      <div className="space-y-1">
                        {posts.map((post, index) => (
                          <Link
                            key={post.slug}
                            href={`/posts/${post.slug}`}
                            className="flex items-start gap-4 p-4 -mx-4 hover:bg-zinc-800 transition-colors rounded"
                          >
                            <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center flex-shrink-0 text-gray-400 font-medium text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-medium mb-1">
                                {post.metadata.title}
                              </h3>
                              <p className="text-gray-500 text-sm line-clamp-1">
                                {post.metadata.excerpt}
                              </p>
                            </div>
                            <div className="text-gray-600 text-sm flex-shrink-0">
                              {post.readingTime} min
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        <Link
                          href={`/posts/${posts[0]?.slug}`}
                          className="inline-flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
                        >
                          Start this path
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
