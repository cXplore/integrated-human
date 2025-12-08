'use client';

import { useReadingList } from '../components/ReadingListContext';
import Link from 'next/link';

export default function ReadingStats() {
  const { savedSlugs, readSlugs, isSyncing } = useReadingList();

  return (
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
  );
}
