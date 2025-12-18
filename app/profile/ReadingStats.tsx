'use client';

import { useReadingList } from '../components/ReadingListContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SeriesProgress {
  id: string;
  name: string;
  completed: number;
  total: number;
}

export default function ReadingStats() {
  const { savedSlugs, readSlugs, isSyncing } = useReadingList();
  const [seriesProgress, setSeriesProgress] = useState<SeriesProgress[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/user/journey-progress');
        if (response.ok) {
          const data = await response.json();
          setSeriesProgress(data.seriesProgress || []);
          setTotalArticles(data.totalArticles || 0);
        }
      } catch (error) {
        console.error('Failed to fetch journey progress:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [readSlugs]);

  const startedSeries = seriesProgress.filter(s => s.completed > 0);

  return (
    <div className="space-y-8">
      {/* Reading Activity */}
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Reading Activity
        </h2>
        {isSyncing ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Syncing...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <span className="text-gray-400">Saved articles</span>
              <span className="text-white">{savedSlugs.length}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <span className="text-gray-400">Completed</span>
              <span className="text-white">{readSlugs.length}</span>
            </div>
            {totalArticles > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-gray-400">Overall progress</span>
                <span className="text-white">
                  {Math.round((readSlugs.length / totalArticles) * 100)}%
                </span>
              </div>
            )}
            {savedSlugs.length > 0 && (
              <Link
                href="/reading-list"
                className="inline-block text-sm text-gray-400 hover:text-white transition-colors"
              >
                View reading list →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Learning Paths Progress */}
      {!isLoading && startedSeries.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Learning Paths
          </h2>
          <div className="space-y-4">
            {startedSeries.map((series) => (
              <div key={series.id} className="py-3 border-b border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{series.name}</span>
                  <span className="text-sm text-gray-500">
                    {series.completed}/{series.total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      series.completed === series.total ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${(series.completed / series.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <Link
              href="/learning-paths"
              className="inline-block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Explore all paths →
            </Link>
          </div>
        </div>
      )}

      {/* Encourage starting if no progress */}
      {!isLoading && startedSeries.length === 0 && readSlugs.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-gray-400 text-sm mb-3">
            Start your journey with a structured learning path.
          </p>
          <Link
            href="/learning-paths"
            className="inline-block text-sm text-white hover:text-gray-300 transition-colors"
          >
            Browse learning paths →
          </Link>
        </div>
      )}
    </div>
  );
}
