'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Purchase {
  id: string;
  courseSlug: string;
  amount: number;
  currency: string;
  purchasedAt: string;
}

interface CourseInfo {
  title: string;
  modules: number;
}

export default function PurchasedCourses() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [courseInfo, setCourseInfo] = useState<Record<string, CourseInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const res = await fetch('/api/purchases');
        const data = await res.json();
        if (data.purchases) {
          setPurchases(data.purchases);

          // Fetch course info for each purchase
          const info: Record<string, CourseInfo> = {};
          for (const purchase of data.purchases) {
            try {
              const courseRes = await fetch(`/api/courses/${purchase.courseSlug}`);
              const courseData = await courseRes.json();
              if (courseData.course) {
                info[purchase.courseSlug] = {
                  title: courseData.course.metadata.title,
                  modules: courseData.course.metadata.modules.length,
                };
              }
            } catch {
              info[purchase.courseSlug] = {
                title: purchase.courseSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                modules: 0,
              };
            }
          }
          setCourseInfo(info);
        }
      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
        Purchased Courses
      </h2>

      {purchases.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">No courses purchased yet</p>
          <Link
            href="/courses"
            className="text-sm text-white hover:text-gray-300 underline"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => {
            const info = courseInfo[purchase.courseSlug];
            return (
              <Link
                key={purchase.id}
                href={`/courses/${purchase.courseSlug}`}
                className="block p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      {info?.title || purchase.courseSlug}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {info?.modules ? `${info.modules} modules` : 'Loading...'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-green-500 text-sm">Owned</span>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(purchase.purchasedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
