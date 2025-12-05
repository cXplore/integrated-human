import Navigation from '../components/Navigation';
import PostCard from '../components/PostCard';
import { getPostsByCategory } from '@/lib/posts';

export default function SoulPage() {
  const posts = getPostsByCategory('Soul');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Soul
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              Your depth: wisdom, meditation, psychedelics, philosophy, silence, meaning.
              Everything in you that knows there's more to life than performance.
            </p>

            <div className="space-y-8">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
