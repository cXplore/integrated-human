import { Metadata } from 'next';
import type { ReactElement } from 'react';
import { auth } from '@/auth';
import { getAllPaths, getRecommendedPaths } from '@/lib/learning-paths';
import { getOrCreateHealth, type Pillar, PILLAR_INFO } from '@/lib/integration-health';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Learning Paths | Integrated Human',
  description: 'Curated journeys for personal development and integration',
};

const PILLAR_ICONS: Record<Pillar, ReactElement> = {
  mind: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  body: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  soul: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  ),
  relationships: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
};

const PILLAR_COLORS: Record<Pillar, string> = {
  mind: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  body: 'text-green-400 bg-green-400/10 border-green-400/30',
  soul: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  relationships: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
};

export default async function LearningPathsPage() {
  const session = await auth();
  let recommendedPaths = null;
  let lowestPillar: Pillar | null = null;

  // Get personalized recommendations if logged in
  if (session?.user?.id) {
    try {
      const health = await getOrCreateHealth(session.user.id);
      const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
      let lowestScore = 100;

      for (const pillar of pillars) {
        if (health.pillars[pillar].score < lowestScore) {
          lowestScore = health.pillars[pillar].score;
          lowestPillar = pillar;
        }
      }

      if (lowestPillar) {
        recommendedPaths = getRecommendedPaths(lowestPillar, health.overall.stage, 2);
      }
    } catch {
      // Continue without recommendations
    }
  }

  const allPaths = getAllPaths();

  // Group paths by pillar
  const pathsByPillar: Record<Pillar, typeof allPaths> = {
    mind: allPaths.filter((p) => p.pillar === 'mind'),
    body: allPaths.filter((p) => p.pillar === 'body'),
    soul: allPaths.filter((p) => p.pillar === 'soul'),
    relationships: allPaths.filter((p) => p.pillar === 'relationships'),
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif text-white mb-4">Learning Paths</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Curated journeys that combine courses, articles, and practices to help you develop
            in specific areas.
          </p>
        </div>

        {/* Recommended Paths (if logged in) */}
        {recommendedPaths && recommendedPaths.length > 0 && lowestPillar && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${PILLAR_COLORS[lowestPillar]}`}>
                {PILLAR_ICONS[lowestPillar]}
              </div>
              <div>
                <h2 className="text-xl text-white font-medium">Recommended for You</h2>
                <p className="text-sm text-gray-500">
                  Based on your {PILLAR_INFO[lowestPillar].name.toLowerCase()} focus
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {recommendedPaths.map((path) => (
                <Link
                  key={path.id}
                  href={`/learn/paths/${path.id}`}
                  className="group bg-[var(--card-bg)] border border-[var(--border-color)] p-6 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`text-xs font-medium uppercase tracking-wide ${PILLAR_COLORS[path.pillar].split(' ')[0]}`}
                    >
                      {path.pillar}
                    </span>
                    <span className="text-xs text-gray-600">{path.estimatedDuration}</span>
                  </div>

                  <h3 className="text-white font-medium mb-1 group-hover:text-purple-400 transition-colors">
                    {path.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">{path.subtitle}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{path.steps.length} steps</span>
                    <span>·</span>
                    <span>
                      {path.steps.filter((s) => s.type === 'practice').length} practices
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Paths by Pillar */}
        {(['mind', 'body', 'soul', 'relationships'] as Pillar[]).map((pillar) => (
          <section key={pillar} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${PILLAR_COLORS[pillar]}`}>
                {PILLAR_ICONS[pillar]}
              </div>
              <h2 className="text-xl text-white font-medium">{PILLAR_INFO[pillar].name}</h2>
            </div>

            <div className="space-y-3">
              {pathsByPillar[pillar].map((path) => (
                <Link
                  key={path.id}
                  href={`/learn/paths/${path.id}`}
                  className="group flex items-start gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] p-5 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                        {path.title}
                      </h3>
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        {path.estimatedDuration}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{path.subtitle}</p>

                    <div className="flex flex-wrap gap-2">
                      {path.outcomes.slice(0, 3).map((outcome, i) => (
                        <span
                          key={i}
                          className="text-xs text-gray-600 bg-zinc-800 px-2 py-1 rounded"
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>
                  </div>

                  <svg
                    className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1"
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
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Not logged in prompt */}
        {!session && (
          <div className="bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-purple-500/20 p-6 text-center mt-12">
            <h3 className="text-white font-medium mb-2">Get Personalized Recommendations</h3>
            <p className="text-gray-400 text-sm mb-4">
              Sign in to see learning paths tailored to your health state and goals.
            </p>
            <Link
              href="/api/auth/signin"
              className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
