'use client';

import { useEffect, useState } from 'react';

interface DayActivity {
  date: string;
  articles: number;
  modules: number;
  journals: number;
  checkIns: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  weekActivity: DayActivity[];
  daysActive: number;
  totalArticles: number;
  totalModules: number;
  totalJournals: number;
  totalCheckIns: number;
  checkInStreak: number;
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
          Your Practice
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
      {/* Streak Display */}
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Your Practice
        </h2>

        <div className="flex items-center gap-6">
          {/* Practice streak */}
          <div className="text-center">
            <div className="text-4xl font-light text-white">
              {data.currentStreak}
            </div>
            <div className="text-sm text-gray-500">
              {data.currentStreak === 1 ? 'day' : 'days'} consistent
            </div>
          </div>

          {/* Check-in streak (if different and notable) */}
          {data.checkInStreak > 0 && data.checkInStreak !== data.currentStreak && (
            <div className="text-center border-l border-zinc-800 pl-6">
              <div className="text-2xl font-light text-amber-400">
                {data.checkInStreak}
              </div>
              <div className="text-xs text-gray-600">
                check-in streak
              </div>
            </div>
          )}

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
          {data.currentStreak >= 7 && data.currentStreak < 30 && (
            "A rhythm is forming. Trust the process."
          )}
          {data.currentStreak >= 30 && (
            "The practice is becoming part of you."
          )}
        </p>
      </div>

      {/* Weekly Activity - Enhanced visualization */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-600 mb-3">
          This Week
        </h3>
        <div className="flex gap-2">
          {data.weekActivity.map((day, index) => {
            const hasActivity = day.articles > 0 || day.modules > 0 || day.journals > 0 || day.checkIns > 0;
            const activityCount = day.articles + day.modules + day.journals + day.checkIns;
            const date = new Date(day.date);
            const dayOfWeek = date.getDay();
            const isToday = index === data.weekActivity.length - 1;

            // Intensity based on activity count
            const intensity = activityCount >= 5 ? 'high' : activityCount >= 2 ? 'medium' : 'low';
            const intensityColors = {
              high: 'bg-green-500',
              medium: 'bg-green-600',
              low: 'bg-green-700',
            };

            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1 flex-1"
                title={`${new Date(day.date).toLocaleDateString()}: ${day.articles} articles, ${day.modules} modules, ${day.journals} journals, ${day.checkIns} check-ins`}
              >
                <span className="text-xs text-gray-600">{dayNames[dayOfWeek]}</span>
                <div
                  className={`w-full aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors max-w-10 ${
                    hasActivity
                      ? `${intensityColors[intensity]} text-white`
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
                {/* Activity type indicators */}
                {hasActivity && (
                  <div className="flex gap-0.5 mt-0.5">
                    {day.checkIns > 0 && <div className="w-1 h-1 rounded-full bg-amber-400" title="Check-in" />}
                    {day.articles > 0 && <div className="w-1 h-1 rounded-full bg-blue-400" title="Article" />}
                    {day.modules > 0 && <div className="w-1 h-1 rounded-full bg-purple-400" title="Module" />}
                    {day.journals > 0 && <div className="w-1 h-1 rounded-full bg-pink-400" title="Journal" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Article</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Module</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Journal</span>
          </div>
        </div>
      </div>

      {/* Activity Stats (if any activity exists) */}
      {hasAnyActivity && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-gray-600 mb-3">
            Last 90 Days
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-zinc-900/50 p-3 rounded">
              <div className="text-lg font-light text-white">{data.daysActive}</div>
              <div className="text-xs text-gray-500">days active</div>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded">
              <div className="text-lg font-light text-amber-400">{data.totalCheckIns}</div>
              <div className="text-xs text-gray-500">check-ins</div>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded">
              <div className="text-lg font-light text-blue-400">{data.totalArticles}</div>
              <div className="text-xs text-gray-500">articles</div>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded">
              <div className="text-lg font-light text-purple-400">{data.totalModules}</div>
              <div className="text-xs text-gray-500">modules</div>
            </div>
          </div>
        </div>
      )}

      {/* Longest streak (if notable) */}
      {data.longestStreak > data.currentStreak && data.longestStreak >= 7 && (
        <p className="text-xs text-gray-600 text-center">
          Personal best: {data.longestStreak} day streak
        </p>
      )}
    </div>
  );
}
