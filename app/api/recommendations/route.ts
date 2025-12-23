import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/sanitize";
import { getAllCourses, type Course } from "@/lib/courses";
import { getOrCreateHealth, type Pillar, type SpectrumStage } from "@/lib/integration-health";

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

// Map pillars to course categories/tags for health-based recommendations
const PILLAR_TO_COURSES: Record<Pillar, string[]> = {
  mind: ['shadow-work-foundations', 'the-integrated-self', 'mastering-emotions', 'emotional-intelligence', 'intro-emotional-intelligence', 'healing-inner-child'],
  body: ['nervous-system-mastery', 'stress-resilience-mastery', 'movement-fundamentals', 'body-wisdom', 'embodiment-mastery', 'sleep-mastery', 'burnout-recovery'],
  soul: ['mindfulness-meditation-mastery', 'mindfulness-basics', 'presence-practice', 'spiritual-development', 'life-purpose-discovery', 'meaning-and-purpose', 'death-contemplation'],
  relationships: ['conscious-relationship', 'attachment-repair', 'boundaries', 'healing-relationships-101', 'intimacy-after-trauma', 'codependency-recovery', 'people-pleasing-recovery'],
};

// Map spectrum stages to appropriate course tiers
const SPECTRUM_TO_TIER: Record<SpectrumStage, string[]> = {
  collapse: ['intro', 'beginner'], // Simple, stabilizing content
  regulation: ['beginner', 'intermediate'], // Building capacity
  integration: ['intermediate', 'advanced'], // Core work
  embodiment: ['advanced', 'flagship'], // Deepening
  optimization: ['flagship', 'advanced'], // Mastery
};

// Heavy/sensitive content - not appropriate when user is struggling
// These deal with death, deep trauma, intense shadow work, etc.
const HEAVY_CONTENT_COURSES = [
  'death-contemplation',
  'grief-and-loss',
  'living-after-loss',
  'trauma-informed-healing',
  'intimacy-after-trauma',
  'shadow-integration', // Deep shadow work (not foundations)
  'addiction-and-compulsion',
  'suicidal-ideation-support', // If exists
];

// Stabilizing/grounding content - prioritize when user is struggling
const STABILIZING_COURSES = [
  'nervous-system-mastery',
  'anxiety-first-aid',
  'stress-resilience-mastery',
  'mindfulness-basics',
  'sleep-mastery',
  'burnout-recovery',
  'grounding-practices',
  'self-compassion-basics',
];

// Challenges that indicate user has lived experience with heavy topics
// If they selected these, they're probably ready for related content
const LIVED_EXPERIENCE_CHALLENGES = [
  'trauma',
  'grief',
  'addiction',
  'depression',
];

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

  // Get integration health for smarter recommendations
  let health: Awaited<ReturnType<typeof getOrCreateHealth>> | null = null;
  try {
    health = await getOrCreateHealth(session.user.id);
  } catch {
    // Health data not available, continue without it
  }

  // Find the lowest-scoring pillar (area needing most attention)
  let lowestPillar: Pillar | null = null;
  let lowestScore = 100;
  if (health) {
    const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
    for (const pillar of pillars) {
      const score = health.pillars[pillar].score;
      if (score < lowestScore) {
        lowestScore = score;
        lowestPillar = pillar;
      }
    }
  }

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

    // Health-based recommendations (highest priority)
    if (health && lowestPillar) {
      const pillarCourses = PILLAR_TO_COURSES[lowestPillar];
      if (pillarCourses.includes(slug)) {
        score += 35; // Strong boost for courses addressing weakest pillar
        const pillarNames: Record<Pillar, string> = {
          mind: 'psychological growth',
          body: 'nervous system & body',
          soul: 'meaning & spiritual practice',
          relationships: 'relationship healing',
        };
        reasons.push(`Supports your ${pillarNames[lowestPillar]}`);
      }

      // Check if course tier matches user's spectrum stage for that pillar
      const pillarStage = health.pillars[lowestPillar].stage;
      const appropriateTiers = SPECTRUM_TO_TIER[pillarStage];
      const courseTier = meta.tier?.toLowerCase();
      if (courseTier && appropriateTiers.includes(courseTier)) {
        score += 10; // Tier matches development stage
      } else if (courseTier && !appropriateTiers.includes(courseTier)) {
        // Don't recommend advanced content to someone in collapse
        if (pillarStage === 'collapse' && ['advanced', 'flagship'].includes(courseTier)) {
          score -= 20;
        }
      }

      // If user is in collapse in any pillar, boost stabilizing content
      const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
      const inCollapse = pillars.some(p => health.pillars[p].stage === 'collapse');
      if (inCollapse) {
        // Boost grounding/stabilizing courses
        if (STABILIZING_COURSES.includes(slug)) {
          score += 20;
          if (!reasons.includes('Helps with stabilization')) {
            reasons.push('Helps with stabilization');
          }
        }
      }

      // Sensitivity filtering for heavy content
      const isHeavyContent = HEAVY_CONTENT_COURSES.includes(slug);
      if (isHeavyContent) {
        // Check if user has lived experience with this topic
        const hasLivedExperience = challenges.some(c => LIVED_EXPERIENCE_CHALLENGES.includes(c));

        if (inCollapse) {
          // User is struggling - strongly de-prioritize heavy content
          // Unless they specifically selected it as a challenge (lived experience)
          if (!hasLivedExperience) {
            score -= 40; // Strong penalty
          } else {
            // They have lived experience but are in collapse - gentle penalty
            score -= 15;
          }
        } else if (health.overall.stage === 'regulation') {
          // User is building capacity - moderate de-prioritization
          if (!hasLivedExperience) {
            score -= 20;
          }
        }
        // For integration/embodiment/optimization stages with no lived experience,
        // we don't actively recommend but don't penalize either
      }
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
    health: health ? {
      lowestPillar,
      lowestScore,
      overallStage: health.overall.stage,
    } : null,
  });
}
