'use client';

import { useState } from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/posts';

interface ReadingTimeFilterProps {
  posts: Post[];
}

type TimeFilter = 'all' | 'quick' | 'medium' | 'deep';

const filters: { value: TimeFilter; label: string; description: string }[] = [
  { value: 'all', label: 'All', description: 'All articles' },
  { value: 'quick', label: 'Quick', description: '5 min or less' },
  { value: 'medium', label: 'Medium', description: '6-10 min' },
  { value: 'deep', label: 'Deep Dive', description: '10+ min' },
];

function filterByTime(posts: Post[], filter: TimeFilter): Post[] {
  switch (filter) {
    case 'quick':
      return posts.filter((p) => p.readingTime <= 5);
    case 'medium':
      return posts.filter((p) => p.readingTime > 5 && p.readingTime <= 10);
    case 'deep':
      return posts.filter((p) => p.readingTime > 10);
    default:
      return posts;
  }
}

export default function ReadingTimeFilter({ posts }: ReadingTimeFilterProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');

  const filteredPosts = filterByTime(posts, activeFilter);

  // Count posts in each category
  const counts = {
    all: posts.length,
    quick: posts.filter((p) => p.readingTime <= 5).length,
    medium: posts.filter((p) => p.readingTime > 5 && p.readingTime <= 10).length,
    deep: posts.filter((p) => p.readingTime > 10).length,
  };

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeFilter === filter.value
                ? 'border-white text-white bg-zinc-800'
                : 'border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500'
            }`}
            title={filter.description}
          >
            {filter.label}
            <span className="ml-2 text-gray-600">({counts[filter.value]})</span>
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No articles match this filter.
        </p>
      )}
    </div>
  );
}
