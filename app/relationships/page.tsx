import Navigation from '../components/Navigation';
import PostCard from '../components/PostCard';
import { getPostsByCategory } from '@/lib/posts';

export default function RelationshipsPage() {
  const posts = getPostsByCategory('Relationships');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Relationships
            </h1>

            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              The arena where mind, body and soul all show themselves at once.
              Attraction, attachment, intimacy, conflict, separation and staying.
              How we love without losing ourselves.
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
