'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CourseProgressItem {
  courseSlug: string;
  moduleSlug: string;
  completed: boolean;
  completedAt: string | null;
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
        const progressData: CourseProgressItem[] = await progressResponse.json();

        // Fetch all courses to get total modules
        const coursesResponse = await fetch('/api/courses');
        if (!coursesResponse.ok) {
          setIsLoading(false);
          return;
        }
        const coursesData: CourseData[] = await coursesResponse.json();

        // Group progress by course
        const progressByCourse: Record<string, Set<string>> = {};
        progressData.forEach((p) => {
          if (p.completed) {
            if (!progressByCourse[p.courseSlug]) {
              progressByCourse[p.courseSlug] = new Set();
            }
            progressByCourse[p.courseSlug].add(p.moduleSlug);
          }
        });

        // Build courses with progress
        const result: CourseWithProgress[] = [];
        coursesData.forEach((course) => {
          const completedModules = progressByCourse[course.id]?.size || 0;
          if (completedModules > 0) {
            result.push({
              slug: course.id,
              title: course.title,
              totalModules: course.modules.length,
              completedModules,
            });
          }
        });

        // Sort by progress percentage (most complete first)
        result.sort((a, b) => {
          const aPercent = a.completedModules / a.totalModules;
          const bPercent = b.completedModules / b.totalModules;
          return bPercent - aPercent;
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
          Courses
        </h2>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const completedCourses = coursesWithProgress.filter(
    (c) => c.completedModules === c.totalModules
  );
  const inProgressCourses = coursesWithProgress.filter(
    (c) => c.completedModules < c.totalModules
  );

  return (
    <div className="space-y-6">
      {/* Completion Badges */}
      {completedCourses.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Completed Courses
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
                    className="w-6 h-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div className="text-xs text-green-600 uppercase tracking-wide mb-1">
                  Completed
                </div>
                <h3 className="font-serif text-sm text-white group-hover:text-gray-300 transition-colors line-clamp-2">
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

      {/* In Progress */}
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          {completedCourses.length > 0 ? 'In Progress' : 'Courses'}
        </h2>

        {inProgressCourses.length > 0 ? (
          <div className="space-y-4">
            {inProgressCourses.map((course) => (
              <div key={course.slug} className="py-3 border-b border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {course.title}
                  </Link>
                  <span className="text-sm text-gray-500">
                    {course.completedModules}/{course.totalModules}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${(course.completedModules / course.totalModules) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <Link
              href="/courses"
              className="inline-block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Browse all courses →
            </Link>
          </div>
        ) : coursesWithProgress.length === 0 ? (
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
        ) : (
          <p className="text-gray-500 text-sm">
            All caught up! <Link href="/courses" className="text-gray-300 hover:text-white">Start a new course →</Link>
          </p>
        )}
      </div>
    </div>
  );
}
