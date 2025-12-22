import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/sanitize";
import { getAllCourses, type Course } from "@/lib/courses";

// Mapping from user interests/challenges to course categories and keywords
const INTEREST_TO_COURSES: Record<string, string[]> = {
  'shadow work': ['shadow-work-foundations', 'the-integrated-self', 'shadow-integration'],
  'nervous system': ['nervous-system-mastery', 'stress-resilience-mastery', 'anxiety-first-aid'],
  'meditation': ['mindfulness-meditation-mastery', 'mindfulness-basics', 'presence-practice'],
  'embodiment': ['movement-fundamentals', 'body-wisdom', 'embodiment-mastery'],
  'relationships': ['conscious-relationship', 'conscious-relationship-mastery', 'attachment-repair'],
  'meaning & purpose': ['life-purpose', 'life-purpose-discovery', 'meaning-and-purpose', 'finding-your-path'],
  'archetypes': ['masculine-initiation', 'feminine-reclamation', 'the-embodied-man'],
  'emotions': ['mastering-emotions', 'emotional-intelligence', 'intro-emotional-intelligence'],
  'spirituality': ['spiritual-development', 'death-contemplation', 'ritual-and-practice'],
  'creativity': ['creativity-and-spirit', 'creative-flow'],
  'masculine/feminine': ['masculine-initiation', 'feminine-reclamation', 'sexuality-and-intimacy'],
  'integration': ['the-integrated-self', 'the-integration-path', 'integration-mastery'],
  'consciousness': ['spiritual-development', 'presence-practice', 'mindfulness-meditation-mastery'],
  'trauma healing': ['trauma-informed-healing', 'healing-inner-child', 'attachment-repair'],
  'inner child': ['healing-inner-child', 'family-systems-healing'],
  'boundaries': ['boundaries', 'people-pleasing-recovery', 'codependency-recovery'],
};

const CHALLENGE_TO_COURSES: Record<string, string[]> = {
  'anxiety': ['anxiety-first-aid', 'anxiety-and-panic', 'breaking-free-anxiety', 'nervous-system-mastery'],
  'depression': ['depression-a-different-approach', 'meaning-and-purpose', 'finding-your-path'],
  'trauma': ['trauma-informed-healing', 'nervous-system-mastery', 'healing-inner-child'],
  'grief': ['grief-and-loss', 'living-after-loss', 'death-contemplation'],
  'relationships': ['conscious-relationship', 'attachment-repair', 'healing-relationships-101'],
  'identity': ['the-integrated-self', 'finding-your-path', 'becoming-who-you-are'],
  'purpose': ['life-purpose-discovery', 'life-purpose', 'finding-your-why', 'career-and-purpose'],
  'anger': ['mastering-emotions', 'shadow-work-foundations'],
  'shame': ['shadow-work-foundations', 'self-worth-foundations', 'healing-inner-child'],
  'addiction': ['addiction-and-compulsion', 'nervous-system-mastery', 'shadow-work-foundations'],
  'loneliness': ['friendship-in-adulthood', 'conscious-dating', 'healing-relationships-101'],
  'stress': ['stress-resilience-mastery', 'nervous-system-mastery', 'mindfulness-basics'],
  'self-worth': ['self-worth-foundations', 'building-authentic-confidence', 'healing-inner-child'],
  'boundaries': ['boundaries', 'people-pleasing-recovery', 'codependency-recovery'],
  'attachment': ['attachment-repair', 'conscious-relationship', 'intimacy-after-trauma'],
  'burnout': ['stress-resilience-mastery', 'sleep-mastery', 'burnout-recovery'],
};

const DEPTH_LEVEL_MAP: Record<string, string[]> = {
  'foundational': ['Beginner', 'All Levels'],
  'intermediate': ['Beginner', 'Intermediate', 'All Levels'],
  'deep': ['Intermediate', 'Advanced', 'All Levels'],
  'advanced': ['Advanced', 'All Levels'],
};

// Use cached courses from lib/courses.ts
function getCachedCourses(): Map<string, Course> {
  const courses = getAllCourses();
  const courseMap = new Map<string, Course>();
  for (const course of courses) {
    courseMap.set(course.slug, course);
  }
  return courseMap;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user profile and progress
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      courseProgress: {
        select: { courseSlug: true, completed: true },
      },
      purchases: {
        select: { courseSlug: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get all available courses (uses cached data from lib/courses)
  const allCourses = getCachedCourses();

  // Get completed and purchased courses
  const completedCourses = new Set(
    user.courseProgress.filter(cp => cp.completed).map(cp => cp.courseSlug)
  );
  const purchasedCourses = new Set(user.purchases.map(p => p.courseSlug));
  const startedCourses = new Set(user.courseProgress.map(cp => cp.courseSlug));

  // Parse profile data
  const profile = user.profile;
  const interests: string[] = safeJsonParse(profile?.interests, []);
  const challenges: string[] = safeJsonParse(profile?.currentChallenges, []);
  const depthPreference = profile?.depthPreference || 'intermediate';
  const experienceLevels = safeJsonParse(profile?.experienceLevels, {});

  // Score each course based on relevance
  const scoredCourses: Array<{
    slug: string;
    course: Course;
    score: number;
    reasons: string[];
  }> = [];

  const allowedLevels = DEPTH_LEVEL_MAP[depthPreference] || ['All Levels'];

  for (const [slug, course] of allCourses) {
    // Skip already completed courses
    if (completedCourses.has(slug)) continue;

    const meta = course.metadata;
    let score = 0;
    const reasons: string[] = [];

    // Check if course matches interests
    for (const interest of interests) {
      const relevantCourses = INTEREST_TO_COURSES[interest] || [];
      if (relevantCourses.includes(slug)) {
        score += 20;
        reasons.push(`Matches your interest in ${interest}`);
      }
    }

    // Check if course matches challenges
    for (const challenge of challenges) {
      const relevantCourses = CHALLENGE_TO_COURSES[challenge] || [];
      if (relevantCourses.includes(slug)) {
        score += 25; // Challenges are weighted higher
        reasons.push(`Addresses ${challenge}`);
      }
    }

    // Check depth level compatibility
    if (meta.level && allowedLevels.includes(meta.level)) {
      score += 10;
    } else if (meta.level && !allowedLevels.includes(meta.level)) {
      score -= 15; // Penalize mismatched depth
    }

    // Boost free lead magnets for new users
    if (meta.price === 0) {
      if (startedCourses.size < 3) {
        score += 15;
        reasons.push('Good starting point');
      }
    }

    // Penalize already started but not completed courses less
    if (startedCourses.has(slug) && !completedCourses.has(slug)) {
      score += 30; // Encourage completion
      reasons.push('Continue where you left off');
    }

    // Add base score for having any match
    if (score > 0 || reasons.length > 0) {
      scoredCourses.push({ slug, course, score, reasons });
    } else {
      // Still include courses with small base score if they match category interests
      const categoryInterests = interests.filter(i =>
        ['shadow work', 'relationships', 'spirituality', 'embodiment'].includes(i)
      );
      if (categoryInterests.some(ci => meta.category?.toLowerCase().includes(ci.split(' ')[0]))) {
        scoredCourses.push({ slug, course, score: 5, reasons: [`Related to ${meta.category}`] });
      }
    }
  }

  // Sort by score
  scoredCourses.sort((a, b) => b.score - a.score);

  // Take top recommendations
  const recommendations = scoredCourses.slice(0, 6).map(({ slug, course, reasons }) => ({
    slug,
    title: course.metadata.title,
    description: course.metadata.description,
    category: course.metadata.category,
    price: course.metadata.price,
    level: course.metadata.level,
    reasons: reasons.slice(0, 2), // Limit to 2 reasons
    purchased: purchasedCourses.has(slug),
    inProgress: startedCourses.has(slug) && !completedCourses.has(slug),
  }));

  // If no profile or not enough recommendations, add some defaults
  if (recommendations.length < 3) {
    const defaults = [
      'shadow-work-foundations',
      'nervous-system-mastery',
      'mindfulness-basics',
      'finding-your-path',
    ];

    for (const slug of defaults) {
      if (recommendations.length >= 6) break;
      if (recommendations.some(r => r.slug === slug)) continue;
      if (completedCourses.has(slug)) continue;

      const course = allCourses.get(slug);
      if (course) {
        recommendations.push({
          slug,
          title: course.metadata.title,
          description: course.metadata.description,
          category: course.metadata.category,
          price: course.metadata.price,
          level: course.metadata.level,
          reasons: ['Recommended starting point'],
          purchased: purchasedCourses.has(slug),
          inProgress: startedCourses.has(slug),
        });
      }
    }
  }

  return NextResponse.json({
    recommendations,
    hasProfile: !!profile?.onboardingCompleted,
    stats: {
      completedCourses: completedCourses.size,
      startedCourses: startedCourses.size,
      purchasedCourses: purchasedCourses.size,
    },
  });
}
