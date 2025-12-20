import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface DayActivity {
  date: string;
  articles: number;
  modules: number;
  journals: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get activity from the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Fetch all activity in parallel
  const [articleProgress, courseProgress, journalEntries] = await Promise.all([
    prisma.articleProgress.findMany({
      where: {
        userId,
        updatedAt: { gte: ninetyDaysAgo },
      },
      select: { updatedAt: true },
    }),
    prisma.courseProgress.findMany({
      where: {
        userId,
        updatedAt: { gte: ninetyDaysAgo },
      },
      select: { updatedAt: true },
    }),
    prisma.journalEntry.findMany({
      where: {
        userId,
        updatedAt: { gte: ninetyDaysAgo },
      },
      select: { updatedAt: true },
    }),
  ]);

  // Group activity by date
  const activityByDate = new Map<string, DayActivity>();

  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  articleProgress.forEach(item => {
    const dateKey = getDateKey(item.updatedAt);
    const existing = activityByDate.get(dateKey) || { date: dateKey, articles: 0, modules: 0, journals: 0 };
    existing.articles++;
    activityByDate.set(dateKey, existing);
  });

  courseProgress.forEach(item => {
    const dateKey = getDateKey(item.updatedAt);
    const existing = activityByDate.get(dateKey) || { date: dateKey, articles: 0, modules: 0, journals: 0 };
    existing.modules++;
    activityByDate.set(dateKey, existing);
  });

  journalEntries.forEach(item => {
    const dateKey = getDateKey(item.updatedAt);
    const existing = activityByDate.get(dateKey) || { date: dateKey, articles: 0, modules: 0, journals: 0 };
    existing.journals++;
    activityByDate.set(dateKey, existing);
  });

  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's activity today or yesterday to start the streak
  const todayKey = getDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  const hasActivityToday = activityByDate.has(todayKey);
  const hasActivityYesterday = activityByDate.has(yesterdayKey);

  if (hasActivityToday || hasActivityYesterday) {
    // Count backwards from today (or yesterday if no activity today)
    const startDate = hasActivityToday ? today : yesterday;
    const checkDate = new Date(startDate);

    while (true) {
      const dateKey = getDateKey(checkDate);
      if (activityByDate.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak by checking all dates
  const sortedDates = Array.from(activityByDate.keys()).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Get activity for the last 7 days (for weekly view)
  const weekActivity: DayActivity[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = getDateKey(date);
    weekActivity.push(
      activityByDate.get(dateKey) || { date: dateKey, articles: 0, modules: 0, journals: 0 }
    );
  }

  // Calculate total activity stats
  const totalArticles = articleProgress.length;
  const totalModules = courseProgress.length;
  const totalJournals = journalEntries.length;
  const daysActive = activityByDate.size;

  return NextResponse.json({
    currentStreak,
    longestStreak,
    weekActivity,
    daysActive,
    totalArticles,
    totalModules,
    totalJournals,
    hasActivityToday,
  });
}
