/**
 * Profile Timeline API
 *
 * Returns user's activity history for the progress timeline display.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface TimelineEvent {
  id: string;
  type: 'assessment' | 'course' | 'article' | 'practice' | 'milestone' | 'check-in';
  title: string;
  description?: string;
  date: string;
  pillar?: string;
  impact?: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, unknown>;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events: TimelineEvent[] = [];

    // Fetch completed articles
    const articleProgress = await prisma.articleProgress.findMany({
      where: {
        userId: session.user.id,
        completed: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    for (const progress of articleProgress) {
      if (progress.completedAt) {
        events.push({
          id: `article-${progress.slug}`,
          type: 'article',
          title: formatSlugToTitle(progress.slug),
          date: progress.completedAt.toISOString(),
        });
      }
    }

    // Fetch completed course modules
    const courseProgress = await prisma.courseProgress.findMany({
      where: {
        userId: session.user.id,
        completed: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    // Group by course
    const courseGroups = new Map<string, { count: number; latestDate: Date }>();
    for (const progress of courseProgress) {
      if (progress.completedAt) {
        const existing = courseGroups.get(progress.courseSlug);
        if (existing) {
          existing.count++;
          if (progress.completedAt > existing.latestDate) {
            existing.latestDate = progress.completedAt;
          }
        } else {
          courseGroups.set(progress.courseSlug, {
            count: 1,
            latestDate: progress.completedAt,
          });
        }
      }
    }

    for (const [courseSlug, data] of courseGroups) {
      events.push({
        id: `course-${courseSlug}`,
        type: 'course',
        title: formatSlugToTitle(courseSlug),
        description: `${data.count} module${data.count > 1 ? 's' : ''} completed`,
        date: data.latestDate.toISOString(),
      });
    }

    // Fetch assessment results
    const assessments = await prisma.assessmentResult.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const assessment of assessments) {
      events.push({
        id: `assessment-${assessment.id}`,
        type: 'assessment',
        title: `${assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)} Assessment`,
        description: 'Completed assessment',
        date: assessment.createdAt.toISOString(),
      });
    }

    // Fetch check-ins
    const checkIns = await prisma.quickCheckIn.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const checkIn of checkIns) {
      events.push({
        id: `checkin-${checkIn.id}`,
        type: 'check-in',
        title: 'Daily Check-in',
        date: checkIn.createdAt.toISOString(),
      });
    }

    // Fetch recent journal entries
    const journals = await prisma.journalEntry.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const journal of journals) {
      events.push({
        id: `journal-${journal.id}`,
        type: 'milestone',
        title: journal.title || 'Journal Entry',
        description: 'Journal reflection',
        date: journal.createdAt.toISOString(),
      });
    }

    // Sort all events by date (most recent first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      events: events.slice(0, 50),
      total: events.length,
    });
  } catch (error) {
    console.error('Timeline GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
