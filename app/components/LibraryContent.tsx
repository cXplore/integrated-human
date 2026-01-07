'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import LibraryFilters from './LibraryFilters';
import LibraryGrid from './LibraryGrid';
import LibrarySearch from './LibrarySearch';

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

interface FilterCounts {
  pillars: {
    mind: number;
    body: number;
    soul: number;
    relationships: number;
  };
  types: {
    article: number;
    guide: number;
  };
  readingTime: {
    quick: number;
    medium: number;
    deep: number;
  };
}

interface Dimension {
  id: string;
  name: string;
  pillar: string;
}

interface TagCount {
  tag: string;
  count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const POSTS_PER_PAGE = 18;

export default function LibraryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState<FilterCounts | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);

  // Get current filter values from URL
  const currentPillar = searchParams.get('pillar');
  const currentDimension = searchParams.get('dimension');
  const currentType = searchParams.get('type');
  const currentReadingTime = searchParams.get('readingTime');
  const currentTag = searchParams.get('tag');
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  // Update URL with filters
  const updateFilters = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filters change
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    updateFilters('search', value || null);
  }, [updateFilters]);

  // Fetch posts
  const fetchPosts = useCallback(async (page: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', POSTS_PER_PAGE.toString());

      if (currentPillar) params.set('pillar', currentPillar);
      if (currentDimension) params.set('dimension', currentDimension);
      if (currentType) params.set('type', currentType);
      if (currentReadingTime) params.set('readingTime', currentReadingTime);
      if (currentTag) params.set('tag', currentTag);
      if (currentSearch) params.set('search', currentSearch);

      const response = await fetch(`/api/posts?${params.toString()}`);
      const data = await response.json();

      if (append) {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      } else {
        setPosts(data.posts || []);
      }

      setPagination(data.pagination);
      setFilters(data.filters);
      setDimensions(data.dimensions);
      setTags(data.tags || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentPillar, currentDimension, currentType, currentReadingTime, currentTag, currentSearch]);

  // Initial load and filter changes
  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Load more posts
  const handleLoadMore = useCallback(() => {
    if (pagination && pagination.hasMore && !loadingMore) {
      const nextPage = pagination.page + 1;
      fetchPosts(nextPage, true);
    }
  }, [pagination, loadingMore, fetchPosts]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar */}
      {filters && (
        <LibraryFilters
          filters={filters}
          dimensions={dimensions}
          tags={tags}
          selectedPillar={currentPillar}
          selectedDimension={currentDimension}
          selectedType={currentType}
          selectedReadingTime={currentReadingTime}
          selectedTag={currentTag}
          onFilterChange={updateFilters}
          onClearAll={clearAllFilters}
          resultCount={pagination?.total || 0}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="mb-6">
          <LibrarySearch
            value={currentSearch}
            onChange={handleSearch}
            placeholder="Search by title, topic, or keyword..."
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-400">
            {pagination && (
              <>
                Showing {posts.length} of {pagination.total} articles
              </>
            )}
          </div>
        </div>

        {/* Grid */}
        <LibraryGrid
          posts={posts}
          loading={loading || loadingMore}
          hasMore={pagination?.hasMore || false}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
