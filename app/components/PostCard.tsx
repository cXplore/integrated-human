import Link from 'next/link';
import { Post } from '@/lib/posts';

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="bg-white p-8 border border-stone-200 hover:border-stone-400 transition-colors">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.metadata.categories.map((category) => (
            <span
              key={category}
              className="text-xs uppercase tracking-wide text-stone-500"
            >
              {category}
            </span>
          ))}
        </div>
        <h2 className="font-serif text-2xl font-light text-stone-900 mb-3 hover:text-stone-600 transition-colors">
          {post.metadata.title}
        </h2>
        <p className="text-stone-700 leading-relaxed mb-4">
          {post.metadata.excerpt}
        </p>
        <div className="text-stone-500 text-sm">
          {new Date(post.metadata.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </article>
    </Link>
  );
}
