/**
 * Practice Recommendations API
 * Returns personalized practice recommendations based on health, nervous system state, and needs
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import { getAllPractices, type Practice } from '@/lib/practices';
import { getOrCreateHealth, type Pillar, type SpectrumStage } from '@/lib/integration-health';
import type { NervousSystemData, AttachmentData } from '@/lib/insights';

// Map pillars to practice categories/tags
const PILLAR_TO_PRACTICES: Record<Pillar, string[]> = {
  mind: ['meditation', 'journaling', 'shadow-work', 'focus', 'clarity', 'awareness'],
  body: ['breathwork', 'somatic', 'grounding', 'movement', 'regulation', 'embodiment'],
  soul: ['meditation', 'presence', 'stillness', 'meaning', 'ritual', 'connection'],
  relationships: ['boundaries', 'communication', 'compassion', 'intimacy', 'self-compassion'],
};

// Practices for stabilization (collapse state)
const STABILIZING_TAGS = [
  'grounding',
  'calming',
  'safety',
  'gentle',
  'beginner-friendly',
  'regulation',
  'soothing',
];

// Practices for activation (when in optimization state wanting to go deeper)
const ACTIVATION_TAGS = [
  'intense',
  'cathartic',
  'releasing',
  'activating',
  'advanced',
  'deep',
];

// Map stages to appropriate practice intensity
const STAGE_TO_INTENSITY: Record<SpectrumStage, string[]> = {
  collapse: ['gentle'],
  regulation: ['gentle', 'moderate'],
  integration: ['gentle', 'moderate', 'activating'],
  embodiment: ['moderate', 'activating'],
  optimization: ['moderate', 'activating', 'intense'],
};

// Time of day mapping (hours 0-23)
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Default time associations for practice categories (when bestFor.timeOfDay isn't set)
const CATEGORY_TIME_DEFAULTS: Record<string, TimeOfDay[]> = {
  'breathwork': ['morning', 'afternoon', 'evening'], // Versatile
  'grounding': ['morning', 'afternoon', 'evening', 'night'], // Always appropriate
  'meditation': ['morning', 'evening', 'night'], // Calming
  'somatic': ['morning', 'afternoon'], // Activating
  'shadow-work': ['evening', 'night'], // Reflective, needs quiet
  'emotional-release': ['afternoon', 'evening'], // Need energy but not at bedtime
  'journaling': ['morning', 'evening', 'night'], // Reflective
  'movement': ['morning', 'afternoon'], // Energizing
};

// Practices that help with sleep/winding down
const EVENING_WIND_DOWN_TAGS = ['calming', 'sleep', 'relaxation', 'gentle', 'soothing'];

// Practices that help with waking up/energizing
const MORNING_ACTIVATION_TAGS = ['energizing', 'activating', 'focus', 'clarity', 'intention'];

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
    // Fetch user data
    const assessments = await prisma.assessmentResult.findMany({
      where: { userId: session.user.id },
      select: { type: true, results: true },
    });

    // Get health data
    let health: Awaited<ReturnType<typeof getOrCreateHealth>> | null = null;
    try {
      health = await getOrCreateHealth(session.user.id);
    } catch {
      // Continue without health data
    }

    // Parse assessment data
    let nervousSystemState: 'ventral' | 'sympathetic' | 'dorsal' | undefined;
    let attachmentStyle: 'anxious' | 'avoidant' | 'disorganized' | 'secure' | undefined;

    for (const assessment of assessments) {
      const results = safeJsonParse(assessment.results, {});
      if (assessment.type === 'nervous-system') {
        const ns = results as NervousSystemData;
        if (ns.state === 'ventral' || ns.state === 'sympathetic' || ns.state === 'dorsal') {
          nervousSystemState = ns.state;
        }
      }
      if (assessment.type === 'attachment') {
        const att = results as AttachmentData;
        attachmentStyle = att.style;
      }
    }

    // Get all practices
    const allPractices = getAllPractices();

    // Find lowest pillar for targeting
    let lowestPillar: Pillar | null = null;
    let lowestStage: SpectrumStage = 'regulation';
    let inCollapse = false;

    if (health) {
      const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
      let lowestScore = 100;
      for (const pillar of pillars) {
        if (health.pillars[pillar].score < lowestScore) {
          lowestScore = health.pillars[pillar].score;
          lowestPillar = pillar;
          lowestStage = health.pillars[pillar].stage;
        }
        if (health.pillars[pillar].stage === 'collapse') {
          inCollapse = true;
        }
      }
    }

    // Score each practice
    const scoredPractices: Array<{
      slug: string;
      practice: Practice;
      score: number;
      reasons: string[];
    }> = [];

    for (const practice of allPractices) {
      let score = 0;
      const reasons: string[] = [];

      const category = practice.metadata.category;
      const tags = practice.metadata.tags.map((t) => t.toLowerCase());
      const intensity = practice.metadata.intensity;
      const helpssWith = practice.metadata.helpssWith.map((h) => h.toLowerCase());

      // Nervous system match
      if (
        nervousSystemState &&
        practice.metadata.bestFor?.nervousSystem?.includes(nervousSystemState)
      ) {
        score += 25;
        const stateLabels = {
          sympathetic: 'activated state',
          dorsal: 'low energy',
          ventral: 'balance',
        };
        reasons.push(`Helps with ${stateLabels[nervousSystemState]}`);
      }

      // Attachment style match
      if (
        attachmentStyle &&
        practice.metadata.bestFor?.attachmentStyle?.includes(attachmentStyle)
      ) {
        score += 15;
        if (!reasons.some((r) => r.includes('attachment'))) {
          reasons.push('Supports your attachment healing');
        }
      }

      // Health pillar match
      if (lowestPillar) {
        const pillarPractices = PILLAR_TO_PRACTICES[lowestPillar].map((p) =>
          p.toLowerCase()
        );
        const matchesPillar =
          pillarPractices.includes(category.toLowerCase()) ||
          pillarPractices.some((p) => tags.includes(p));

        if (matchesPillar) {
          score += 20;
          const pillarNames: Record<Pillar, string> = {
            mind: 'mental clarity',
            body: 'body connection',
            soul: 'soul nourishment',
            relationships: 'relational healing',
          };
          reasons.push(`Supports ${pillarNames[lowestPillar]}`);
        }
      }

      // Stage-appropriate intensity
      if (health) {
        const appropriateIntensities = STAGE_TO_INTENSITY[lowestStage];
        if (appropriateIntensities.includes(intensity)) {
          score += 10;
        } else {
          // Penalize intensity mismatch
          score -= 15;
        }
      }

      // Stabilization for collapse
      if (inCollapse) {
        const hasStabilizing = STABILIZING_TAGS.some((t) => tags.includes(t));
        if (hasStabilizing) {
          score += 20;
          if (!reasons.includes('Grounding practice')) {
            reasons.push('Grounding practice');
          }
        }
        // Strongly penalize activating practices in collapse
        const hasActivating = ACTIVATION_TAGS.some((t) => tags.includes(t));
        if (hasActivating) {
          score -= 30;
        }
      }

      // Quick practices get small boost (easy to start)
      if (practice.metadata.duration === 'quick') {
        score += 5;
      }

      // Time-of-day matching - ONLY as a gentle tiebreaker when user is stable
      // Inner need (health state) always takes priority over time of day
      // Skip time-based boosts entirely if user is in collapse or low energy
      const skipTimeBoosts = inCollapse || (lowestStage === 'regulation');

      if (!skipTimeBoosts) {
        const practiceTimeOfDay = practice.metadata.bestFor?.timeOfDay;
        const categoryDefaults = CATEGORY_TIME_DEFAULTS[category.toLowerCase()];
        const appropriateTimes = practiceTimeOfDay || categoryDefaults || [];

        // Small boost for time-appropriate practices (tiebreaker only, +5 not +15)
        if (appropriateTimes.includes(currentTimeOfDay)) {
          score += 5;
          // Don't add time-based reasons - they clutter the "why" when health matters more
        }
        // No penalty for off-time practices - if you need grounding at 8am, you need grounding
      }

      // Only include if has some relevance
      if (score > 0) {
        scoredPractices.push({
          slug: practice.slug,
          practice,
          score,
          reasons,
        });
      }
    }

    // Sort by score
    scoredPractices.sort((a, b) => b.score - a.score);

    // Take top 4
    const recommendations = scoredPractices.slice(0, 4).map(({ slug, practice, reasons }) => ({
      slug,
      title: practice.metadata.title,
      description: practice.metadata.description,
      category: practice.metadata.category,
      duration: practice.metadata.duration,
      durationMinutes: practice.metadata.durationMinutes,
      intensity: practice.metadata.intensity,
      reasons: reasons.slice(0, 2),
    }));

    // Add fallback practices if not enough recommendations
    if (recommendations.length < 2) {
      const quickPractices = allPractices
        .filter(
          (p) =>
            p.metadata.duration === 'quick' &&
            !recommendations.some((r) => r.slug === p.slug)
        )
        .slice(0, 4 - recommendations.length);

      for (const practice of quickPractices) {
        recommendations.push({
          slug: practice.slug,
          title: practice.metadata.title,
          description: practice.metadata.description,
          category: practice.metadata.category,
          duration: practice.metadata.duration,
          durationMinutes: practice.metadata.durationMinutes,
          intensity: practice.metadata.intensity,
          reasons: ['Quick and accessible'],
        });
      }
    }

    return NextResponse.json({
      recommendations,
      health: health
        ? {
            lowestPillar,
            inCollapse,
          }
        : null,
      nervousSystemState,
      timeOfDay: currentTimeOfDay,
    });
  } catch (error) {
    console.error('Error generating practice recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
