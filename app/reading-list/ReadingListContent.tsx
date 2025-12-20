'use client';

import { useReadingList } from '../components/ReadingListContext';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';

interface PostInfo {
  slug: string;
  title: string;
  excerpt: string;
  categories: string[];
  readingTime: number;
}

type SortOption = 'recent' | 'category' | 'reading-time';
type FilterOption = 'all' | string;

export default function ReadingListContent() {
  const { savedSlugs, readSlugs, removeFromList, markAsRead, unmarkAsRead } = useReadingList();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterCategory, setFilterCategory] = useState<FilterOption>('all');
  const [showCompleted, setShowCompleted] = useState(true);

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

  // Get all unique categories from saved posts
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    posts.forEach(post => {
      post.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [posts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(post => post.categories.includes(filterCategory));
    }

    // Sort
    switch (sortBy) {
      case 'category':
        result.sort((a, b) => a.categories[0].localeCompare(b.categories[0]));
        break;
      case 'reading-time':
        result.sort((a, b) => a.readingTime - b.readingTime);
        break;
      case 'recent':
      default:
        // Keep original order (most recently added first from API)
        break;
    }

    return result;
  }, [posts, filterCategory, sortBy]);

  const unreadPosts = filteredPosts.filter(p => !readSlugs.includes(p.slug));
  const completedPosts = filteredPosts.filter(p => readSlugs.includes(p.slug));

  // Stats
  const totalReadingTime = posts.reduce((acc, p) => acc + p.readingTime, 0);
  const completedCount = posts.filter(p => readSlugs.includes(p.slug)).length;
  const completedReadingTime = posts
    .filter(p => readSlugs.includes(p.slug))
    .reduce((acc, p) => acc + p.readingTime, 0);

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
        <div className="w-16 h-16 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <p className="text-gray-400 mb-6">
          Your reading list is empty. Save articles to read later by clicking the bookmark icon.
        </p>
        <Link
          href="/library"
          className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Browse articles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-2xl font-light text-white">{posts.length}</div>
          <div className="text-sm text-gray-500">Saved</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-2xl font-light text-green-500">{completedCount}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-2xl font-light text-white">{totalReadingTime} min</div>
          <div className="text-sm text-gray-500">Total Time</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-2xl font-light text-white">{completedReadingTime} min</div>
          <div className="text-sm text-gray-500">Time Read</div>
        </div>
      </div>

      {/* Progress bar */}
      {posts.length > 0 && (
        <div className="p-4 bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white font-medium">
              {completedCount} of {posts.length} completed
            </span>
            <span className="text-gray-500">
              ({Math.round((completedCount / posts.length) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${(completedCount / posts.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-gray-300 text-sm px-3 py-1.5 rounded focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All ({posts.length})</option>
            {allCategories.map(cat => {
              const count = posts.filter(p => p.categories.includes(cat)).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-zinc-800 border border-zinc-700 text-gray-300 text-sm px-3 py-1.5 rounded focus:outline-none focus:border-zinc-500"
          >
            <option value="recent">Recently Added</option>
            <option value="category">By Category</option>
            <option value="reading-time">By Reading Time</option>
          </select>
        </div>

        {/* Show Completed Toggle */}
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded text-green-600 focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-sm text-gray-400">Show completed</span>
        </label>
      </div>

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
      {showCompleted && completedPosts.length > 0 && (
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

      {/* Empty state after filtering */}
      {filteredPosts.length === 0 && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No articles match your current filters.
          <button
            onClick={() => setFilterCategory('all')}
            className="ml-2 text-gray-400 hover:text-white underline"
          >
            Clear filters
          </button>
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
