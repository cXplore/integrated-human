'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface TodaysData {
  date: string;
  greeting: string;
  intention: string;
  focus: {
    pillar: string;
    pillarName: string;
    theme: string;
    action: string;
  };
  practice: {
    slug: string;
    title: string;
    description: string;
    duration: number;
  } | null;
  continueContent: {
    type: 'course' | 'article';
    slug: string;
    title: string;
    progress?: number;
  } | null;
  checkIn: {
    hasCheckedInToday: boolean;
    streak: number;
    prompt: string;
  };
  health: {
    stage: string;
    inCollapse: boolean;
    lowestPillar: string;
  } | null;
}

export default function TodaysFocus() {
  const { data: session, status } = useSession();
  const [todaysData, setTodaysData] = useState<TodaysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/today')
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setTodaysData(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  // Don't show if not logged in
  if (status !== 'authenticated') return null;

  // Show minimal loading state
  if (loading) {
    return (
      <section className="py-12 px-6 bg-gradient-to-b from-zinc-900 to-[var(--background)]">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-48" />
            <div className="h-4 bg-zinc-800 rounded w-96" />
          </div>
        </div>
      </section>
    );
  }

  if (!todaysData || dismissed) return null;

  const { greeting, intention, focus, practice, continueContent, checkIn, health } = todaysData;

  return (
    <section className="py-8 md:py-12 px-4 md:px-6 bg-gradient-to-b from-zinc-900 to-[var(--background)] border-b border-zinc-800">
      <div className="max-w-4xl mx-auto">
        {/* Header with dismiss */}
        <div className="flex items-start justify-between mb-4 md:mb-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">{greeting}</p>
            <h2 className="font-serif text-xl md:text-2xl text-white">Today&apos;s Focus</h2>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-600 hover:text-gray-400 active:text-gray-300 transition-colors p-3 -mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Daily Intention */}
        <div className="mb-6 md:mb-8">
          <p className="text-gray-300 text-base md:text-lg italic leading-relaxed">
            &ldquo;{intention}&rdquo;
          </p>
        </div>

        {/* Grid of actions - stacks on mobile */}
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Pillar Focus */}
          <Link
            href={`/${focus.pillar}`}
            className="block bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg hover:border-zinc-600 active:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {focus.theme}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              {focus.action}
            </p>
            <span className="text-xs text-gray-500">
              Explore {focus.pillarName} →
            </span>
          </Link>

          {/* Quick Practice */}
          {practice && (
            <Link
              href={`/practices/${practice.slug}`}
              className="group block bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg hover:border-zinc-600 active:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  Practice
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-600">{practice.duration} min</span>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 group-hover:text-gray-300 transition-colors">
                {practice.title}
              </h3>
              <p className="text-gray-500 text-xs line-clamp-2">
                {practice.description}
              </p>
            </Link>
          )}

          {/* Continue Content or Check-in */}
          {continueContent ? (
            <Link
              href={
                continueContent.type === 'course'
                  ? `/courses/${continueContent.slug}`
                  : `/posts/${continueContent.slug}`
              }
              className="group block bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg hover:border-zinc-600 active:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  Continue
                </span>
                {continueContent.progress !== undefined && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600">
                      {Math.round(continueContent.progress)}% done
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-white text-sm font-medium mb-1 group-hover:text-gray-300 transition-colors line-clamp-2">
                {continueContent.title}
              </h3>
              <span className="text-xs text-gray-500">
                Pick up where you left off →
              </span>
            </Link>
          ) : (
            <Link
              href="/profile#check-in"
              className="group block bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg hover:border-zinc-600 active:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  Check-in
                </span>
                {checkIn.streak > 0 && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-amber-600">
                      {checkIn.streak} day streak
                    </span>
                  </>
                )}
              </div>
              <p className="text-gray-300 text-sm mb-1">
                {checkIn.hasCheckedInToday ? '✓ Checked in today' : 'How are you feeling?'}
              </p>
              {!checkIn.hasCheckedInToday && (
                <span className="text-xs text-gray-500">
                  Take a moment to reflect →
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Subtle health indicator if in collapse */}
        {health?.inCollapse && (
          <p className="text-gray-600 text-xs mt-6 text-center">
            We notice you might be going through a difficult time.
            These recommendations are designed to support gentle recovery.
          </p>
        )}
      </div>
    </section>
  );
}
