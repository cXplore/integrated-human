'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SeriesPost {
  slug: string;
  title: string;
  order: number;
}

interface SeriesProgressProps {
  seriesId: string;
  seriesName: string;
  posts: SeriesPost[];
  currentSlug: string;
}

const STORAGE_KEY = 'integrated-human-read-articles';

export default function SeriesProgress({ seriesId, seriesName, posts, currentSlug }: SeriesProgressProps) {
  const [readSlugs, setReadSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setReadSlugs(JSON.parse(stored));
      } catch {
        setReadSlugs([]);
      }
    }
  }, []);

  // Mark current article as read after 30 seconds
  useEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(() => {
      setReadSlugs((prev) => {
        if (prev.includes(currentSlug)) return prev;
        const updated = [...prev, currentSlug];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 30000);

    return () => clearTimeout(timer);
  }, [currentSlug, mounted]);

  if (!mounted) {
    return null;
  }

  const readInSeries = posts.filter((p) => readSlugs.includes(p.slug)).length;
  const progressPercent = (readInSeries / posts.length) * 100;
  const currentIndex = posts.findIndex((p) => p.slug === currentSlug);

  return (
    <div className="series-progress bg-zinc-900 border border-zinc-800 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {seriesName}
          </span>
          <p className="text-sm text-gray-400 mt-1">
            {readInSeries} of {posts.length} completed
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-light text-white">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 mb-4">
        <div
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Series steps */}
      <div className="flex gap-1">
        {posts.map((post, index) => {
          const isRead = readSlugs.includes(post.slug);
          const isCurrent = post.slug === currentSlug;

          return (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className={`flex-1 h-2 transition-colors ${
                isCurrent
                  ? 'bg-white'
                  : isRead
                  ? 'bg-zinc-600 hover:bg-zinc-500'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
              title={`${index + 1}. ${post.title}${isRead ? ' (read)' : ''}`}
            />
          );
        })}
      </div>

      {/* Current position */}
      <p className="text-xs text-gray-500 mt-4">
        Article {currentIndex + 1} of {posts.length}
      </p>
    </div>
  );
}
