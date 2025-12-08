import Link from 'next/link';
import Navigation from './components/Navigation';
import { getAllPosts } from '@/lib/posts';

export default function NotFound() {
  const posts = getAllPosts();
  const randomPosts = posts
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-6xl md:text-8xl font-light text-white mb-6">
              404
            </h1>
            <p className="text-xl text-gray-400 mb-4">
              This page doesn&apos;t exist.
            </p>
            <p className="text-gray-500 mb-12">
              Maybe it moved, maybe it never was. Either way, you&apos;re here now.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <Link
                href="/"
                className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors"
              >
                Go home
              </Link>
              <Link
                href="/tags"
                className="px-6 py-3 border border-zinc-700 text-gray-300 hover:text-white hover:border-zinc-500 transition-colors"
              >
                Browse topics
              </Link>
            </div>

            <div className="border-t border-zinc-800 pt-12">
              <h2 className="text-gray-400 uppercase tracking-wide text-sm mb-8">
                Or start with one of these
              </h2>
              <div className="grid gap-4 text-left">
                {randomPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className="group p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.metadata.categories.map((category) => (
                        <span
                          key={category}
                          className="text-xs uppercase tracking-wide text-gray-500"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-serif text-xl text-white group-hover:text-gray-300 transition-colors mb-2">
                      {post.metadata.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {post.metadata.excerpt}
                    </p>
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
