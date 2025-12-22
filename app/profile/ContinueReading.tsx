'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReadingProgress {
  slug: string;
  scrollProgress: number;
  lastReadAt: string;
  completed: boolean;
}

interface ArticleInfo {
  slug: string;
  title: string;
  excerpt: string;
  readingTime: number;
}

export default function ContinueReading() {
  const [inProgress, setInProgress] = useState<(ReadingProgress & ArticleInfo)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        // Fetch reading progress
        const progressRes = await fetch('/api/article-progress');
        if (!progressRes.ok) throw new Error('Failed to fetch progress');

        const progress: ReadingProgress[] = await progressRes.json();

        // Filter to in-progress articles (started but not completed)
        const inProgressArticles = progress
          .filter(p => p.scrollProgress > 5 && p.scrollProgress < 90 && !p.completed)
          .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
          .slice(0, 3);

        if (inProgressArticles.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch article metadata for these slugs
        const postsRes = await fetch('/api/posts');
        if (!postsRes.ok) throw new Error('Failed to fetch posts');

        const posts: ArticleInfo[] = await postsRes.json();

        // Combine progress with article info
        const combined = inProgressArticles
          .map(prog => {
            const article = posts.find(p => p.slug === prog.slug);
            if (!article) return null;
            return { ...prog, ...article };
          })
          .filter((a): a is ReadingProgress & ArticleInfo => a !== null);

        setInProgress(combined);
      } catch (error) {
        console.error('Error fetching continue reading:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
        <div className="h-20 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (inProgress.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm uppercase tracking-wide text-gray-500">
        Continue Reading
      </h2>

      <div className="space-y-3">
        {inProgress.map((article) => (
          <Link
            key={article.slug}
            href={`/posts/${article.slug}`}
            className="block group bg-zinc-900/50 border border-zinc-800 p-4 hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1 truncate group-hover:text-amber-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-1 mb-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>{article.readingTime} min read</span>
                  <span>·</span>
                  <span>
                    {formatTimeAgo(article.lastReadAt)}
                  </span>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex-shrink-0 w-12 h-12 relative">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-zinc-800"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-amber-500"
                    strokeDasharray={`${(article.scrollProgress / 100) * 88} 88`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  {Math.round(article.scrollProgress)}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
