import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  recentEntries?: Array<{
    content: string;
    mood: string | null;
    createdAt: string;
  }>;
  frequentWords?: Array<{ word: string; count: number }>;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch all journal entries
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      mood: true,
      promptId: true,
      createdAt: true,
    },
  });

  if (entries.length === 0) {
    return NextResponse.json({
      totalEntries: 0,
      totalWords: 0,
      averageWordsPerEntry: 0,
      entriesThisMonth: 0,
      moodDistribution: [],
      dominantMood: null,
      weeklyActivity: [],
      writingStreak: 0,
      longestEntry: null,
      promptUsagePercent: 0,
      activeDays: 0,
      firstEntryDate: null,
    });
  }

  // Calculate word counts
  const wordCounts = entries.map((e) => ({
    date: e.createdAt,
    wordCount: e.content.split(/\s+/).filter(Boolean).length,
  }));

  const totalWords = wordCounts.reduce((sum, w) => sum + w.wordCount, 0);
  const averageWordsPerEntry = Math.round(totalWords / entries.length);

  // Find longest entry
  const longestEntryData = wordCounts.reduce(
    (max, curr) => (curr.wordCount > max.wordCount ? curr : max),
    wordCounts[0]
  );
  const longestEntry = {
    date: longestEntryData.date.toISOString().split("T")[0],
    wordCount: longestEntryData.wordCount,
  };

  // Entries this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const entriesThisMonth = entries.filter(
    (e) => new Date(e.createdAt) >= startOfMonth
  ).length;

  // Mood distribution
  const moodCounts = new Map<string, number>();
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts.set(e.mood, (moodCounts.get(e.mood) || 0) + 1);
    }
  });

  const entriesWithMood = entries.filter((e) => e.mood).length;
  const moodDistribution: MoodCount[] = Array.from(moodCounts.entries())
    .map(([mood, count]) => ({
      mood,
      count,
      percentage:
        entriesWithMood > 0 ? Math.round((count / entriesWithMood) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const dominantMood =
    moodDistribution.length > 0 ? moodDistribution[0].mood : null;

  // Weekly activity (last 8 weeks)
  const weeklyActivity: WeeklyActivity[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekEntries = entries.filter((e) => {
      const entryDate = new Date(e.createdAt);
      return entryDate >= weekStart && entryDate < weekEnd;
    });

    const weekWords = weekEntries.reduce(
      (sum, e) => sum + e.content.split(/\s+/).filter(Boolean).length,
      0
    );

    weeklyActivity.push({
      week: weekStart.toISOString().split("T")[0],
      entries: weekEntries.length,
      wordCount: weekWords,
    });
  }

  // Calculate writing streak (consecutive days with entries)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entryDates = new Set(
    entries.map((e) => new Date(e.createdAt).toISOString().split("T")[0])
  );

  let writingStreak = 0;
  const todayKey = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  // Only count streak if there's activity today or yesterday
  if (entryDates.has(todayKey) || entryDates.has(yesterdayKey)) {
    const checkDate = new Date(entryDates.has(todayKey) ? today : yesterday);

    while (true) {
      const dateKey = checkDate.toISOString().split("T")[0];
      if (entryDates.has(dateKey)) {
        writingStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Prompt usage
  const entriesWithPrompt = entries.filter((e) => e.promptId).length;
  const promptUsagePercent =
    entries.length > 0
      ? Math.round((entriesWithPrompt / entries.length) * 100)
      : 0;

  // Active days
  const activeDays = entryDates.size;

  // First entry date
  const firstEntryDate =
    entries.length > 0
      ? entries[entries.length - 1].createdAt.toISOString().split("T")[0]
      : null;

  const insights: InsightsData = {
    totalEntries: entries.length,
    totalWords,
    averageWordsPerEntry,
    entriesThisMonth,
    moodDistribution,
    dominantMood,
    weeklyActivity,
    writingStreak,
    longestEntry,
    promptUsagePercent,
    activeDays,
    firstEntryDate,
  };

  // Include recent entries for AI pattern analysis if requested
  const { searchParams } = new URL(request.url);
  const includeEntries = searchParams.get('includeEntries') === 'true';

  if (includeEntries) {
    // Get recent entries (last 10)
    insights.recentEntries = entries.slice(0, 10).map(e => ({
      content: e.content.slice(0, 1000), // Limit content length
      mood: e.mood,
      createdAt: e.createdAt.toISOString(),
    }));

    // Calculate frequent words (excluding common words)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'it', 'its', 'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your',
      'he', 'she', 'him', 'her', 'his', 'they', 'them', 'their', 'this',
      'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where',
      'how', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than',
      'too', 'very', 'just', 'about', 'also', 'back', 'even', 'still',
      'after', 'before', 'because', 'if', 'into', 'through', 'during',
      'out', 'up', 'down', 'then', 'once', 'here', 'there', 'any', 'now',
      'get', 'got', 'like', 'know', 'think', 'feel', 'really', 'want',
      'going', 'see', 'make', 'time', 'way', 'thing', 'things', 'much',
      'something', 'anything', 'lot', 'getting', 'being', 'doing', 'day',
    ]);

    const wordFrequency = new Map<string, number>();
    entries.forEach(e => {
      const words = e.content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      words.forEach(word => {
        if (!stopWords.has(word)) {
          wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
        }
      });
    });

    insights.frequentWords = Array.from(wordFrequency.entries())
      .filter(([, count]) => count >= 3) // Only words appearing 3+ times
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  return NextResponse.json(insights);
}
