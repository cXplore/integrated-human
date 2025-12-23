'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CourseProgressItem {
  courseSlug: string;
  moduleSlug: string;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
}

interface CourseData {
  id: string;
  title: string;
  modules: { slug: string; title: string }[];
}

interface CourseWithProgress {
  slug: string;
  title: string;
  totalModules: number;
  completedModules: number;
  lastActivity: Date;
  lastModuleSlug: string;
  lastModuleTitle: string;
  nextModuleSlug?: string;
  nextModuleTitle?: string;
}

// Helper to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export default function CourseProgress() {
  const [coursesWithProgress, setCoursesWithProgress] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        // Fetch user's course progress
        const progressResponse = await fetch('/api/course-progress');
        if (!progressResponse.ok) {
          setIsLoading(false);
          return;
        }
        const progressJson = await progressResponse.json();
        // API returns { progress: [...], total, hasMore }
        const progressData: CourseProgressItem[] = progressJson.progress || [];

        // Fetch all courses to get total modules
        const coursesResponse = await fetch('/api/courses');
        if (!coursesResponse.ok) {
          setIsLoading(false);
          return;
        }
        const coursesData: CourseData[] = await coursesResponse.json();

        // Create a map of courses for easy lookup
        const coursesMap = new Map(coursesData.map(c => [c.id, c]));

        // Group progress by course with activity tracking
        const progressByCourse: Record<string, {
          completedModules: Set<string>;
          lastActivity: Date;
          lastModuleSlug: string;
        }> = {};

        progressData.forEach((p) => {
          if (!progressByCourse[p.courseSlug]) {
            progressByCourse[p.courseSlug] = {
              completedModules: new Set(),
              lastActivity: new Date(p.updatedAt),
              lastModuleSlug: p.moduleSlug,
            };
          }

          const course = progressByCourse[p.courseSlug];
          const activityDate = new Date(p.updatedAt);

          // Track most recent activity
          if (activityDate > course.lastActivity) {
            course.lastActivity = activityDate;
            course.lastModuleSlug = p.moduleSlug;
          }

          if (p.completed) {
            course.completedModules.add(p.moduleSlug);
          }
        });

        // Build courses with progress
        const result: CourseWithProgress[] = [];
        Object.entries(progressByCourse).forEach(([courseSlug, progress]) => {
          const courseData = coursesMap.get(courseSlug);
          if (!courseData) return;

          const completedModules = progress.completedModules.size;
          const lastModule = courseData.modules.find(m => m.slug === progress.lastModuleSlug);

          // Find next uncompleted module
          let nextModule: { slug: string; title: string } | undefined;
          for (const module of courseData.modules) {
            if (!progress.completedModules.has(module.slug)) {
              nextModule = module;
              break;
            }
          }

          result.push({
            slug: courseSlug,
            title: courseData.title,
            totalModules: courseData.modules.length,
            completedModules,
            lastActivity: progress.lastActivity,
            lastModuleSlug: progress.lastModuleSlug,
            lastModuleTitle: lastModule?.title || progress.lastModuleSlug,
            nextModuleSlug: nextModule?.slug,
            nextModuleTitle: nextModule?.title,
          });
        });

        setCoursesWithProgress(result);
      } catch (error) {
        console.error('Failed to fetch course progress:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Your Journey
        </h2>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  // Completed courses
  const completedCourses = coursesWithProgress.filter(
    (c) => c.completedModules === c.totalModules
  );

  // Active/Living courses: in progress AND accessed in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activeCourses = coursesWithProgress
    .filter((c) => c.completedModules < c.totalModules && c.lastActivity >= sevenDaysAgo)
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

  // Dormant courses: in progress but not accessed recently
  const dormantCourses = coursesWithProgress
    .filter((c) => c.completedModules < c.totalModules && c.lastActivity < sevenDaysAgo)
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

  return (
    <div className="space-y-6">
      {/* Living / Active Courses */}
      {activeCourses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-sm uppercase tracking-wide text-gray-500">
              Living
            </h2>
          </div>
          <div className="space-y-3">
            {activeCourses.map((course) => (
              <div
                key={course.slug}
                className="bg-zinc-900/50 border border-zinc-800 p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="font-serif text-white hover:text-gray-300 transition-colors"
                    >
                      {course.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRelativeTime(course.lastActivity)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {course.completedModules}/{course.totalModules}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{
                      width: `${(course.completedModules / course.totalModules) * 100}%`,
                    }}
                  />
                </div>

                {/* Continue link */}
                {course.nextModuleSlug && (
                  <Link
                    href={`/courses/${course.slug}/${course.nextModuleSlug}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>Continue:</span>
                    <span className="text-gray-300">{course.nextModuleTitle}</span>
                    <span className="text-gray-600">→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dormant Courses */}
      {dormantCourses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-amber-500/50 rounded-full" />
            <h2 className="text-sm uppercase tracking-wide text-gray-500">
              Waiting for You
            </h2>
          </div>
          <div className="space-y-3">
            {dormantCourses.map((course) => (
              <div key={course.slug} className="py-3 border-b border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {course.title}
                    </Link>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Last visited {getRelativeTime(course.lastActivity)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-600">
                    {course.completedModules}/{course.totalModules}
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600/50 transition-all duration-300"
                    style={{
                      width: `${(course.completedModules / course.totalModules) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Completed
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {completedCourses.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="group relative bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 p-4 hover:border-zinc-500 transition-colors"
              >
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 className="font-serif text-sm text-white group-hover:text-gray-300 transition-colors line-clamp-2 pr-6">
                  {course.title}
                </h3>
                <div className="text-xs text-gray-500 mt-2">
                  {course.totalModules} modules
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {coursesWithProgress.length === 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Your Journey
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-gray-400 text-sm mb-3">
              Start a course to track your progress here.
            </p>
            <Link
              href="/courses"
              className="inline-block text-sm text-white hover:text-gray-300 transition-colors"
            >
              Browse courses →
            </Link>
          </div>
        </div>
      )}

      {/* Browse more */}
      {coursesWithProgress.length > 0 && (
        <Link
          href="/courses"
          className="inline-block text-sm text-gray-400 hover:text-white transition-colors"
        >
          Browse all courses →
        </Link>
      )}
    </div>
  );
}
