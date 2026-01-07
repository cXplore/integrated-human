'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CoursesFilters from './CoursesFilters';
import CoursesGrid from './CoursesGrid';
import LibrarySearch from './LibrarySearch';

// Pillar icons for category pills
const PILLAR_CONFIG: Record<string, { icon: React.ReactNode; color: string; activeColor: string }> = {
  mind: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    activeColor: 'bg-blue-500 text-white border-blue-500',
  },
  body: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20',
    activeColor: 'bg-green-500 text-white border-green-500',
  },
  soul: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    activeColor: 'bg-purple-500 text-white border-purple-500',
  },
  relationships: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
    activeColor: 'bg-rose-500 text-white border-rose-500',
  },
};

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
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
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

      {/* Category Pills - Quick Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 mr-1">Pillar:</span>
        <button
          onClick={() => handleFilterChange('category', null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            !selectedCategory
              ? 'bg-white text-black border-white'
              : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          All
        </button>
        {Object.entries(PILLAR_CONFIG).map(([key, config]) => {
          const isActive = selectedCategory === key;
          const count = filters.categories[key] || 0;
          return (
            <button
              key={key}
              onClick={() => handleFilterChange('category', isActive ? null : key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                isActive ? config.activeColor : config.color
              }`}
            >
              {config.icon}
              <span className="capitalize">{key}</span>
              {count > 0 && (
                <span className={`text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
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
