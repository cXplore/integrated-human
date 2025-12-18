'use client';

import { useReadingList } from '../components/ReadingListContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface PostInfo {
  slug: string;
  title: string;
  excerpt: string;
  categories: string[];
  readingTime: number;
}

export default function ReadingListContent() {
  const { savedSlugs, readSlugs, removeFromList, markAsRead, unmarkAsRead } = useReadingList();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (savedSlugs.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/posts?slugs=${savedSlugs.join(',')}`);
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setPosts([]);
      }
      setIsLoading(false);
    }

    fetchPosts();
  }, [savedSlugs]);

  if (isLoading) {
    return (
      <div className="text-gray-400 py-12 text-center">
        Loading your reading list...
      </div>
    );
  }

  if (savedSlugs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-6">
          Your reading list is empty. Save articles to read later by clicking the bookmark icon.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Browse articles
        </Link>
      </div>
    );
  }

  const completedCount = posts.filter(p => readSlugs.includes(p.slug)).length;
  const unreadPosts = posts.filter(p => !readSlugs.includes(p.slug));
  const completedPosts = posts.filter(p => readSlugs.includes(p.slug));

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      {posts.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-white font-medium">
                {completedCount} of {posts.length} completed
              </span>
              <span className="text-gray-500">
                ({Math.round((completedCount / posts.length) * 100)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${(completedCount / posts.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Unread articles */}
      {unreadPosts.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            To Read ({unreadPosts.length})
          </h2>
          <div className="space-y-3">
            {unreadPosts.map((post) => (
              <div
                key={post.slug}
                className="flex items-start gap-4 p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <button
                  onClick={() => markAsRead(post.slug)}
                  className="mt-1 w-5 h-5 border border-zinc-600 rounded hover:border-green-500 transition-colors flex-shrink-0"
                  aria-label="Mark as completed"
                  title="Mark as completed"
                />
                <Link
                  href={`/posts/${post.slug}`}
                  className="group flex-1 min-w-0"
                >
                  <div className="flex flex-wrap gap-2 mb-1">
                    {post.categories.map((category) => (
                      <span
                        key={category}
                        className="text-xs uppercase tracking-wide text-gray-500"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors mb-1">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-1">
                    {post.excerpt}
                  </p>
                </Link>
                <div className="text-gray-600 text-sm flex-shrink-0">
                  {post.readingTime} min
                </div>
                <button
                  onClick={() => removeFromList(post.slug)}
                  className="p-1 text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                  aria-label="Remove from reading list"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed articles */}
      {completedPosts.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Completed ({completedPosts.length})
          </h2>
          <div className="space-y-3">
            {completedPosts.map((post) => (
              <div
                key={post.slug}
                className="flex items-start gap-4 p-5 bg-zinc-900/50 border border-zinc-800/50 transition-colors"
              >
                <button
                  onClick={() => unmarkAsRead(post.slug)}
                  className="mt-1 w-5 h-5 bg-green-600 border border-green-600 rounded flex items-center justify-center flex-shrink-0 hover:bg-green-700 transition-colors"
                  aria-label="Mark as unread"
                  title="Mark as unread"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <Link
                  href={`/posts/${post.slug}`}
                  className="group flex-1 min-w-0"
                >
                  <div className="flex flex-wrap gap-2 mb-1">
                    {post.categories.map((category) => (
                      <span
                        key={category}
                        className="text-xs uppercase tracking-wide text-gray-600"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-serif text-lg text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-1">
                    {post.excerpt}
                  </p>
                </Link>
                <div className="text-gray-700 text-sm flex-shrink-0">
                  {post.readingTime} min
                </div>
                <button
                  onClick={() => removeFromList(post.slug)}
                  className="p-1 text-gray-700 hover:text-gray-500 transition-colors flex-shrink-0"
                  aria-label="Remove from reading list"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync status notice */}
      <div className="mt-8 pt-8 border-t border-zinc-800">
        <div className="flex items-start gap-3 text-sm text-gray-500">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {session ? (
            <p>
              Your reading list syncs across all your devices when you&apos;re signed in.
            </p>
          ) : (
            <p>
              Your reading list is stored locally in your browser. <Link href="/login" className="underline hover:text-white transition-colors">Sign in</Link> to sync across devices.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
