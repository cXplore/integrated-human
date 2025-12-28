import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface HealthNudge {
  id: string;
  type: 'reassessment' | 'engagement' | 'opportunity' | 'insight' | 'milestone' | 'streak';
  urgency: 'light' | 'gentle' | 'moderate' | 'important';
  title: string;
  message: string;
  cta: string;
  slug: string;
  dismissable: boolean;
  expiresAt?: Date;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * GET /api/user/health-nudges
 * Get proactive nudges to encourage user engagement and growth
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const nudges: HealthNudge[] = [];

  try {
    // 1. Check assessment freshness
    const assessments = await prisma.assessmentResult.findMany({
      where: { userId },
      select: { type: true, updatedAt: true },
    });

    for (const a of assessments) {
      const age = daysSince(a.updatedAt);
      const typeLabel = a.type.charAt(0).toUpperCase() + a.type.slice(1).replace('-', ' ');

      if (age > 90) {
        nudges.push({
          id: `reassess-${a.type}-expired`,
          type: 'reassessment',
          urgency: 'moderate',
          title: 'Time for a check-in',
          message: `Your ${typeLabel} assessment is over 90 days old. You've likely grown since then.`,
          cta: 'Reassess Now',
          slug: `/assessment?type=${a.type}`,
          dismissable: true,
        });
      } else if (age > 60) {
        nudges.push({
          id: `reassess-${a.type}-aging`,
          type: 'reassessment',
          urgency: 'gentle',
          title: 'Curious how you\'ve grown?',
          message: `It's been ${age} days since your ${typeLabel} assessment. Patterns shift over time.`,
          cta: 'Take Reassessment',
          slug: `/assessment?type=${a.type}`,
          dismissable: true,
        });
      }
    }

    // 2. Check journal engagement
    const lastJournal = await prisma.journalEntry.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (lastJournal) {
      const journalAge = daysSince(lastJournal.createdAt);
      if (journalAge > 14) {
        nudges.push({
          id: 'journal-inactive',
          type: 'engagement',
          urgency: 'gentle',
          title: 'Your journal is waiting',
          message: `It's been ${journalAge} days since you wrote. Even a few sentences can help.`,
          cta: 'Write Now',
          slug: '/profile/journal',
          dismissable: true,
        });
      }
    } else {
      // Never journaled
      nudges.push({
        id: 'journal-start',
        type: 'engagement',
        urgency: 'light',
        title: 'Start your journal',
        message: 'Journaling helps you process and track your growth over time.',
        cta: 'Begin Writing',
        slug: '/profile/journal',
        dismissable: true,
      });
    }

    // 3. Check daily check-in streak
    const recentCheckIns = await prisma.quickCheckIn.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentCheckIns.length === 0) {
      nudges.push({
        id: 'checkin-prompt',
        type: 'engagement',
        urgency: 'light',
        title: 'How are you today?',
        message: 'Quick check-ins help track your wellbeing over time.',
        cta: 'Check In',
        slug: '/profile/health',
        dismissable: true,
      });
    } else if (recentCheckIns.length >= 5) {
      // Streak celebration
      nudges.push({
        id: 'checkin-streak',
        type: 'streak',
        urgency: 'light',
        title: 'You\'re building a habit!',
        message: `${recentCheckIns.length} check-ins this week. Consistency builds awareness.`,
        cta: 'Keep Going',
        slug: '/profile/health',
        dismissable: true,
      });
    }

    // 4. Check for growth opportunities based on dimension estimates
    const dimensionEstimates = await prisma.dimensionEstimate.findMany({
      where: { userId },
      orderBy: { estimatedScore: 'desc' },
      take: 3,
    });

    const dimensionHealth = await prisma.dimensionHealth.findMany({
      where: { userId },
    });

    // Find dimensions where estimated > verified (showing growth)
    for (const estimate of dimensionEstimates) {
      const verified = dimensionHealth.find(
        d => d.pillarId === estimate.pillarId && d.dimensionId === estimate.dimensionId
      );

      if (verified && estimate.estimatedScore > verified.verifiedScore + 15) {
        nudges.push({
          id: `growth-${estimate.pillarId}-${estimate.dimensionId}`,
          type: 'opportunity',
          urgency: 'light',
          title: 'You may have grown',
          message: `Your activity suggests growth in ${estimate.dimensionId.replace(/-/g, ' ')}. Verify with a reassessment?`,
          cta: 'Reassess Dimension',
          slug: `/assessment/reassess/${estimate.pillarId}/${estimate.dimensionId}`,
          dismissable: true,
        });
        break; // Only one of these at a time
      }
    }

    // 5. Check for conversation insights
    const unacknowledgedInsights = await prisma.conversationInsight.findMany({
      where: {
        userId,
        acknowledged: false,
        strength: { gte: 5 },
      },
      orderBy: { strength: 'desc' },
      take: 1,
    });

    for (const insight of unacknowledgedInsights) {
      nudges.push({
        id: `insight-${insight.id}`,
        type: 'insight',
        urgency: 'light',
        title: 'Pattern noticed',
        message: insight.insight.slice(0, 100) + (insight.insight.length > 100 ? '...' : ''),
        cta: 'View Insights',
        slug: '/profile/ai-insights',
        dismissable: true,
      });
    }

    // 6. Check for course completion opportunities
    const inProgressCourses = await prisma.courseProgress.groupBy({
      by: ['courseSlug'],
      where: {
        userId,
        completed: false,
      },
      _count: true,
    });

    const completedCourses = await prisma.certificate.findMany({
      where: { userId },
      select: { courseSlug: true },
    });

    const completedSlugs = new Set(completedCourses.map(c => c.courseSlug));

    for (const course of inProgressCourses.slice(0, 1)) {
      if (!completedSlugs.has(course.courseSlug)) {
        nudges.push({
          id: `course-continue-${course.courseSlug}`,
          type: 'engagement',
          urgency: 'light',
          title: 'Continue your course',
          message: `You have progress in "${course.courseSlug.replace(/-/g, ' ')}".`,
          cta: 'Continue',
          slug: `/courses/${course.courseSlug}`,
          dismissable: true,
        });
      }
    }

    // 7. Milestone celebrations
    const totalJournalEntries = await prisma.journalEntry.count({
      where: { userId },
    });

    const milestones = [10, 25, 50, 100, 250, 500];
    for (const milestone of milestones) {
      if (totalJournalEntries >= milestone && totalJournalEntries < milestone + 5) {
        nudges.push({
          id: `milestone-journal-${milestone}`,
          type: 'milestone',
          urgency: 'light',
          title: 'Milestone reached!',
          message: `You've written ${milestone}+ journal entries. That's real commitment to growth.`,
          cta: 'Celebrate',
          slug: '/profile/journal',
          dismissable: true,
        });
        break;
      }
    }

    // Sort nudges by urgency (important first)
    const urgencyOrder = { important: 0, moderate: 1, gentle: 2, light: 3 };
    nudges.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // Limit to top 3 nudges to avoid overwhelm
    const topNudges = nudges.slice(0, 3);

    return NextResponse.json({
      nudges: topNudges,
      totalAvailable: nudges.length,
    });
  } catch (error) {
    console.error('Error fetching health nudges:', error);
    return NextResponse.json({ error: 'Failed to fetch nudges' }, { status: 500 });
  }
}

/**
 * POST /api/user/health-nudges
 * Dismiss a nudge
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { nudgeId, action } = await request.json();

    if (action === 'dismiss') {
      // For insight nudges, mark as acknowledged
      if (nudgeId.startsWith('insight-')) {
        const insightId = nudgeId.replace('insight-', '');
        await prisma.conversationInsight.update({
          where: { id: insightId },
          data: { acknowledged: true },
        });
      }

      // For other nudges, we could store dismissals in a separate table
      // For now, just return success - they'll naturally expire or reappear
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling nudge action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
