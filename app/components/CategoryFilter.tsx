'use client';

import { useState } from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/posts';

interface CategoryFilterProps {
  posts: Post[];
  availableTags: string[];
}

export default function CategoryFilter({ posts, availableTags }: CategoryFilterProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = selectedTag
    ? posts.filter((post) => post.metadata.tags.includes(selectedTag))
    : posts;

  if (posts.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-light text-white mb-6">
        Articles
      </h2>

      {/* Tag Filter */}
      {availableTags.length > 1 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-sm border transition-colors ${
                selectedTag === null
                  ? 'border-white text-white bg-zinc-800'
                  : 'border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500'
              }`}
            >
              All ({posts.length})
            </button>
            {availableTags.map((tag) => {
              const count = posts.filter(p => p.metadata.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 text-sm border transition-colors ${
                    selectedTag === tag
                      ? 'border-white text-white bg-zinc-800'
                      : 'border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500'
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Posts */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No articles found with this tag.
        </p>
      )}
    </div>
  );
}
