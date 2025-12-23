/**
 * Today's Focus API
 * Returns personalized daily recommendations based on health state
 * Combines practice, article, and course recommendations with a daily intention
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import { getOrCreateHealth, type Pillar, type SpectrumStage, PILLAR_INFO } from '@/lib/integration-health';
import { getAllPractices, type Practice } from '@/lib/practices';
import { getAllPosts, type Post } from '@/lib/posts';
import { getAllCourses, type Course } from '@/lib/courses';

// Daily intentions based on stage
const STAGE_INTENTIONS: Record<SpectrumStage, string[]> = {
  collapse: [
    'Today is for rest and gentle return. No pressure to perform.',
    'One small act of self-care is enough for today.',
    'Your only job today is to be gentle with yourself.',
    'This difficult season will pass. Today, just breathe.',
  ],
  regulation: [
    'Today, notice what helps you feel steady.',
    'Small consistent steps build lasting change.',
    'Focus on what you can control right now.',
    'Your practice today is presence, not perfection.',
  ],
  integration: [
    'Today, let different parts of yourself collaborate.',
    'The work you\'ve done is taking root. Keep going.',
    'Notice the growing ease in your practice.',
    'Integration happens in the quiet moments between efforts.',
  ],
  embodiment: [
    'Let your body lead today. It knows the way.',
    'Your practice is becoming who you are.',
    'Express what you\'ve learned through action.',
    'The wisdom is in you now. Trust it.',
  ],
  optimization: [
    'Today, explore your edges with curiosity.',
    'Mastery is found in the subtleties.',
    'Share what you\'ve learned. Teaching deepens understanding.',
    'What new territory calls to you?',
  ],
};

// Pillar-specific focuses
const PILLAR_FOCUSES: Record<Pillar, { theme: string; actions: string[] }> = {
  mind: {
    theme: 'Mental Clarity',
    actions: [
      'Notice your thoughts without attaching to them',
      'Journal for 5 minutes about what\'s on your mind',
      'Practice observing your inner dialogue',
      'Challenge one limiting belief today',
    ],
  },
  body: {
    theme: 'Body Connection',
    actions: [
      'Take 3 conscious breaths right now',
      'Move your body in a way that feels good',
      'Notice where you hold tension',
      'Eat one meal with full attention',
    ],
  },
  soul: {
    theme: 'Soul Nourishment',
    actions: [
      'Spend time in stillness today',
      'Ask yourself: what truly matters?',
      'Connect with something larger than yourself',
      'Follow a moment of inspiration',
    ],
  },
  relationships: {
    theme: 'Relational Presence',
    actions: [
      'Listen without planning your response',
      'Express genuine appreciation to someone',
      'Notice your patterns in interactions',
      'Practice boundaries with compassion',
    ],
  },
};

function getDailyIntention(stage: SpectrumStage): string {
  const intentions = STAGE_INTENTIONS[stage];
  // Use date to create consistent daily selection
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return intentions[dayOfYear % intentions.length];
}

function getPillarFocus(pillar: Pillar): { theme: string; action: string } {
  const focus = PILLAR_FOCUSES[pillar];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return {
    theme: focus.theme,
    action: focus.actions[dayOfYear % focus.actions.length],
  };
}

// Time of day for practice recommendations
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Categories appropriate for each time of day
const TIME_APPROPRIATE_CATEGORIES: Record<TimeOfDay, string[]> = {
  morning: ['breathwork', 'meditation', 'movement', 'journaling'],
  afternoon: ['breathwork', 'grounding', 'somatic', 'movement'],
  evening: ['meditation', 'journaling', 'grounding', 'shadow-work'],
  night: ['meditation', 'grounding'],
};

export async function GET(request: Request) {
  // Get timezone from query params (client sends it)
  const { searchParams } = new URL(request.url);
  const timezoneOffset = parseInt(searchParams.get('tzOffset') || '0', 10);

  // Calculate user's local hour
  const now = new Date();
  const userLocalHour = new Date(now.getTime() - timezoneOffset * 60000).getUTCHours();
  const currentTimeOfDay = getTimeOfDay(userLocalHour);
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all data in parallel
    const [profile, courseProgress, articleProgress, checkIns, health] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          interests: true,
          currentChallenges: true,
          depthPreference: true,
        },
      }),
      prisma.courseProgress.findMany({
        where: { userId: session.user.id },
        select: { courseSlug: true, moduleSlug: true, completed: true },
      }),
      prisma.articleProgress.findMany({
        where: { userId: session.user.id },
        select: { slug: true, completed: true },
      }),
      prisma.integrationCheckIn.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      getOrCreateHealth(session.user.id).catch(() => null),
    ]);

    // Parse profile data
    const interests: string[] = safeJsonParse(profile?.interests, []);
    const challenges: string[] = safeJsonParse(profile?.currentChallenges, []);

    // Aggregate course progress by course
    const courseProgressMap = new Map<string, { total: number; completed: number }>();
    for (const cp of courseProgress) {
      const existing = courseProgressMap.get(cp.courseSlug) || { total: 0, completed: 0 };
      existing.total++;
      if (cp.completed) existing.completed++;
      courseProgressMap.set(cp.courseSlug, existing);
    }

    // Get in-progress courses (started but not all modules completed)
    const inProgressCourses: Array<{ slug: string; progress: number }> = [];
    for (const [slug, data] of courseProgressMap.entries()) {
      if (data.completed > 0 && data.completed < data.total) {
        inProgressCourses.push({
          slug,
          progress: (data.completed / data.total) * 100,
        });
      }
    }

    // Determine overall state
    let overallStage: SpectrumStage = 'regulation';
    let lowestPillar: Pillar = 'mind';
    let inCollapse = false;

    if (health) {
      overallStage = health.overall.stage;
      const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
      let lowestScore = 100;
      for (const pillar of pillars) {
        if (health.pillars[pillar].score < lowestScore) {
          lowestScore = health.pillars[pillar].score;
          lowestPillar = pillar;
        }
        if (health.pillars[pillar].stage === 'collapse') {
          inCollapse = true;
        }
      }
    }

    // Get daily intention
    const intention = getDailyIntention(overallStage);

    // Get pillar focus
    const pillarFocus = getPillarFocus(lowestPillar);

    // Get one recommended practice
    const practices = getAllPractices();
    let recommendedPractice: Practice | null = null;

    // Filter practices by stage-appropriate intensity
    const appropriateIntensities: Record<SpectrumStage, string[]> = {
      collapse: ['gentle'],
      regulation: ['gentle', 'moderate'],
      integration: ['gentle', 'moderate', 'activating'],
      embodiment: ['moderate', 'activating'],
      optimization: ['moderate', 'activating', 'intense'],
    };

    // Inner need takes priority over time of day
    // Only use time as a gentle tiebreaker when user is stable
    const skipTimeBoosts = inCollapse || (overallStage === 'regulation');
    const timeCategories = TIME_APPROPRIATE_CATEGORIES[currentTimeOfDay];

    // Score practices - health state is primary, time is secondary
    const scoredPractices = practices
      .filter((p) => appropriateIntensities[overallStage].includes(p.metadata.intensity))
      .map((p) => {
        let score = 0;

        // Lowest pillar match - PRIMARY factor (+20)
        const pillarCategories: Record<Pillar, string[]> = {
          mind: ['meditation', 'journaling', 'shadow-work'],
          body: ['breathwork', 'somatic', 'grounding', 'movement'],
          soul: ['meditation'],
          relationships: ['journaling'],
        };
        if (pillarCategories[lowestPillar]?.includes(p.metadata.category)) {
          score += 20;
        }

        // Grounding practices get boost when user needs stability
        if ((inCollapse || overallStage === 'regulation') && p.metadata.category === 'grounding') {
          score += 15;
        }

        // Time-of-day match - ONLY as tiebreaker when stable (+5 max)
        if (!skipTimeBoosts) {
          const practiceTimeOfDay = p.metadata.bestFor?.timeOfDay;
          if (practiceTimeOfDay?.includes(currentTimeOfDay)) {
            score += 5;
          } else if (timeCategories.includes(p.metadata.category)) {
            score += 3;
          }
        }

        // Quick practices slightly preferred
        if (p.metadata.duration === 'quick') {
          score += 3;
        }

        return { practice: p, score };
      })
      .sort((a, b) => b.score - a.score);

    if (scoredPractices.length > 0) {
      // Pick from top practices with some daily variation
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      const topPractices = scoredPractices.slice(0, Math.min(3, scoredPractices.length));
      recommendedPractice = topPractices[dayOfYear % topPractices.length].practice;
    }

    // Get in-progress course to continue
    let continueContent: {
      type: 'course' | 'article';
      slug: string;
      title: string;
      progress?: number;
    } | null = null;

    if (inProgressCourses.length > 0) {
      const allCourses = getAllCourses();
      const courseToResume = inProgressCourses[0];
      const course = allCourses.find((c) => c.slug === courseToResume.slug);
      if (course) {
        continueContent = {
          type: 'course',
          slug: course.slug,
          title: course.metadata.title,
          progress: courseToResume.progress,
        };
      }
    }

    // Get recent check-in streak
    const hasCheckedInToday = checkIns.some((c) => {
      const today = new Date();
      const checkInDate = new Date(c.createdAt);
      return checkInDate.toDateString() === today.toDateString();
    });

    // Calculate streak (consecutive days)
    let streak = 0;
    const sortedCheckIns = checkIns.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (sortedCheckIns.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const hasCheckIn = sortedCheckIns.some((c) => {
          const cDate = new Date(c.createdAt);
          return cDate.toDateString() === checkDate.toDateString();
        });
        if (hasCheckIn) {
          streak++;
        } else if (i > 0) {
          // If not today and gap found, break
          break;
        }
      }
    }

    // Build response
    const response = {
      date: new Date().toISOString().split('T')[0],
      greeting: getTimeBasedGreeting(userLocalHour),
      timeOfDay: currentTimeOfDay,
      intention,
      focus: {
        pillar: lowestPillar,
        pillarName: PILLAR_INFO[lowestPillar].name,
        theme: pillarFocus.theme,
        action: pillarFocus.action,
      },
      practice: recommendedPractice
        ? {
            slug: recommendedPractice.slug,
            title: recommendedPractice.metadata.title,
            description: recommendedPractice.metadata.description,
            duration: recommendedPractice.metadata.durationMinutes,
          }
        : null,
      continueContent,
      checkIn: {
        hasCheckedInToday,
        streak,
        prompt: hasCheckedInToday
          ? 'You\'ve already checked in today. Keep going!'
          : 'How are you feeling right now?',
      },
      health: health
        ? {
            stage: overallStage,
            inCollapse,
            lowestPillar,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating today\'s focus:', error);
    return NextResponse.json(
      { error: 'Failed to generate today\'s focus' },
      { status: 500 }
    );
  }
}

function getTimeBasedGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}
