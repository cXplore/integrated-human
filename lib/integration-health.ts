/**
 * Integration Health System
 *
 * Tracks user development across four pillars (Mind, Body, Soul, Relationships)
 * with spectrum stages (Collapse, Regulation, Integration, Embodiment, Optimization)
 *
 * This is a living assessment - not a one-time quiz but ongoing understanding
 * based on user activity, reflections, and AI-analyzed patterns.
 */

import { prisma } from './prisma';
import {
  type Pillar as PillarType,
  type SpectrumStage as SpectrumStageType,
  PILLAR_INFO,
  SPECTRUM_STAGES,
  STAGE_INFO
} from './health-types';

// Re-export types from client-safe module
export type Pillar = PillarType;
export type SpectrumStage = SpectrumStageType;
export { PILLAR_INFO, SPECTRUM_STAGES, STAGE_INFO };

// ============================================================================
// TYPES (Server-only extensions)
// ============================================================================

export interface PillarDimensions {
  mind: {
    shadowWork: number;        // 0-100: Shadow integration progress
    emotionalIntelligence: number; // 0-100: Emotional awareness/regulation
    cognitiveClarity: number;  // 0-100: Mental clarity, pattern recognition
  };
  body: {
    nervousSystem: number;     // 0-100: Nervous system regulation
    physicalVitality: number;  // 0-100: Energy, health practices
    embodiment: number;        // 0-100: Body awareness, somatic integration
  };
  soul: {
    meaningfulness: number;    // 0-100: Sense of purpose and meaning
    spiritualPractice: number; // 0-100: Consistent practice engagement
    presence: number;          // 0-100: Mindfulness, being present
  };
  relationships: {
    attachmentSecurity: number; // 0-100: Attachment pattern health
    boundaries: number;        // 0-100: Healthy boundary setting
    intimacy: number;          // 0-100: Capacity for deep connection
  };
}

export interface HealthSnapshot {
  pillars: {
    [K in Pillar]: {
      score: number;           // 0-100 overall score
      stage: SpectrumStage;    // Current spectrum stage
      dimensions: PillarDimensions[K];
      trend: 'improving' | 'stable' | 'declining';
    };
  };
  overall: {
    score: number;
    stage: SpectrumStage;
  };
  lastUpdated: Date;
  freshness?: DataFreshness;  // How current/reliable the health data is
}

export interface HealthDataSources {
  assessments: {
    archetype?: {
      isWounded: boolean;
      isIntegrated: boolean;
      primaryArchetype: string;
      takenAt?: Date;
    };
    attachment?: {
      style: string;
      anxietyPercent: number;
      avoidancePercent: number;
      takenAt?: Date;
    };
    nervousSystem?: {
      state: string;
      counts: { ventral: number; sympathetic: number; dorsal: number };
      takenAt?: Date;
    };
  };
  activity: {
    journalEntries: number;
    journalMoods: string[];
    dreamEntries: number;
    checkIns: number;
    articlesRead: number;
    coursesCompleted: string[];
    coursesInProgress: string[];
    practicesUsed: string[];
    streakDays: number;
    lastActiveDate: Date | null;
    lastJournalDate: Date | null;
    lastDreamDate: Date | null;
    lastCheckInDate: Date | null;
  };
  profile: {
    primaryIntention?: string;
    lifeSituation?: string;
    currentChallenges?: string[];
    experienceLevels?: Record<string, number>;
  };
  // Quick check-in data (mood/energy tracking)
  quickCheckIns: {
    count: number;
    avgMood: number | null;
    avgEnergy: number | null;
    recentMoods: number[];
    pillarFocusCounts: Record<string, number>;
    lastCheckInDate: Date | null;
  };
}

// ============================================================================
// DATA FRESHNESS / STALENESS
// ============================================================================

export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'expired';

export interface DataFreshness {
  overall: FreshnessLevel;
  overallConfidence: number; // 0-1, how much to trust the health data
  details: {
    activity: {
      level: FreshnessLevel;
      daysSinceLastActivity: number | null;
      message: string;
    };
    assessments: {
      level: FreshnessLevel;
      oldestAssessmentDays: number | null;
      message: string;
    };
    checkIns: {
      level: FreshnessLevel;
      daysSinceLastCheckIn: number | null;
      message: string;
    };
  };
  suggestedActions: string[];
}

// Freshness thresholds in days
const FRESHNESS_THRESHOLDS = {
  activity: { fresh: 3, aging: 7, stale: 14 },      // Journal/dream entries
  assessments: { fresh: 30, aging: 60, stale: 90 }, // Assessments last longer
  checkIns: { fresh: 2, aging: 5, stale: 10 },      // Quick check-ins should be frequent
};

/**
 * Calculate data freshness and confidence level
 * Returns how "trustworthy" the current health data is
 */
export function calculateDataFreshness(data: HealthDataSources): DataFreshness {
  const now = new Date();

  // Activity freshness (journals, dreams)
  const lastActivityDate = data.activity.lastActiveDate;
  const daysSinceActivity = lastActivityDate
    ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const activityFreshness = getFreshnessLevel(daysSinceActivity, FRESHNESS_THRESHOLDS.activity);

  // Assessment freshness
  const assessmentDates: Date[] = [];
  if (data.assessments.archetype?.takenAt) assessmentDates.push(data.assessments.archetype.takenAt);
  if (data.assessments.attachment?.takenAt) assessmentDates.push(data.assessments.attachment.takenAt);
  if (data.assessments.nervousSystem?.takenAt) assessmentDates.push(data.assessments.nervousSystem.takenAt);

  const oldestAssessment = assessmentDates.length > 0
    ? assessmentDates.reduce((oldest, date) => date < oldest ? date : oldest)
    : null;
  const daysSinceOldestAssessment = oldestAssessment
    ? Math.floor((now.getTime() - oldestAssessment.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const assessmentFreshness = getFreshnessLevel(daysSinceOldestAssessment, FRESHNESS_THRESHOLDS.assessments);

  // Check-in freshness
  const lastCheckInDate = data.quickCheckIns.lastCheckInDate;
  const daysSinceCheckIn = lastCheckInDate
    ? Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const checkInFreshness = getFreshnessLevel(daysSinceCheckIn, FRESHNESS_THRESHOLDS.checkIns);

  // Calculate overall freshness (weighted: check-ins most important for current state)
  const freshnessWeights = { activity: 0.3, assessments: 0.25, checkIns: 0.45 };
  const freshnessScores = {
    fresh: 1,
    aging: 0.7,
    stale: 0.4,
    expired: 0.1,
  };

  const overallScore =
    freshnessScores[activityFreshness] * freshnessWeights.activity +
    freshnessScores[assessmentFreshness] * freshnessWeights.assessments +
    freshnessScores[checkInFreshness] * freshnessWeights.checkIns;

  const overallFreshness: FreshnessLevel =
    overallScore >= 0.85 ? 'fresh' :
    overallScore >= 0.6 ? 'aging' :
    overallScore >= 0.3 ? 'stale' : 'expired';

  // Generate suggested actions
  const suggestedActions: string[] = [];

  if (checkInFreshness === 'stale' || checkInFreshness === 'expired') {
    suggestedActions.push('Quick check-in: How are you feeling right now?');
  }
  if (activityFreshness === 'stale' || activityFreshness === 'expired') {
    suggestedActions.push('Journal entry: Reflect on where you are today');
  }
  if (assessmentFreshness === 'stale' || assessmentFreshness === 'expired') {
    suggestedActions.push('Retake assessments to update your baseline');
  }

  // Generate messages
  const activityMessage = getActivityFreshnessMessage(daysSinceActivity, activityFreshness);
  const assessmentMessage = getAssessmentFreshnessMessage(daysSinceOldestAssessment, assessmentFreshness);
  const checkInMessage = getCheckInFreshnessMessage(daysSinceCheckIn, checkInFreshness);

  return {
    overall: overallFreshness,
    overallConfidence: overallScore,
    details: {
      activity: {
        level: activityFreshness,
        daysSinceLastActivity: daysSinceActivity,
        message: activityMessage,
      },
      assessments: {
        level: assessmentFreshness,
        oldestAssessmentDays: daysSinceOldestAssessment,
        message: assessmentMessage,
      },
      checkIns: {
        level: checkInFreshness,
        daysSinceLastCheckIn: daysSinceCheckIn,
        message: checkInMessage,
      },
    },
    suggestedActions,
  };
}

function getFreshnessLevel(
  days: number | null,
  thresholds: { fresh: number; aging: number; stale: number }
): FreshnessLevel {
  if (days === null) return 'expired';
  if (days <= thresholds.fresh) return 'fresh';
  if (days <= thresholds.aging) return 'aging';
  if (days <= thresholds.stale) return 'stale';
  return 'expired';
}

function getActivityFreshnessMessage(days: number | null, level: FreshnessLevel): string {
  if (days === null) return 'No recent journal or dream entries found';
  switch (level) {
    case 'fresh': return 'Your reflections are up to date';
    case 'aging': return `Last reflection was ${days} days ago`;
    case 'stale': return `It's been ${days} days since you last journaled - your state may have changed`;
    case 'expired': return `Over 2 weeks without journaling - current data may not reflect where you are now`;
  }
}

function getAssessmentFreshnessMessage(days: number | null, level: FreshnessLevel): string {
  if (days === null) return 'No assessments completed';
  switch (level) {
    case 'fresh': return 'Assessments are current';
    case 'aging': return `Assessments are ${days} days old - still relevant`;
    case 'stale': return `Assessments are ${days} days old - consider retaking`;
    case 'expired': return `Assessments are over 3 months old - may no longer reflect your current state`;
  }
}

function getCheckInFreshnessMessage(days: number | null, level: FreshnessLevel): string {
  if (days === null) return 'No recent mood/energy check-ins';
  switch (level) {
    case 'fresh': return 'Current mood and energy data is fresh';
    case 'aging': return `Last check-in was ${days} days ago`;
    case 'stale': return `Check-in data is ${days} days old - how are you feeling today?`;
    case 'expired': return `No recent check-ins - we don't know how you're feeling now`;
  }
}

/**
 * Apply staleness decay to health scores
 * As data becomes stale, scores decay toward a neutral baseline
 */
export function applyStalenesDecay(score: number, confidence: number): number {
  // Neutral baseline is 40 (middle of regulation stage)
  const baseline = 40;

  // As confidence drops, score moves toward baseline
  // Full confidence = original score, zero confidence = baseline
  return Math.round(baseline + (score - baseline) * confidence);
}

// ============================================================================
// SPECTRUM STAGE MAPPING
// ============================================================================

const STAGE_THRESHOLDS: Record<SpectrumStage, { min: number; max: number }> = {
  collapse: { min: 0, max: 20 },
  regulation: { min: 21, max: 40 },
  integration: { min: 41, max: 60 },
  embodiment: { min: 61, max: 80 },
  optimization: { min: 81, max: 100 },
};

export function scoreToStage(score: number): SpectrumStage {
  if (score <= 20) return 'collapse';
  if (score <= 40) return 'regulation';
  if (score <= 60) return 'integration';
  if (score <= 80) return 'embodiment';
  return 'optimization';
}

export function stageToScoreRange(stage: SpectrumStage): { min: number; max: number } {
  return STAGE_THRESHOLDS[stage];
}

// ============================================================================
// DATA COLLECTION
// ============================================================================

/**
 * Gather all relevant data sources for health calculation
 */
export async function gatherHealthData(userId: string): Promise<HealthDataSources> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Parallel data fetching
  const [
    assessments,
    journalEntries,
    dreamEntries,
    dreamEntriesRecent,
    checkIns,
    lastCheckIn,
    articleProgress,
    courseProgress,
    profile,
    quickCheckIns,
  ] = await Promise.all([
    // Assessments (with dates for freshness tracking)
    prisma.assessmentResult.findMany({
      where: { userId },
      select: { type: true, results: true, createdAt: true },
    }),
    // Journal entries (last 30 days)
    prisma.journalEntry.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { mood: true, createdAt: true },
    }),
    // Dream entries count (last 30 days)
    prisma.dreamEntry.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Most recent dream entry (for freshness)
    prisma.dreamEntry.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    // Check-ins count (last 30 days)
    prisma.integrationCheckIn.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Most recent check-in (for freshness)
    prisma.integrationCheckIn.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    // Articles read (last 90 days)
    prisma.articleProgress.findMany({
      where: { userId, lastReadAt: { gte: ninetyDaysAgo } },
      select: { completed: true, slug: true },
    }),
    // Course progress
    prisma.courseProgress.findMany({
      where: { userId },
      select: { courseSlug: true, completed: true },
    }),
    // User profile
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        primaryIntention: true,
        lifeSituation: true,
        currentChallenges: true,
        experienceLevels: true,
      },
    }),
    // Quick check-ins (last 14 days for mood tracking)
    prisma.quickCheckIn.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
      select: { mood: true, energy: true, pillarFocus: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Parse assessments (including dates for freshness tracking)
  const parsedAssessments: HealthDataSources['assessments'] = {};
  for (const a of assessments) {
    try {
      const results = JSON.parse(a.results);
      if (a.type === 'archetype') {
        parsedAssessments.archetype = {
          isWounded: results.isWounded ?? false,
          isIntegrated: results.isIntegrated ?? false,
          primaryArchetype: results.primaryArchetype ?? '',
          takenAt: a.createdAt,
        };
      } else if (a.type === 'attachment') {
        parsedAssessments.attachment = {
          style: results.style ?? 'unknown',
          anxietyPercent: results.anxietyPercent ?? 50,
          avoidancePercent: results.avoidancePercent ?? 50,
          takenAt: a.createdAt,
        };
      } else if (a.type === 'nervous-system') {
        parsedAssessments.nervousSystem = {
          state: results.state ?? 'mixed',
          counts: results.counts ?? { ventral: 0, sympathetic: 0, dorsal: 0 },
          takenAt: a.createdAt,
        };
      }
    } catch {
      // Skip malformed data
    }
  }

  // Calculate activity metrics
  const completedCourses = [...new Set(
    courseProgress.filter(cp => cp.completed).map(cp => cp.courseSlug)
  )];
  const inProgressCourses = [...new Set(
    courseProgress.filter(cp => !cp.completed).map(cp => cp.courseSlug)
  )].filter(slug => !completedCourses.includes(slug));

  // Calculate streak
  const activityDates = journalEntries.map(j => j.createdAt.toDateString());
  const uniqueDates = [...new Set(activityDates)].sort().reverse();
  let streakDays = 0;
  const today = new Date().toDateString();
  for (const date of uniqueDates) {
    const expected = new Date();
    expected.setDate(expected.getDate() - streakDays);
    if (date === expected.toDateString() || (streakDays === 0 && date === today)) {
      streakDays++;
    } else {
      break;
    }
  }

  // Calculate last activity dates for freshness
  const sortedJournals = journalEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const lastJournalDate = sortedJournals.length > 0 ? sortedJournals[0].createdAt : null;
  const lastDreamDate = dreamEntriesRecent?.createdAt ?? null;
  const lastIntegrationCheckInDate = lastCheckIn?.createdAt ?? null;
  const lastQuickCheckInDate = quickCheckIns.length > 0 ? quickCheckIns[0].createdAt : null;

  // Overall last active date (most recent of journal or dream)
  const lastActiveDate = lastJournalDate && lastDreamDate
    ? (lastJournalDate > lastDreamDate ? lastJournalDate : lastDreamDate)
    : lastJournalDate ?? lastDreamDate;

  return {
    assessments: parsedAssessments,
    activity: {
      journalEntries: journalEntries.length,
      journalMoods: journalEntries.map(j => j.mood).filter(Boolean) as string[],
      dreamEntries,
      checkIns,
      articlesRead: articleProgress.filter(a => a.completed).length,
      coursesCompleted: completedCourses,
      coursesInProgress: inProgressCourses,
      practicesUsed: [], // Would need practice tracking model
      streakDays,
      lastActiveDate,
      lastJournalDate,
      lastDreamDate,
      lastCheckInDate: lastIntegrationCheckInDate,
    },
    profile: {
      primaryIntention: profile?.primaryIntention ?? undefined,
      lifeSituation: profile?.lifeSituation ?? undefined,
      currentChallenges: profile?.currentChallenges
        ? JSON.parse(profile.currentChallenges)
        : undefined,
      experienceLevels: profile?.experienceLevels
        ? JSON.parse(profile.experienceLevels)
        : undefined,
    },
    quickCheckIns: {
      count: quickCheckIns.length,
      avgMood: quickCheckIns.length > 0
        ? quickCheckIns.reduce((sum, c) => sum + c.mood, 0) / quickCheckIns.length
        : null,
      avgEnergy: quickCheckIns.length > 0
        ? quickCheckIns.reduce((sum, c) => sum + c.energy, 0) / quickCheckIns.length
        : null,
      recentMoods: quickCheckIns.slice(0, 7).map(c => c.mood),
      pillarFocusCounts: quickCheckIns.reduce((acc, c) => {
        if (c.pillarFocus) {
          acc[c.pillarFocus] = (acc[c.pillarFocus] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      lastCheckInDate: lastQuickCheckInDate,
    },
  };
}

// ============================================================================
// PILLAR SCORING ALGORITHMS
// ============================================================================

/**
 * Calculate Mind pillar scores
 * Sources: Archetype assessment, journal analysis, shadow work courses
 */
export function calculateMindScore(data: HealthDataSources): PillarDimensions['mind'] {
  let shadowWork = 30; // Base score
  let emotionalIntelligence = 30;
  let cognitiveClarity = 30;

  // Archetype assessment contribution
  if (data.assessments.archetype) {
    const { isWounded, isIntegrated } = data.assessments.archetype;
    if (isIntegrated) {
      shadowWork += 40;
    } else if (!isWounded) {
      shadowWork += 20;
    }
  }

  // Journal engagement indicates emotional processing
  const journalScore = Math.min(30, data.activity.journalEntries * 3);
  emotionalIntelligence += journalScore;

  // Mood diversity in journals indicates emotional range
  const uniqueMoods = new Set(data.activity.journalMoods).size;
  emotionalIntelligence += Math.min(15, uniqueMoods * 3);

  // Courses completed in Mind category
  const mindCourses = data.activity.coursesCompleted.filter(slug =>
    slug.includes('shadow') ||
    slug.includes('emotion') ||
    slug.includes('pattern') ||
    slug.includes('archetype') ||
    slug.includes('inner')
  );
  shadowWork += Math.min(25, mindCourses.length * 8);
  cognitiveClarity += Math.min(20, mindCourses.length * 5);

  // Check-ins show reflection capacity
  cognitiveClarity += Math.min(15, data.activity.checkIns * 3);

  // Experience level contribution
  if (data.profile.experienceLevels?.therapy) {
    emotionalIntelligence += data.profile.experienceLevels.therapy * 3;
  }

  // Life situation affects clarity
  if (data.profile.lifeSituation === 'crisis') {
    cognitiveClarity = Math.max(10, cognitiveClarity - 20);
  } else if (data.profile.lifeSituation === 'stable') {
    cognitiveClarity += 10;
  }

  // Quick check-in mood data affects emotional intelligence score
  if (data.quickCheckIns.avgMood !== null) {
    // Mood 1-5 maps to -20 to +20 adjustment
    const moodAdjustment = (data.quickCheckIns.avgMood - 3) * 10;
    emotionalIntelligence += moodAdjustment;

    // Low average mood suggests struggle
    if (data.quickCheckIns.avgMood < 2.5) {
      cognitiveClarity = Math.max(10, cognitiveClarity - 10);
    }
  }

  // Mind pillar focus from check-ins indicates active work
  if (data.quickCheckIns.pillarFocusCounts['mind']) {
    shadowWork += Math.min(10, data.quickCheckIns.pillarFocusCounts['mind'] * 3);
  }

  return {
    shadowWork: Math.min(100, Math.max(0, shadowWork)),
    emotionalIntelligence: Math.min(100, Math.max(0, emotionalIntelligence)),
    cognitiveClarity: Math.min(100, Math.max(0, cognitiveClarity)),
  };
}

/**
 * Calculate Body pillar scores
 * Sources: Nervous system assessment, practice usage, body courses
 */
export function calculateBodyScore(data: HealthDataSources): PillarDimensions['body'] {
  let nervousSystem = 30;
  let physicalVitality = 30;
  let embodiment = 30;

  // Nervous system assessment
  if (data.assessments.nervousSystem) {
    const { state, counts } = data.assessments.nervousSystem;
    const total = counts.ventral + counts.sympathetic + counts.dorsal;
    if (total > 0) {
      const ventralRatio = counts.ventral / total;
      nervousSystem = Math.round(30 + ventralRatio * 50);
    }

    if (state === 'ventral') {
      nervousSystem += 15;
    } else if (state === 'dorsal') {
      nervousSystem = Math.max(15, nervousSystem - 10);
    }
  }

  // Body-related courses
  const bodyCourses = data.activity.coursesCompleted.filter(slug =>
    slug.includes('nervous') ||
    slug.includes('body') ||
    slug.includes('somatic') ||
    slug.includes('breath') ||
    slug.includes('stress')
  );
  nervousSystem += Math.min(20, bodyCourses.length * 6);
  physicalVitality += Math.min(20, bodyCourses.length * 5);
  embodiment += Math.min(25, bodyCourses.length * 7);

  // Practice engagement
  const practiceCount = data.activity.practicesUsed.length;
  embodiment += Math.min(20, practiceCount * 4);
  nervousSystem += Math.min(15, practiceCount * 3);

  // Experience with bodywork
  if (data.profile.experienceLevels?.bodywork) {
    embodiment += data.profile.experienceLevels.bodywork * 4;
    physicalVitality += data.profile.experienceLevels.bodywork * 2;
  }

  // Streak indicates discipline
  physicalVitality += Math.min(15, data.activity.streakDays * 2);

  // Quick check-in energy data affects physical vitality
  if (data.quickCheckIns.avgEnergy !== null) {
    // Energy 1-5 maps to -20 to +20 adjustment
    const energyAdjustment = (data.quickCheckIns.avgEnergy - 3) * 10;
    physicalVitality += energyAdjustment;

    // Low energy suggests nervous system dysregulation
    if (data.quickCheckIns.avgEnergy < 2.5) {
      nervousSystem = Math.max(10, nervousSystem - 10);
    }
  }

  // Body pillar focus from check-ins indicates active body awareness
  if (data.quickCheckIns.pillarFocusCounts['body']) {
    embodiment += Math.min(10, data.quickCheckIns.pillarFocusCounts['body'] * 3);
  }

  return {
    nervousSystem: Math.min(100, Math.max(0, nervousSystem)),
    physicalVitality: Math.min(100, Math.max(0, physicalVitality)),
    embodiment: Math.min(100, Math.max(0, embodiment)),
  };
}

/**
 * Calculate Soul pillar scores
 * Sources: Spiritual practice experience, meaning-focused content, presence practices
 */
export function calculateSoulScore(data: HealthDataSources): PillarDimensions['soul'] {
  let meaningfulness = 30;
  let spiritualPractice = 30;
  let presence = 30;

  // Primary intention affects meaning
  if (data.profile.primaryIntention === 'understanding' ||
      data.profile.primaryIntention === 'growth') {
    meaningfulness += 15;
  } else if (data.profile.primaryIntention === 'crisis') {
    meaningfulness = Math.max(10, meaningfulness - 10);
  }

  // Spiritual practice experience
  if (data.profile.experienceLevels?.spiritualPractice) {
    spiritualPractice += data.profile.experienceLevels.spiritualPractice * 5;
    presence += data.profile.experienceLevels.spiritualPractice * 3;
  }
  if (data.profile.experienceLevels?.meditation) {
    presence += data.profile.experienceLevels.meditation * 5;
    spiritualPractice += data.profile.experienceLevels.meditation * 3;
  }

  // Awakening experiences
  const challenges = data.profile.currentChallenges ?? [];
  if (challenges.includes('purpose') || challenges.includes('meaning')) {
    meaningfulness = Math.max(15, meaningfulness - 10);
  }

  // Soul-focused courses
  const soulCourses = data.activity.coursesCompleted.filter(slug =>
    slug.includes('meditation') ||
    slug.includes('meaning') ||
    slug.includes('spiritual') ||
    slug.includes('presence') ||
    slug.includes('soul') ||
    slug.includes('consciousness')
  );
  spiritualPractice += Math.min(25, soulCourses.length * 7);
  meaningfulness += Math.min(20, soulCourses.length * 5);
  presence += Math.min(20, soulCourses.length * 5);

  // Dream work indicates inner life engagement
  presence += Math.min(15, data.activity.dreamEntries * 3);

  // Consistent engagement indicates practice
  if (data.activity.streakDays >= 7) {
    spiritualPractice += 10;
  }

  // Soul pillar focus from check-ins indicates active spiritual attention
  if (data.quickCheckIns.pillarFocusCounts['soul']) {
    spiritualPractice += Math.min(10, data.quickCheckIns.pillarFocusCounts['soul'] * 3);
    presence += Math.min(8, data.quickCheckIns.pillarFocusCounts['soul'] * 2);
  }

  return {
    meaningfulness: Math.min(100, Math.max(0, meaningfulness)),
    spiritualPractice: Math.min(100, Math.max(0, spiritualPractice)),
    presence: Math.min(100, Math.max(0, presence)),
  };
}

/**
 * Calculate Relationships pillar scores
 * Sources: Attachment assessment, relationship courses, intimacy work
 */
export function calculateRelationshipsScore(data: HealthDataSources): PillarDimensions['relationships'] {
  let attachmentSecurity = 30;
  let boundaries = 30;
  let intimacy = 30;

  // Attachment assessment
  if (data.assessments.attachment) {
    const { style, anxietyPercent, avoidancePercent } = data.assessments.attachment;

    // Base score from style
    if (style === 'secure') {
      attachmentSecurity += 40;
      intimacy += 20;
    } else if (style === 'anxious') {
      attachmentSecurity += 15;
      intimacy += 10; // Desire for intimacy, but anxious about it
      boundaries = Math.max(15, boundaries - 10);
    } else if (style === 'avoidant') {
      attachmentSecurity += 10;
      boundaries += 15; // Over-boundaries
      intimacy = Math.max(15, intimacy - 15);
    } else if (style === 'disorganized') {
      attachmentSecurity = Math.max(10, attachmentSecurity - 10);
    }

    // Dimensional scores refine this
    const securityScore = 100 - ((anxietyPercent + avoidancePercent) / 2);
    attachmentSecurity = Math.round((attachmentSecurity + securityScore) / 2);
  }

  // Relationship challenges affect baseline
  const challenges = data.profile.currentChallenges ?? [];
  if (challenges.includes('relationships') || challenges.includes('attachment')) {
    attachmentSecurity = Math.max(15, attachmentSecurity - 10);
    intimacy = Math.max(15, intimacy - 10);
  }
  if (challenges.includes('boundaries')) {
    boundaries = Math.max(15, boundaries - 15);
  }
  if (challenges.includes('loneliness')) {
    intimacy = Math.max(15, intimacy - 10);
  }

  // Relationship-focused courses
  const relationshipCourses = data.activity.coursesCompleted.filter(slug =>
    slug.includes('relationship') ||
    slug.includes('attachment') ||
    slug.includes('intimacy') ||
    slug.includes('boundary') ||
    slug.includes('communication') ||
    slug.includes('conflict')
  );
  attachmentSecurity += Math.min(20, relationshipCourses.length * 5);
  boundaries += Math.min(25, relationshipCourses.length * 6);
  intimacy += Math.min(20, relationshipCourses.length * 5);

  // Relationships pillar focus from check-ins indicates active relational awareness
  if (data.quickCheckIns.pillarFocusCounts['relationships']) {
    attachmentSecurity += Math.min(8, data.quickCheckIns.pillarFocusCounts['relationships'] * 2);
    intimacy += Math.min(10, data.quickCheckIns.pillarFocusCounts['relationships'] * 3);
  }

  return {
    attachmentSecurity: Math.min(100, Math.max(0, attachmentSecurity)),
    boundaries: Math.min(100, Math.max(0, boundaries)),
    intimacy: Math.min(100, Math.max(0, intimacy)),
  };
}

// ============================================================================
// OVERALL HEALTH CALCULATION
// ============================================================================

/**
 * Calculate complete health snapshot from all data sources
 * Includes freshness calculation and optional staleness decay
 */
export function calculateHealthSnapshot(
  data: HealthDataSources,
  options: { applyDecay?: boolean } = {}
): HealthSnapshot {
  const { applyDecay = false } = options;

  // Calculate data freshness first
  const freshness = calculateDataFreshness(data);

  const mindDimensions = calculateMindScore(data);
  const bodyDimensions = calculateBodyScore(data);
  const soulDimensions = calculateSoulScore(data);
  const relationshipsDimensions = calculateRelationshipsScore(data);

  let mindScore = Math.round(
    (mindDimensions.shadowWork + mindDimensions.emotionalIntelligence + mindDimensions.cognitiveClarity) / 3
  );
  let bodyScore = Math.round(
    (bodyDimensions.nervousSystem + bodyDimensions.physicalVitality + bodyDimensions.embodiment) / 3
  );
  let soulScore = Math.round(
    (soulDimensions.meaningfulness + soulDimensions.spiritualPractice + soulDimensions.presence) / 3
  );
  let relationshipsScore = Math.round(
    (relationshipsDimensions.attachmentSecurity + relationshipsDimensions.boundaries + relationshipsDimensions.intimacy) / 3
  );

  // Apply staleness decay if requested
  // This moves scores toward a neutral baseline as confidence drops
  if (applyDecay) {
    const confidence = freshness.overallConfidence;
    mindScore = applyStalenesDecay(mindScore, confidence);
    bodyScore = applyStalenesDecay(bodyScore, confidence);
    soulScore = applyStalenesDecay(soulScore, confidence);
    relationshipsScore = applyStalenesDecay(relationshipsScore, confidence);
  }

  const overallScore = Math.round((mindScore + bodyScore + soulScore + relationshipsScore) / 4);

  return {
    pillars: {
      mind: {
        score: mindScore,
        stage: scoreToStage(mindScore),
        dimensions: mindDimensions,
        trend: 'stable', // Would need historical data to calculate
      },
      body: {
        score: bodyScore,
        stage: scoreToStage(bodyScore),
        dimensions: bodyDimensions,
        trend: 'stable',
      },
      soul: {
        score: soulScore,
        stage: scoreToStage(soulScore),
        dimensions: soulDimensions,
        trend: 'stable',
      },
      relationships: {
        score: relationshipsScore,
        stage: scoreToStage(relationshipsScore),
        dimensions: relationshipsDimensions,
        trend: 'stable',
      },
    },
    overall: {
      score: overallScore,
      stage: scoreToStage(overallScore),
    },
    lastUpdated: new Date(),
    freshness,
  };
}

/**
 * Calculate trend by comparing current to previous health snapshot
 */
export function calculateTrend(
  current: number,
  previous: number | null
): 'improving' | 'stable' | 'declining' {
  if (previous === null) return 'stable';
  const diff = current - previous;
  if (diff >= 5) return 'improving';
  if (diff <= -5) return 'declining';
  return 'stable';
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get or create current health for a user
 * Always includes fresh staleness data even if scores are cached
 */
export async function getOrCreateHealth(userId: string): Promise<HealthSnapshot> {
  // Check for recent health snapshot (within last 24 hours)
  const recent = await prisma.integrationHealth.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    // Even with cached scores, recalculate freshness (it changes over time)
    const data = await gatherHealthData(userId);
    const freshness = calculateDataFreshness(data);

    // Return existing snapshot with fresh staleness data
    return {
      pillars: {
        mind: {
          score: recent.mindScore,
          stage: recent.mindStage as SpectrumStage,
          dimensions: { shadowWork: 0, emotionalIntelligence: 0, cognitiveClarity: 0 },
          trend: 'stable',
        },
        body: {
          score: recent.bodyScore,
          stage: recent.bodyStage as SpectrumStage,
          dimensions: { nervousSystem: 0, physicalVitality: 0, embodiment: 0 },
          trend: 'stable',
        },
        soul: {
          score: recent.soulScore,
          stage: recent.soulStage as SpectrumStage,
          dimensions: { meaningfulness: 0, spiritualPractice: 0, presence: 0 },
          trend: 'stable',
        },
        relationships: {
          score: recent.relationshipsScore,
          stage: recent.relationshipsStage as SpectrumStage,
          dimensions: { attachmentSecurity: 0, boundaries: 0, intimacy: 0 },
          trend: 'stable',
        },
      },
      overall: {
        score: Math.round((recent.mindScore + recent.bodyScore + recent.soulScore + recent.relationshipsScore) / 4),
        stage: scoreToStage(Math.round((recent.mindScore + recent.bodyScore + recent.soulScore + recent.relationshipsScore) / 4)),
      },
      lastUpdated: recent.createdAt,
      freshness,
    };
  }

  // Calculate fresh health snapshot
  const data = await gatherHealthData(userId);
  const snapshot = calculateHealthSnapshot(data);

  // Get previous for trend calculation
  const previous = await prisma.integrationHealth.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Update trends if we have previous data
  if (previous) {
    snapshot.pillars.mind.trend = calculateTrend(snapshot.pillars.mind.score, previous.mindScore);
    snapshot.pillars.body.trend = calculateTrend(snapshot.pillars.body.score, previous.bodyScore);
    snapshot.pillars.soul.trend = calculateTrend(snapshot.pillars.soul.score, previous.soulScore);
    snapshot.pillars.relationships.trend = calculateTrend(snapshot.pillars.relationships.score, previous.relationshipsScore);
  }

  // Save to database
  await prisma.integrationHealth.create({
    data: {
      userId,
      mindScore: snapshot.pillars.mind.score,
      bodyScore: snapshot.pillars.body.score,
      soulScore: snapshot.pillars.soul.score,
      relationshipsScore: snapshot.pillars.relationships.score,
      mindStage: snapshot.pillars.mind.stage,
      bodyStage: snapshot.pillars.body.stage,
      soulStage: snapshot.pillars.soul.stage,
      relationshipsStage: snapshot.pillars.relationships.stage,
      dataSourcesUsed: JSON.stringify([
        data.assessments.archetype ? 'archetype' : null,
        data.assessments.attachment ? 'attachment' : null,
        data.assessments.nervousSystem ? 'nervous-system' : null,
        'journal',
        'courses',
        'profile',
      ].filter(Boolean)),
    },
  });

  // Update pillar health records
  await Promise.all(['mind', 'body', 'soul', 'relationships'].map(async (pillar) => {
    const pillarData = snapshot.pillars[pillar as Pillar];
    await prisma.pillarHealth.upsert({
      where: { userId_pillar: { userId, pillar } },
      create: {
        userId,
        pillar,
        stage: pillarData.stage,
        dimensions: JSON.stringify(pillarData.dimensions),
        trend: pillarData.trend,
      },
      update: {
        stage: pillarData.stage,
        dimensions: JSON.stringify(pillarData.dimensions),
        trend: pillarData.trend,
      },
    });
  }));

  return snapshot;
}

/**
 * Force recalculation of health (after significant events)
 */
export async function recalculateHealth(userId: string): Promise<HealthSnapshot> {
  const data = await gatherHealthData(userId);
  const snapshot = calculateHealthSnapshot(data);

  // Get previous for trend
  const previous = await prisma.integrationHealth.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (previous) {
    snapshot.pillars.mind.trend = calculateTrend(snapshot.pillars.mind.score, previous.mindScore);
    snapshot.pillars.body.trend = calculateTrend(snapshot.pillars.body.score, previous.bodyScore);
    snapshot.pillars.soul.trend = calculateTrend(snapshot.pillars.soul.score, previous.soulScore);
    snapshot.pillars.relationships.trend = calculateTrend(snapshot.pillars.relationships.score, previous.relationshipsScore);
  }

  // Save new snapshot
  await prisma.integrationHealth.create({
    data: {
      userId,
      mindScore: snapshot.pillars.mind.score,
      bodyScore: snapshot.pillars.body.score,
      soulScore: snapshot.pillars.soul.score,
      relationshipsScore: snapshot.pillars.relationships.score,
      mindStage: snapshot.pillars.mind.stage,
      bodyStage: snapshot.pillars.body.stage,
      soulStage: snapshot.pillars.soul.stage,
      relationshipsStage: snapshot.pillars.relationships.stage,
      dataSourcesUsed: JSON.stringify([
        data.assessments.archetype ? 'archetype' : null,
        data.assessments.attachment ? 'attachment' : null,
        data.assessments.nervousSystem ? 'nervous-system' : null,
        'journal',
        'courses',
        'profile',
      ].filter(Boolean)),
    },
  });

  return snapshot;
}

// STAGE_INFO and PILLAR_INFO are now re-exported from ./health-types
