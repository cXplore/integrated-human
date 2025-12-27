'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CoursesFilters from './CoursesFilters';
import CoursesGrid from './CoursesGrid';
import LibrarySearch from './LibrarySearch';

interface Course {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  tier: string;
  level: string;
  duration: string;
  spectrum: string[];
  tags: string[];
  moduleCount: number;
  image?: string;
}

interface FilterCounts {
  categories: Record<string, number>;
  tiers: Record<string, number>;
  spectrum: Record<string, number>;
  levels: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function CoursesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 18,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<FilterCounts>({
    categories: {},
    tiers: {},
    spectrum: {},
    levels: {},
  });

  // Get filter values from URL
  const selectedCategory = searchParams.get('category');
  const selectedTier = searchParams.get('tier');
  const selectedSpectrum = searchParams.get('spectrum');
  const selectedLevel = searchParams.get('level');
  const searchQuery = searchParams.get('search') || '';
  const sortOrder = searchParams.get('sort') || 'title';

  // Update URL with new params
  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset page when filters change
    if (!('page' in updates)) {
      params.delete('page');
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '/courses';
    router.push(newUrl, { scroll: false });
  }, [searchParams, router]);

  // Fetch courses
  const fetchCourses = useCallback(async (page: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '18');

      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedTier) params.set('tier', selectedTier);
      if (selectedSpectrum) params.set('spectrum', selectedSpectrum);
      if (selectedLevel) params.set('level', selectedLevel);
      if (searchQuery) params.set('search', searchQuery);
      if (sortOrder) params.set('sort', sortOrder);

      const response = await fetch(`/api/courses?${params.toString()}`);
      const data = await response.json();

      if (append) {
        setCourses(prev => [...prev, ...data.courses]);
      } else {
        setCourses(data.courses);
      }

      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, selectedTier, selectedSpectrum, selectedLevel, searchQuery, sortOrder]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchCourses(1, false);
  }, [fetchCourses]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      fetchCourses(pagination.page + 1, true);
    }
  }, [loadingMore, pagination.hasMore, pagination.page, fetchCourses]);

  // Filter change handler
  const handleFilterChange = (key: string, value: string | null) => {
    updateUrl({ [key]: value });
  };

  // Clear all filters
  const handleClearAll = () => {
    router.push('/courses', { scroll: false });
  };

  // Search change handler
  const handleSearchChange = (value: string) => {
    updateUrl({ search: value || null });
  };

  // Sort change handler
  const handleSortChange = (value: string) => {
    updateUrl({ sort: value === 'title' ? null : value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-light text-white mb-3">Courses</h1>
        <p className="text-gray-400 max-w-2xl">
          Structured learning paths across mind, body, soul, and relationships.
          From foundational concepts to advanced practices.
        </p>
      </div>

      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <LibrarySearch
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search courses..."
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Sort:</label>
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600"
          >
            <option value="title">A-Z</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <CoursesFilters
          filters={filters}
          selectedCategory={selectedCategory}
          selectedTier={selectedTier}
          selectedSpectrum={selectedSpectrum}
          selectedLevel={selectedLevel}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
          resultCount={pagination.total}
        />

        {/* Courses Grid */}
        <CoursesGrid
          courses={courses}
          loading={loading || loadingMore}
          hasMore={pagination.hasMore}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
