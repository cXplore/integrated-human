import Navigation from '../components/Navigation';
import PostCard from '../components/PostCard';
import { getPostsByCategory } from '@/lib/posts';

export default function MindPage() {
  const posts = getPostsByCategory('Mind');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-stone-50">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-stone-900 mb-6">
              Mind
            </h1>
            <p className="text-xl text-stone-700 leading-relaxed mb-12">
              Your inner structure: psychology, patterns, attachment styles, masculine & feminine dynamics,
              trauma, communication. How you think, feel and relate — to yourself and others.
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
