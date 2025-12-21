'use client';

import { useEffect, useState } from 'react';

interface MoodCount {
  mood: string;
  count: number;
  percentage: number;
}

interface WeeklyActivity {
  week: string;
  entries: number;
  wordCount: number;
}

interface InsightsData {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  entriesThisMonth: number;
  moodDistribution: MoodCount[];
  dominantMood: string | null;
  weeklyActivity: WeeklyActivity[];
  writingStreak: number;
  longestEntry: { date: string; wordCount: number } | null;
  promptUsagePercent: number;
  activeDays: number;
  firstEntryDate: string | null;
}

const MOOD_COLORS: Record<string, { bg: string; text: string }> = {
  peaceful: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  grateful: { bg: 'bg-green-500/20', text: 'text-green-400' },
  curious: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  anxious: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  sad: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  angry: { bg: 'bg-red-500/20', text: 'text-red-400' },
  hopeful: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  confused: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
};

const MOOD_LABELS: Record<string, string> = {
  peaceful: 'Peaceful',
  grateful: 'Grateful',
  curious: 'Curious',
  anxious: 'Anxious',
  sad: 'Sad',
  angry: 'Angry',
  hopeful: 'Hopeful',
  confused: 'Confused',
};

export default function JournalInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/journal/insights');
        if (res.ok) {
          const insights = await res.json();
          setData(insights);
        }
      } catch (error) {
        console.error('Failed to fetch journal insights:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading insights...
        </div>
      </div>
    );
  }

  if (!data || data.totalEntries === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-3">
          Your Patterns
        </h3>
        <p className="text-gray-500 text-sm">
          Start journaling to see insights about your patterns over time.
        </p>
      </div>
    );
  }

  // Calculate journey duration
  const journeyDays = data.firstEntryDate
    ? Math.ceil(
        (new Date().getTime() - new Date(data.firstEntryDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Find max entries in a week for scaling the chart
  const maxWeeklyEntries = Math.max(...data.weeklyActivity.map((w) => w.entries), 1);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Your Patterns
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-light text-white">{data.totalEntries}</div>
            <div className="text-xs text-gray-500">entries written</div>
          </div>
          <div>
            <div className="text-2xl font-light text-white">
              {data.totalWords.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">words total</div>
          </div>
          <div>
            <div className="text-2xl font-light text-white">{data.activeDays}</div>
            <div className="text-xs text-gray-500">days journaling</div>
          </div>
          <div>
            <div className="text-2xl font-light text-white">
              {data.averageWordsPerEntry}
            </div>
            <div className="text-xs text-gray-500">avg words/entry</div>
          </div>
        </div>

        {/* Journey message */}
        {journeyDays > 0 && (
          <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-zinc-800">
            {journeyDays === 1
              ? "You started journaling today. Welcome to this practice."
              : journeyDays < 7
              ? `${journeyDays} days into your journaling practice. Every word matters.`
              : journeyDays < 30
              ? `${journeyDays} days of reflection. A habit is forming.`
              : `${journeyDays} days of self-discovery. Your commitment shows.`}
          </p>
        )}
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Last 8 Weeks
        </h3>

        <div className="flex items-end gap-2 h-24">
          {data.weeklyActivity.map((week, index) => {
            const height =
              week.entries > 0 ? Math.max((week.entries / maxWeeklyEntries) * 100, 10) : 0;
            const isCurrentWeek = index === data.weeklyActivity.length - 1;

            return (
              <div
                key={week.week}
                className="flex-1 flex flex-col items-center gap-1"
                title={`Week of ${new Date(week.week).toLocaleDateString()}: ${week.entries} entries, ${week.wordCount} words`}
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    week.entries > 0
                      ? isCurrentWeek
                        ? 'bg-amber-500'
                        : 'bg-zinc-600'
                      : 'bg-zinc-800'
                  }`}
                  style={{ height: `${height}%`, minHeight: week.entries > 0 ? '8px' : '4px' }}
                />
                <span className="text-xs text-gray-600">
                  {week.entries > 0 ? week.entries : '-'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>8 weeks ago</span>
          <span>This week</span>
        </div>
      </div>

      {/* Mood Distribution */}
      {data.moodDistribution.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Emotional Landscape
          </h3>

          <div className="space-y-3">
            {data.moodDistribution.slice(0, 5).map((mood) => {
              const colors = MOOD_COLORS[mood.mood] || { bg: 'bg-zinc-700', text: 'text-gray-400' };
              const label = MOOD_LABELS[mood.mood] || mood.mood;

              return (
                <div key={mood.mood} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-400">{label}</div>
                  <div className="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${colors.bg} flex items-center justify-end px-2 transition-all`}
                      style={{ width: `${mood.percentage}%` }}
                    >
                      {mood.percentage >= 20 && (
                        <span className={`text-xs ${colors.text}`}>{mood.percentage}%</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs text-gray-500">
                    {mood.count} {mood.count === 1 ? 'time' : 'times'}
                  </div>
                </div>
              );
            })}
          </div>

          {data.dominantMood && (
            <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-zinc-800">
              {data.dominantMood === 'peaceful' || data.dominantMood === 'grateful' || data.dominantMood === 'hopeful'
                ? `${MOOD_LABELS[data.dominantMood]} appears most often in your entries. Notice what brings this forward.`
                : data.dominantMood === 'anxious' || data.dominantMood === 'confused'
                ? `${MOOD_LABELS[data.dominantMood]} comes up frequently. Journaling about it is a form of processing.`
                : data.dominantMood === 'sad' || data.dominantMood === 'angry'
                ? `${MOOD_LABELS[data.dominantMood]} is present in your writing. Acknowledging it takes courage.`
                : `You often write with a ${MOOD_LABELS[data.dominantMood] || data.dominantMood} mindset.`}
            </p>
          )}
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-lg font-light text-white">{data.entriesThisMonth}</div>
          <div className="text-xs text-gray-500">entries this month</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-lg font-light text-white">{data.promptUsagePercent}%</div>
          <div className="text-xs text-gray-500">used prompts</div>
        </div>
        {data.longestEntry && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 col-span-2">
            <div className="text-lg font-light text-white">
              {data.longestEntry.wordCount} words
            </div>
            <div className="text-xs text-gray-500">
              your longest entry ({new Date(data.longestEntry.date).toLocaleDateString()})
            </div>
          </div>
        )}
      </div>

      {/* Writing streak */}
      {data.writingStreak > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-light text-amber-500">{data.writingStreak}</div>
            <div>
              <div className="text-sm text-gray-300">
                {data.writingStreak === 1 ? 'day' : 'days'} of writing
              </div>
              <div className="text-xs text-gray-500">
                Keep showing up for yourself
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
