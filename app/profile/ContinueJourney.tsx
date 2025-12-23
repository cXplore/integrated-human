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

interface CourseProgressItem {
  courseSlug: string;
  moduleSlug: string;
  completed: boolean;
  updatedAt: string;
}

interface CourseData {
  id: string;
  title: string;
  modules: { slug: string; title: string }[];
}

type JourneyItem = {
  type: 'article' | 'course';
  slug: string;
  title: string;
  subtitle: string;
  progress: number;
  lastActivity: Date;
  href: string;
};

export default function ContinueJourney() {
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJourney() {
      try {
        const journeyItems: JourneyItem[] = [];

        // Fetch article progress
        const [progressRes, postsRes, courseProgressRes, coursesRes] = await Promise.all([
          fetch('/api/article-progress'),
          fetch('/api/posts'),
          fetch('/api/course-progress'),
          fetch('/api/courses'),
        ]);

        // Process articles
        if (progressRes.ok && postsRes.ok) {
          const progress: ReadingProgress[] = await progressRes.json();
          const posts: ArticleInfo[] = await postsRes.json();

          const inProgressArticles = progress
            .filter(p => p.scrollProgress > 5 && p.scrollProgress < 90 && !p.completed)
            .slice(0, 5);

          inProgressArticles.forEach(prog => {
            const article = posts.find(p => p.slug === prog.slug);
            if (article) {
              journeyItems.push({
                type: 'article',
                slug: article.slug,
                title: article.title,
                subtitle: `${article.readingTime} min read`,
                progress: prog.scrollProgress,
                lastActivity: new Date(prog.lastReadAt),
                href: `/posts/${article.slug}`,
              });
            }
          });
        }

        // Process courses
        if (courseProgressRes.ok && coursesRes.ok) {
          const courseProgressData = await courseProgressRes.json();
          // API returns { progress: [...], total, hasMore }
          const courseProgress: CourseProgressItem[] = courseProgressData.progress || [];
          const courses: CourseData[] = await coursesRes.json();
          const coursesMap = new Map(courses.map(c => [c.id, c]));

          // Group by course
          const progressByCourse: Record<string, {
            completedModules: Set<string>;
            lastActivity: Date;
            lastModuleSlug: string;
          }> = {};

          courseProgress.forEach((p) => {
            if (!progressByCourse[p.courseSlug]) {
              progressByCourse[p.courseSlug] = {
                completedModules: new Set(),
                lastActivity: new Date(p.updatedAt),
                lastModuleSlug: p.moduleSlug,
              };
            }

            const course = progressByCourse[p.courseSlug];
            const activityDate = new Date(p.updatedAt);

            if (activityDate > course.lastActivity) {
              course.lastActivity = activityDate;
              course.lastModuleSlug = p.moduleSlug;
            }

            if (p.completed) {
              course.completedModules.add(p.moduleSlug);
            }
          });

          // Build course items
          Object.entries(progressByCourse).forEach(([courseSlug, prog]) => {
            const courseData = coursesMap.get(courseSlug);
            if (!courseData) return;

            const completedCount = prog.completedModules.size;
            const totalModules = courseData.modules.length;

            // Only show in-progress courses
            if (completedCount < totalModules) {
              // Find next module
              let nextModule: { slug: string; title: string } | undefined;
              for (const module of courseData.modules) {
                if (!prog.completedModules.has(module.slug)) {
                  nextModule = module;
                  break;
                }
              }

              journeyItems.push({
                type: 'course',
                slug: courseSlug,
                title: courseData.title,
                subtitle: nextModule ? `Next: ${nextModule.title}` : `${completedCount}/${totalModules} modules`,
                progress: (completedCount / totalModules) * 100,
                lastActivity: prog.lastActivity,
                href: nextModule
                  ? `/courses/${courseSlug}/${nextModule.slug}`
                  : `/courses/${courseSlug}`,
              });
            }
          });
        }

        // Sort by last activity and take top 4
        journeyItems.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        setItems(journeyItems.slice(0, 4));
      } catch (error) {
        console.error('Error fetching journey:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJourney();
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state - no progress yet
  if (items.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2">Start Your Journey</h3>
          <p className="text-gray-500 text-sm mb-4">
            Begin reading articles or taking courses to track your progress here.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/library"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm transition-colors"
            >
              Browse Articles
            </Link>
            <Link
              href="/courses"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={`${item.type}-${item.slug}`}
            href={item.href}
            className="block group"
          >
            <div className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
              {/* Type indicator */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.type === 'article' ? 'bg-amber-900/30' : 'bg-emerald-900/30'
              }`}>
                {item.type === 'article' ? (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium truncate group-hover:text-gray-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-xs truncate">
                  {item.subtitle}
                </p>
              </div>

              {/* Progress circle */}
              <div className="w-10 h-10 relative flex-shrink-0">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
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
                    className={item.type === 'article' ? 'text-amber-500' : 'text-emerald-500'}
                    strokeDasharray={`${(item.progress / 100) * 88} 88`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  {Math.round(item.progress)}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View all link */}
      <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between">
        <Link
          href="/library"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          All articles →
        </Link>
        <Link
          href="/courses"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          All courses →
        </Link>
      </div>
    </div>
  );
}
