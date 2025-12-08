import Link from 'next/link';
import Navigation from '../components/Navigation';
import { getAllTags } from '@/lib/posts';

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Topics
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              Explore articles by topic. The bigger the tag, the more content available.
            </p>

            <div className="flex flex-wrap gap-3">
              {tags.map(({ tag, count }) => {
                const size = count >= 5 ? 'text-2xl' : count >= 3 ? 'text-xl' : count >= 2 ? 'text-lg' : 'text-base';
                return (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className={`${size} px-4 py-2 bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white hover:border-zinc-600 transition-colors`}
                  >
                    {tag}
                    <span className="ml-2 text-gray-600 text-sm">({count})</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
