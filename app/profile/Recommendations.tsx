'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Recommendation {
  slug: string;
  title: string;
  description: string;
  category: string;
  price: number;
  level?: string;
  reasons: string[];
  purchased: boolean;
  inProgress: boolean;
}

interface RecommendationsData {
  recommendations: Recommendation[];
  hasProfile: boolean;
  stats: {
    completedCourses: number;
    startedCourses: number;
    purchasedCourses: number;
  };
}

export default function Recommendations() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch('/api/recommendations');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Recommended for You
        </h2>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Recommended for You
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-gray-400 text-sm mb-3">
            Complete your profile to get personalized recommendations.
          </p>
          <Link
            href="/onboarding"
            className="inline-block text-sm text-white hover:text-gray-300 transition-colors"
          >
            Complete profile →
          </Link>
        </div>
      </div>
    );
  }

  // Show top 3 recommendations
  const topRecommendations = data.recommendations.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-wide text-gray-500">
          Recommended for You
        </h2>
        {!data.hasProfile && (
          <Link
            href="/onboarding"
            className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
          >
            Improve suggestions →
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {topRecommendations.map((rec) => (
          <Link
            key={rec.slug}
            href={`/courses/${rec.slug}`}
            className="group block border border-zinc-800 hover:border-zinc-600 transition-colors p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {rec.inProgress && (
                    <span className="text-xs text-blue-400 uppercase tracking-wide">
                      Continue
                    </span>
                  )}
                  {rec.price === 0 && !rec.inProgress && (
                    <span className="text-xs text-green-500 uppercase tracking-wide">
                      Free
                    </span>
                  )}
                  {rec.level && (
                    <span className="text-xs text-gray-500">
                      {rec.level}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-white group-hover:text-gray-300 transition-colors line-clamp-1">
                  {rec.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {rec.description}
                </p>
                {rec.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rec.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-gray-400 bg-zinc-800 px-2 py-0.5 rounded"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {data.recommendations.length > 3 && (
        <Link
          href="/courses"
          className="inline-block text-sm text-gray-400 hover:text-white transition-colors mt-4"
        >
          See more recommendations →
        </Link>
      )}
    </div>
  );
}
