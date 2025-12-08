'use client';

import { useReadingList } from '../components/ReadingListContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PostInfo {
  slug: string;
  title: string;
  excerpt: string;
  categories: string[];
  readingTime: number;
}

export default function ReadingListContent() {
  const { savedSlugs, removeFromList } = useReadingList();
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

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.slug}
          className="flex items-start gap-4 p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <Link
            href={`/posts/${post.slug}`}
            className="group flex-1"
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {post.categories.map((category) => (
                <span
                  key={category}
                  className="text-xs uppercase tracking-wide text-gray-500"
                >
                  {category}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-xl text-white group-hover:text-gray-300 transition-colors mb-2">
              {post.title}
            </h2>
            <p className="text-gray-400 text-sm line-clamp-2">
              {post.excerpt}
            </p>
            <div className="text-gray-600 text-sm mt-2">
              {post.readingTime} min read
            </div>
          </Link>
          <button
            onClick={() => removeFromList(post.slug)}
            className="p-2 text-gray-500 hover:text-white transition-colors flex-shrink-0"
            aria-label="Remove from reading list"
            title="Remove from reading list"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}

      {/* Local storage notice */}
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
          <p>
            Your reading list is stored locally in your browser. It won&apos;t sync across devices or persist if you clear your browser data.
          </p>
        </div>
      </div>
    </div>
  );
}
