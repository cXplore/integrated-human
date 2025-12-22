import Navigation from '../components/Navigation';
import CategoryFilter from '../components/CategoryFilter';
import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library | Integrated Human',
  description: 'All articles on psychology, embodiment, relationships, and meaning. Browse the complete collection of essays for the integration journey.',
  openGraph: {
    title: 'Library | Integrated Human',
    description: 'All articles on psychology, embodiment, relationships, and meaning.',
  },
};

export default function LibraryPage() {
  const allPosts = getAllPosts();
  const availableTags = getAllTags().map(t => t.tag);

  // Group posts by category for stats
  const categories = ['Mind', 'Body', 'Soul', 'Relationships'];
  const countByCategory = categories.reduce((acc, cat) => {
    acc[cat] = allPosts.filter(p => p.metadata.categories.includes(cat)).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Library
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              {allPosts.length} essays on psychology, embodiment, relationships, and meaning.
              Long-form pieces that go beyond tips and hacks.
            </p>

            {/* Category Quick Links */}
            <div className="flex flex-wrap gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/${cat.toLowerCase()}`}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors text-gray-400 hover:text-white text-sm"
                >
                  {cat} <span className="text-gray-600 ml-1">({countByCategory[cat]})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All Articles with Filter */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <CategoryFilter posts={allPosts} availableTags={availableTags} />
          </div>
        </section>
      </main>
    </>
  );
}
