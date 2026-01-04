'use client';

import { useEffect, useState, useRef } from 'react';

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

interface MoodTimelineEntry {
  date: string;
  mood: string;
}

interface InsightsData {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  entriesThisMonth: number;
  moodDistribution: MoodCount[];
  dominantMood: string | null;
  weeklyActivity: WeeklyActivity[];
  moodTimeline: MoodTimelineEntry[];
  writingStreak: number;
  longestEntry: { date: string; wordCount: number } | null;
  promptUsagePercent: number;
  activeDays: number;
  firstEntryDate: string | null;
  // New fields for pattern suggestions
  recentEntries?: Array<{
    content: string;
    mood: string | null;
    createdAt: string;
  }>;
  frequentWords?: Array<{ word: string; count: number }>;
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

// Mood valence for timeline visualization (0-100 scale, 50 = neutral)
const MOOD_VALENCE: Record<string, number> = {
  peaceful: 85,
  grateful: 90,
  curious: 70,
  hopeful: 80,
  confused: 45,
  anxious: 30,
  sad: 25,
  angry: 20,
};

// Dot colors for timeline
const MOOD_DOT_COLORS: Record<string, string> = {
  peaceful: 'bg-blue-400',
  grateful: 'bg-green-400',
  curious: 'bg-purple-400',
  hopeful: 'bg-amber-400',
  confused: 'bg-orange-400',
  anxious: 'bg-yellow-400',
  sad: 'bg-gray-400',
  angry: 'bg-red-400',
};

export default function JournalInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI pattern suggestions state
  const [patternSuggestions, setPatternSuggestions] = useState<string>('');
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const patternRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/journal/insights?includeEntries=true');
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

  // Request AI pattern suggestions
  const requestPatternSuggestions = async () => {
    if (!data || data.totalEntries < 3) return;

    setPatternSuggestions('');
    setLoadingPatterns(true);

    try {
      const res = await fetch('/api/journal/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodDistribution: data.moodDistribution,
          recentEntries: data.recentEntries?.slice(0, 10),
          frequentWords: data.frequentWords,
          totalEntries: data.totalEntries,
          writingStreak: data.writingStreak,
          dominantMood: data.dominantMood,
        }),
      });

      if (res.status === 402) {
        const errorData = await res.json();
        setPatternSuggestions(`Insufficient credits. You need ${errorData.required} credits but have ${errorData.available}. Visit your profile to purchase more.`);
        setLoadingPatterns(false);
        return;
      }

      if (!res.ok) {
        setPatternSuggestions('Unable to analyze patterns at this time. Please try again later.');
        setLoadingPatterns(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullSuggestions = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                fullSuggestions += parsed.content;
                setPatternSuggestions(fullSuggestions);
                // Auto-scroll
                if (patternRef.current) {
                  patternRef.current.scrollTop = patternRef.current.scrollHeight;
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting pattern suggestions:', error);
      setPatternSuggestions('Failed to get pattern suggestions. Please try again.');
    } finally {
      setLoadingPatterns(false);
    }
  };

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

      {/* Mood Timeline */}
      {data.moodTimeline.length >= 3 && (
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Mood Journey
          </h3>

          {/* Timeline chart */}
          <div className="relative h-32 mb-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-600 pr-2">
              <span>Uplifted</span>
              <span>Neutral</span>
              <span>Heavy</span>
            </div>

            {/* Chart area */}
            <div className="ml-16 h-full relative">
              {/* Horizontal guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-zinc-800 border-dashed" />
                <div className="border-t border-zinc-700" />
                <div className="border-t border-zinc-800 border-dashed" />
              </div>

              {/* Data points and line */}
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                {/* Connecting line */}
                <polyline
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.3)"
                  strokeWidth="2"
                  points={data.moodTimeline.map((entry, i) => {
                    const x = (i / (data.moodTimeline.length - 1)) * 100;
                    const y = 100 - (MOOD_VALENCE[entry.mood] || 50);
                    return `${x}%,${y}%`;
                  }).join(' ')}
                />
              </svg>

              {/* Data point dots */}
              <div className="absolute inset-0 flex justify-between items-start">
                {data.moodTimeline.map((entry, i) => {
                  const valence = MOOD_VALENCE[entry.mood] || 50;
                  const dotColor = MOOD_DOT_COLORS[entry.mood] || 'bg-gray-400';
                  const label = MOOD_LABELS[entry.mood] || entry.mood;

                  return (
                    <div
                      key={`${entry.date}-${i}`}
                      className="relative group"
                      style={{ top: `${100 - valence}%` }}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${dotColor} cursor-pointer transition-transform hover:scale-150`}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="font-medium text-white">{label}</div>
                        <div className="text-gray-400">{new Date(entry.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="ml-16 flex justify-between text-xs text-gray-600">
            <span>{new Date(data.moodTimeline[0]?.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(data.moodTimeline[data.moodTimeline.length - 1]?.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap gap-3">
              {Object.entries(MOOD_DOT_COLORS).map(([mood, color]) => (
                <div key={mood} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-gray-500">{MOOD_LABELS[mood]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend insight */}
          {data.moodTimeline.length >= 5 && (() => {
            const recentAvg = data.moodTimeline.slice(-3).reduce((sum, e) => sum + (MOOD_VALENCE[e.mood] || 50), 0) / 3;
            const olderAvg = data.moodTimeline.slice(0, 3).reduce((sum, e) => sum + (MOOD_VALENCE[e.mood] || 50), 0) / 3;
            const trend = recentAvg - olderAvg;

            if (Math.abs(trend) < 10) return null;

            return (
              <p className="text-sm text-gray-500 mt-3">
                {trend > 0
                  ? 'Your recent entries show a lift in mood. Something is shifting.'
                  : 'Your recent entries feel heavier. Be gentle with yourself.'}
              </p>
            );
          })()}
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

      {/* AI Pattern Suggestions */}
      {data.totalEntries >= 3 && (
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            AI Pattern Analysis
          </h3>

          {patternSuggestions || loadingPatterns ? (
            <div className="space-y-4">
              <div
                ref={patternRef}
                className="prose prose-invert prose-zinc max-w-none bg-zinc-800/50 p-4 rounded max-h-80 overflow-y-auto"
              >
                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {patternSuggestions}
                  {loadingPatterns && <span className="animate-pulse">|</span>}
                </p>
              </div>
              {!loadingPatterns && (
                <button
                  onClick={requestPatternSuggestions}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Get new analysis (5 credits)
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500 text-sm">
                Get personalized insights about themes, patterns, and growth opportunities based on your journal entries.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={requestPatternSuggestions}
                  disabled={loadingPatterns}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analyze My Patterns (5 credits)
                </button>
                <span className="text-xs text-gray-600">
                  Based on {data.totalEntries} entries
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
