import Navigation from '../components/Navigation';
import CategoryFilter from '../components/CategoryFilter';
import Link from 'next/link';
import { getArticlesByCategory, getPostsBySeries, getTagsByCategory } from '@/lib/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mind | Integrated Human',
  description: 'Psychology, patterns, shadow work, and attachment. Understanding your inner landscape and learning how to transform it.',
  openGraph: {
    title: 'Mind | Integrated Human',
    description: 'Psychology, patterns, shadow work, and attachment. Understanding your inner landscape.',
  },
};

export default function MindPage() {
  const innerWork = getPostsBySeries('inner-work');
  const articles = getArticlesByCategory('Mind');
  const availableTags = getTagsByCategory('Mind');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Mind
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              Your inner landscape: psychology, patterns, shadow work, attachment.
              Understanding why you do what you do — and how to change it.
            </p>

            {/* Archetype Quiz CTA */}
            <Link
              href="/archetypes"
              className="block mb-16 p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                    Archetype Assessment
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Discover which archetypal energies are most active in your psyche. 12 questions, ~3 minutes.
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            {/* Learning Path */}
            {innerWork.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-2xl font-light text-white">
                    Inner Work Foundations
                  </h2>
                  <span className="text-xs uppercase tracking-wide text-gray-500 bg-zinc-800 px-2 py-1 rounded">
                    Learning Path
                  </span>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Understanding your patterns, your shadow, and how to actually change. Start here.
                </p>
                <div className="border border-zinc-800 divide-y divide-zinc-800">
                  {innerWork.map((post, index) => (
                    <Link
                      key={post.slug}
                      href={`/posts/${post.slug}`}
                      className="flex items-start gap-4 p-5 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0 text-gray-400 font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-1">
                          {post.metadata.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {post.metadata.excerpt}
                        </p>
                      </div>
                      <div className="text-gray-600 text-sm flex-shrink-0">
                        {post.readingTime} min
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Articles with Tag Filter */}
            <CategoryFilter posts={articles} availableTags={availableTags} />

            {articles.length === 0 && innerWork.length > 0 && (
              <p className="text-gray-500 text-center py-8">
                More articles coming soon.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
