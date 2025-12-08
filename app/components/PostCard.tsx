'use client';

import Link from 'next/link';
import { Post } from '@/lib/posts';
import { useReadingList } from './ReadingListContext';

function getReadingBadge(minutes: number): { label: string; className: string } {
  if (minutes <= 5) {
    return { label: 'Quick read', className: 'bg-emerald-900/50 text-emerald-400 border-emerald-800' };
  } else if (minutes <= 10) {
    return { label: 'Medium', className: 'bg-amber-900/50 text-amber-400 border-amber-800' };
  } else {
    return { label: 'Deep dive', className: 'bg-purple-900/50 text-purple-400 border-purple-800' };
  }
}

export default function PostCard({ post }: { post: Post }) {
  const badge = getReadingBadge(post.readingTime);
  const { isRead } = useReadingList();
  const hasRead = isRead(post.slug);

  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="bg-zinc-900 p-8 border border-zinc-800 hover:border-zinc-600 transition-colors relative">
        {hasRead && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Read
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {post.metadata.categories.map((category) => (
            <span
              key={category}
              className="text-xs uppercase tracking-wide text-gray-500"
            >
              {category}
            </span>
          ))}
          <span className={`text-xs px-2 py-0.5 rounded border ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <h2 className="font-serif text-2xl font-light text-white mb-3 hover:text-gray-300 transition-colors">
          {post.metadata.title}
        </h2>
        <p className="text-gray-400 leading-relaxed mb-4">
          {post.metadata.excerpt}
        </p>
        <div className="text-gray-500 text-sm flex items-center gap-3">
          <span>
            {new Date(post.metadata.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span>·</span>
          <span>{post.readingTime} min read</span>
        </div>
      </article>
    </Link>
  );
}
