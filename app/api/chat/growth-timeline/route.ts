import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface TimelineEntry {
  period: string;
  startDate: string;
  endDate: string;
  themes: string[];
  moods: { dominant: string; trend: 'improving' | 'stable' | 'declining' };
  highlights: string[];
  conversationCount: number;
  journalCount: number;
  dreamCount: number;
}

/**
 * GET /api/chat/growth-timeline
 * Get user's growth timeline - what they were working on over time
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('period') || 'week'; // week, month
    const lookback = parseInt(searchParams.get('lookback') || '4'); // number of periods

    const userId = session.user.id;
    const now = new Date();
    const timeline: TimelineEntry[] = [];

    for (let i = 0; i < lookback; i++) {
      let startDate: Date;
      let endDate: Date;
      let periodLabel: string;

      if (periodType === 'week') {
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        periodLabel = i === 0 ? 'This week' : i === 1 ? 'Last week' : `${i} weeks ago`;
      } else {
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() - i);
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        periodLabel = i === 0 ? 'This month' : i === 1 ? 'Last month' : `${i} months ago`;
      }

      // Fetch data for this period
      const [conversations, journals, dreams, checkIns] = await Promise.all([
        // Conversations with tags
        prisma.chatConversation.findMany({
          where: {
            userId,
            updatedAt: { gte: startDate, lte: endDate },
          },
          select: { tags: true, title: true },
        }),
        // Journal entries
        prisma.journalEntry.findMany({
          where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          },
          select: { tags: true, mood: true, title: true },
        }),
        // Dreams
        prisma.dreamEntry.findMany({
          where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          },
          select: { symbols: true, emotions: true, title: true },
        }),
        // Check-ins
        prisma.quickCheckIn.findMany({
          where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          },
          select: { mood: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      // Extract themes from conversations and journals
      const allTags: string[] = [];
      conversations.forEach(c => {
        if (c.tags) {
          try {
            const tags = JSON.parse(c.tags);
            allTags.push(...tags);
          } catch { /* skip */ }
        }
      });
      journals.forEach(j => {
        if (j.tags) {
          try {
            const tags = JSON.parse(j.tags);
            allTags.push(...tags);
          } catch { /* skip */ }
        }
      });

      // Count tag occurrences
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topThemes = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag);

      // Analyze mood trend
      const moods = checkIns.map(c => c.mood);
      let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
      let dominantMood = 'neutral';

      if (moods.length >= 2) {
        const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
        const secondHalf = moods.slice(Math.floor(moods.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.5) moodTrend = 'improving';
        else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining';

        const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
        if (avgMood >= 4) dominantMood = 'good';
        else if (avgMood >= 3) dominantMood = 'okay';
        else if (avgMood >= 2) dominantMood = 'low';
        else dominantMood = 'struggling';
      }

      // Extract highlights (notable entries)
      const highlights: string[] = [];
      journals.slice(0, 2).forEach(j => {
        if (j.title) highlights.push(`Journaled: "${j.title}"`);
      });
      dreams.slice(0, 1).forEach(d => {
        if (d.title) highlights.push(`Dream: "${d.title}"`);
      });

      // Only add period if there's activity
      if (conversations.length > 0 || journals.length > 0 || dreams.length > 0) {
        timeline.push({
          period: periodLabel,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          themes: topThemes,
          moods: { dominant: dominantMood, trend: moodTrend },
          highlights,
          conversationCount: conversations.length,
          journalCount: journals.length,
          dreamCount: dreams.length,
        });
      }
    }

    // Generate AI-accessible summary for the chat
    const summary = generateTimelineSummary(timeline);

    return NextResponse.json({ timeline, summary });
  } catch (error) {
    console.error('Error fetching growth timeline:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}

function generateTimelineSummary(timeline: TimelineEntry[]): string {
  if (timeline.length === 0) {
    return "No activity data available yet.";
  }

  const parts: string[] = [];

  // Current period
  const current = timeline[0];
  if (current) {
    parts.push(`This ${current.period.includes('week') ? 'week' : 'month'}: ${current.themes.length > 0 ? `Working on ${current.themes.join(', ')}` : 'Active but no specific themes'}.`);
    if (current.moods.trend !== 'stable') {
      parts.push(`Mood is ${current.moods.trend}.`);
    }
  }

  // Compare with previous period
  if (timeline.length >= 2) {
    const previous = timeline[1];
    const currentThemes = new Set(current.themes);
    const previousThemes = new Set(previous.themes);

    const continuingThemes = current.themes.filter(t => previousThemes.has(t));
    const newThemes = current.themes.filter(t => !previousThemes.has(t));

    if (continuingThemes.length > 0) {
      parts.push(`Continuing to explore: ${continuingThemes.join(', ')}.`);
    }
    if (newThemes.length > 0) {
      parts.push(`New focus: ${newThemes.join(', ')}.`);
    }
  }

  // Long-term patterns
  if (timeline.length >= 3) {
    const allThemes = timeline.flatMap(t => t.themes);
    const themeCounts = allThemes.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {} as Record<string, number>);
    const recurringThemes = Object.entries(themeCounts)
      .filter(([, count]) => count >= 2)
      .map(([theme]) => theme);

    if (recurringThemes.length > 0) {
      parts.push(`Recurring themes over time: ${recurringThemes.slice(0, 3).join(', ')}.`);
    }
  }

  return parts.join(' ');
}
