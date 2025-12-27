'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useReadingList } from './ReadingListContext';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  date: string;
  type: string;
  series?: string;
  image?: string;
  readingTime: number;
}

interface LibraryGridProps {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function getReadingBadge(minutes: number): { label: string; className: string } {
  if (minutes <= 5) {
    return { label: 'Quick read', className: 'bg-emerald-900/50 text-emerald-400 border-emerald-800' };
  } else if (minutes <= 10) {
    return { label: 'Medium', className: 'bg-amber-900/50 text-amber-400 border-amber-800' };
  } else {
    return { label: 'Deep dive', className: 'bg-purple-900/50 text-purple-400 border-purple-800' };
  }
}

function PostCardCompact({ post }: { post: Post }) {
  const badge = getReadingBadge(post.readingTime);
  const { isRead } = useReadingList();
  const hasRead = isRead(post.slug);

  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="group bg-zinc-900 p-6 border border-zinc-800 hover:border-zinc-600 transition-all rounded-lg relative h-full flex flex-col">
        {hasRead && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-emerald-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Type Badge */}
        {post.type === 'guide' && (
          <span className="absolute top-3 left-3 text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 border border-blue-800 rounded">
            Guide
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3 mt-2">
          {post.categories.slice(0, 2).map((category) => (
            <span
              key={category}
              className="text-xs uppercase tracking-wide text-gray-500"
            >
              {category}
            </span>
          ))}
        </div>

        <h2 className="font-serif text-xl font-light text-white mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
          {post.title}
        </h2>

        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-zinc-800">
          <span className={`px-2 py-0.5 rounded border ${badge.className}`}>
            {post.readingTime} min
          </span>
          <span>
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function LibraryGrid({ posts, loading, hasMore, onLoadMore }: LibraryGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-xl text-white mb-2">No articles found</h3>
        <p className="text-gray-400">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCardCompact key={post.slug} post={post} />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading more...
          </div>
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* End of results */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          You've reached the end ({posts.length} articles)
        </div>
      )}
    </div>
  );
}
