import Navigation from '../components/Navigation';
import CategoryFilter from '../components/CategoryFilter';
import Link from 'next/link';
import { getArticlesByCategory, getPostsBySeries, getTagsByCategory } from '@/lib/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Relationships | Integrated Human',
  description: 'Attachment, intimacy, polarity, and conflict. Understanding how you connect with others and why it sometimes goes wrong.',
  openGraph: {
    title: 'Relationships | Integrated Human',
    description: 'Attachment, intimacy, polarity, and conflict. Understanding connection.',
  },
};

export default function RelationshipsPage() {
  const relationshipFoundations = getPostsBySeries('relationship-foundations');
  const articles = getArticlesByCategory('Relationships');
  const availableTags = getTagsByCategory('Relationships');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Relationships
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-16">
              The arena where mind, body and soul all show themselves at once.
              Attraction, attachment, intimacy, conflict, separation and staying.
              How we love without losing ourselves.
            </p>

            {/* Learning Path */}
            {relationshipFoundations.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-2xl font-light text-white">
                    Relationship Foundations
                  </h2>
                  <span className="text-xs uppercase tracking-wide text-gray-500 bg-zinc-800 px-2 py-1 rounded">
                    Learning Path
                  </span>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Understanding how you attach, what you need, and why love sometimes hurts. Start here.
                </p>
                <div className="border border-zinc-800 divide-y divide-zinc-800">
                  {relationshipFoundations.map((post, index) => (
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

            {articles.length === 0 && relationshipFoundations.length > 0 && (
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
