'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

interface CoursesGridProps {
  courses: Course[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Mind: '🧠',
  Body: '💪',
  Soul: '✨',
  Relationships: '💞',
};

const TIER_COLORS: Record<string, string> = {
  intro: 'bg-gray-800/50 text-gray-400 border-gray-700',
  beginner: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
  intermediate: 'bg-amber-900/50 text-amber-400 border-amber-800',
  advanced: 'bg-purple-900/50 text-purple-400 border-purple-800',
  flagship: 'bg-rose-900/50 text-rose-400 border-rose-800',
};

function CourseCard({ course }: { course: Course }) {
  const tierColor = TIER_COLORS[course.tier] || TIER_COLORS.beginner;
  const categoryIcon = CATEGORY_ICONS[course.category] || '';

  return (
    <Link href={`/courses/${course.slug}`}>
      <article className="group bg-zinc-900 p-6 border border-zinc-800 hover:border-zinc-600 transition-all rounded-lg relative h-full flex flex-col">
        {/* Tier Badge */}
        <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded border ${tierColor}`}>
          {course.tier.charAt(0).toUpperCase() + course.tier.slice(1)}
        </span>

        {/* Category */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {categoryIcon} {course.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-serif text-xl font-light text-white mb-1 group-hover:text-gray-300 transition-colors line-clamp-2">
          {course.title}
        </h2>

        {/* Subtitle */}
        {course.subtitle && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">
            {course.subtitle}
          </p>
        )}

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
          {course.description}
        </p>

        {/* Spectrum Tags */}
        {course.spectrum.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {course.spectrum.slice(0, 3).map((stage) => (
              <span
                key={stage}
                className="text-xs px-1.5 py-0.5 bg-zinc-800 text-gray-500 rounded"
              >
                {stage}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-zinc-800">
          <span>{course.moduleCount} modules</span>
          <span>{course.duration}</span>
        </div>
      </article>
    </Link>
  );
}

export default function CoursesGrid({ courses, loading, hasMore, onLoadMore }: CoursesGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  if (courses.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-xl text-white mb-2">No courses found</h3>
        <p className="text-gray-400">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading more...
          </div>
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* End of results */}
      {!hasMore && courses.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          You've reached the end ({courses.length} courses)
        </div>
      )}
    </div>
  );
}
