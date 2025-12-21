'use client';

import { useEffect, useState } from 'react';

interface DayActivity {
  date: string;
  articles: number;
  modules: number;
  journals: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  weekActivity: DayActivity[];
  daysActive: number;
  totalArticles: number;
  totalModules: number;
  totalJournals: number;
  hasActivityToday: boolean;
}

const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreakTracker() {
  const [data, setData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStreaks() {
      try {
        const res = await fetch('/api/user/streaks');
        if (res.ok) {
          const streakData = await res.json();
          setData(streakData);
        }
      } catch (error) {
        console.error('Failed to fetch streaks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStreaks();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Your Streak
        </h2>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasAnyActivity = data.daysActive > 0;

  return (
    <div className="space-y-6">
      {/* Consistency Display */}
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Your Practice
        </h2>

        <div className="flex items-center gap-6">
          {/* Current consistency */}
          <div className="text-center">
            <div className="text-4xl font-light text-white">
              {data.currentStreak}
            </div>
            <div className="text-sm text-gray-500">
              {data.currentStreak === 1 ? 'day' : 'days'} consistent
            </div>
          </div>

          {/* Days active */}
          {data.daysActive > 0 && (
            <div className="text-center border-l border-zinc-800 pl-6">
              <div className="text-2xl font-light text-gray-400">
                {data.daysActive}
              </div>
              <div className="text-xs text-gray-600">
                days active
              </div>
            </div>
          )}
        </div>

        {/* Gentle message */}
        <p className="text-sm text-gray-500 mt-3">
          {data.currentStreak === 0 && !data.hasActivityToday && (
            "Whenever you're ready, the work will be here."
          )}
          {data.currentStreak === 0 && data.hasActivityToday && (
            "You showed up today. That's what matters."
          )}
          {data.currentStreak > 0 && data.currentStreak < 7 && (
            "Small, consistent steps. No rush."
          )}
          {data.currentStreak >= 7 && (
            "A rhythm is forming. Trust the process."
          )}
        </p>
      </div>

      {/* Weekly Activity */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-600 mb-3">
          This Week
        </h3>
        <div className="flex gap-2">
          {data.weekActivity.map((day, index) => {
            const hasActivity = day.articles > 0 || day.modules > 0 || day.journals > 0;
            const date = new Date(day.date);
            const dayOfWeek = date.getDay();
            const isToday = index === data.weekActivity.length - 1;

            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1"
                title={`${new Date(day.date).toLocaleDateString()}: ${day.articles} articles, ${day.modules} modules, ${day.journals} journal entries`}
              >
                <span className="text-xs text-gray-600">{dayNames[dayOfWeek]}</span>
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                    hasActivity
                      ? 'bg-green-600 text-white'
                      : isToday
                      ? 'bg-zinc-800 border border-zinc-600 text-gray-400'
                      : 'bg-zinc-800 text-gray-600'
                  }`}
                >
                  {hasActivity ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isToday ? (
                    '?'
                  ) : (
                    ''
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Stats (if any activity exists) */}
      {hasAnyActivity && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-gray-600 mb-3">
            Last 90 Days
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900/50 p-3 rounded">
              <div className="text-lg font-light text-white">{data.daysActive}</div>
              <div className="text-xs text-gray-500">days active</div>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded">
              <div className="text-lg font-light text-white">{data.totalArticles}</div>
              <div className="text-xs text-gray-500">articles</div>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded">
              <div className="text-lg font-light text-white">{data.totalModules}</div>
              <div className="text-xs text-gray-500">modules</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
