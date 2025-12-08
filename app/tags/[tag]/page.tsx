import Link from 'next/link';
import Navigation from '../../components/Navigation';
import ReadingTimeFilter from '../../components/ReadingTimeFilter';
import { getAllTags, getPostsByTag } from '@/lib/posts';

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(({ tag }) => ({
    tag: tag,
  }));
}

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);
  const allTags = getAllTags();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <Link
                href="/tags"
                className="text-gray-500 hover:text-white transition-colors mb-4 inline-block"
              >
                &larr; All topics
              </Link>
              <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-4">
                {decodedTag}
              </h1>
              <p className="text-xl text-gray-400">
                {posts.length} article{posts.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="mb-16">
              <ReadingTimeFilter posts={posts} />
            </div>

            <div className="border-t border-zinc-800 pt-12">
              <h2 className="text-gray-400 uppercase tracking-wide text-sm mb-6">
                Other topics
              </h2>
              <div className="flex flex-wrap gap-2">
                {allTags
                  .filter(({ tag: t }) => t !== decodedTag)
                  .slice(0, 15)
                  .map(({ tag: t, count }) => (
                    <Link
                      key={t}
                      href={`/tags/${t}`}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                    >
                      {t} ({count})
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
