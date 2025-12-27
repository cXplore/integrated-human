/**
 * DIMENSION HEALTH SYSTEM
 *
 * Two-layer health tracking:
 * 1. Verified Score - Only updated through assessment/reassessment
 * 2. Estimated Score - Updated based on activity, content, AI insights
 *
 * Verified scores decay over time:
 * - Fresh: < 30 days (full confidence)
 * - Aging: 30-90 days (shown with note)
 * - Stale: 90-180 days (prompt to reassess)
 * - Expired: > 180 days (no longer shown as verified)
 */

import type { PillarId, DevelopmentStage, DimensionScore } from './types';
import { getStageForScore } from './framework';
import { getDimensionsForContent, getPointsForContentType } from './content-mapping';

// =============================================================================
// TYPES
// =============================================================================

export interface VerifiedDimensionScore {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;
  score: number;
  stage: DevelopmentStage;
  verifiedAt: Date;
  freshness: 'fresh' | 'aging' | 'stale' | 'expired';
  daysOld: number;
  facetScores?: Record<string, number>;
}

export interface EstimatedDimensionScore {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;
  estimatedScore: number;
  estimatedStage: DevelopmentStage;
  confidence: number;  // 0-100
  contributors: ScoreContributor[];
  verifiedScore?: number;
  scoreDelta?: number;  // How much estimated differs from verified
}

export interface ScoreContributor {
  type: 'course' | 'article' | 'practice' | 'journal' | 'ai-insight' | 'exercise';
  reference: string;    // slug or id
  title?: string;       // Human-readable
  points: number;
  date: Date;
  reason?: string;
}

export interface DimensionHealthSummary {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;

  // Verified layer
  verified?: VerifiedDimensionScore;
  hasVerifiedScore: boolean;

  // Estimated layer
  estimated?: EstimatedDimensionScore;
  hasEstimatedScore: boolean;

  // Comparison
  showReassessPrompt: boolean;
  reassessReason?: string;

  // Display score (verified if fresh, otherwise estimated with indicator)
  displayScore: number;
  displayStage: DevelopmentStage;
  scoreSource: 'verified' | 'estimated' | 'none';
}

export interface PillarHealthSummary {
  pillarId: PillarId;
  pillarName: string;

  // Aggregate scores
  verifiedScore?: number;
  verifiedStage?: DevelopmentStage;
  estimatedScore?: number;
  estimatedStage?: DevelopmentStage;

  // Dimensions
  dimensions: DimensionHealthSummary[];

  // Overall freshness
  overallFreshness: 'fresh' | 'aging' | 'stale' | 'expired' | 'none';

  // Reassessment
  needsReassessment: boolean;
  reassessmentDimensions: string[];
}

// =============================================================================
// FRESHNESS CALCULATION
// =============================================================================

const FRESHNESS_THRESHOLDS = {
  fresh: 30,    // < 30 days
  aging: 90,    // 30-90 days
  stale: 180,   // 90-180 days
  // > 180 = expired
};

export function calculateFreshness(verifiedAt: Date): {
  freshness: 'fresh' | 'aging' | 'stale' | 'expired';
  daysOld: number;
} {
  const now = new Date();
  const daysOld = Math.floor(
    (now.getTime() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  let freshness: 'fresh' | 'aging' | 'stale' | 'expired';

  if (daysOld < FRESHNESS_THRESHOLDS.fresh) {
    freshness = 'fresh';
  } else if (daysOld < FRESHNESS_THRESHOLDS.aging) {
    freshness = 'aging';
  } else if (daysOld < FRESHNESS_THRESHOLDS.stale) {
    freshness = 'stale';
  } else {
    freshness = 'expired';
  }

  return { freshness, daysOld };
}

/**
 * Get decay factor for verified score based on freshness
 * Used to reduce confidence in old scores
 */
export function getFreshnessDecayFactor(
  freshness: 'fresh' | 'aging' | 'stale' | 'expired'
): number {
  switch (freshness) {
    case 'fresh':
      return 1.0;    // Full confidence
    case 'aging':
      return 0.85;   // Slight decay
    case 'stale':
      return 0.6;    // Significant decay
    case 'expired':
      return 0.3;    // Mostly unreliable
  }
}

// =============================================================================
// ESTIMATED SCORE CALCULATION
// =============================================================================

/**
 * Base estimated score when no verified score exists
 */
const DEFAULT_BASE_SCORE = 40; // Middle of regulation stage

/**
 * Maximum points from activity before diminishing returns
 */
const MAX_ACTIVITY_POINTS = 40;

/**
 * Calculate estimated score from activities
 */
export function calculateEstimatedScore(
  verifiedScore: number | null,
  activities: ScoreContributor[]
): {
  estimatedScore: number;
  confidence: number;
  contributors: ScoreContributor[];
} {
  // Start from verified score or default
  const baseScore = verifiedScore ?? DEFAULT_BASE_SCORE;

  // Sum up activity points
  let totalPoints = 0;
  const recentActivities = activities.filter(a => {
    const daysAgo = Math.floor(
      (Date.now() - a.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysAgo <= 90; // Only count last 90 days
  });

  for (const activity of recentActivities) {
    totalPoints += activity.points;
  }

  // Apply diminishing returns
  const adjustedPoints = Math.min(totalPoints, MAX_ACTIVITY_POINTS);

  // Calculate estimated score
  let estimatedScore = baseScore + adjustedPoints;
  estimatedScore = Math.max(0, Math.min(100, estimatedScore));

  // Calculate confidence based on activity volume
  // More activities = higher confidence in estimate
  const activityCount = recentActivities.length;
  let confidence = 30; // Base confidence

  if (activityCount >= 10) {
    confidence = 80;
  } else if (activityCount >= 5) {
    confidence = 60;
  } else if (activityCount >= 2) {
    confidence = 45;
  }

  // If we have a verified score, confidence is higher
  if (verifiedScore !== null) {
    confidence = Math.min(90, confidence + 15);
  }

  return {
    estimatedScore: Math.round(estimatedScore),
    confidence,
    contributors: recentActivities,
  };
}

// =============================================================================
// ACTIVITY TRACKING
// =============================================================================

/**
 * Record a growth activity that contributes to estimated score
 */
export interface RecordActivityInput {
  userId: string;
  activityType: 'course' | 'article' | 'practice' | 'journal' | 'ai-insight' | 'exercise';
  referenceType?: string;
  referenceId?: string;
  title?: string;
  customPoints?: number;
  reason?: string;
}

/**
 * Get activity contributions for content completion
 */
export function getActivityContributions(
  contentType: 'course' | 'article' | 'practice',
  slug: string
): {
  pillarId: PillarId;
  dimensionId: string;
  points: number;
}[] {
  return getDimensionsForContent(contentType, slug);
}

// =============================================================================
// REASSESSMENT PROMPTS
// =============================================================================

export interface ReassessmentPrompt {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;
  reason: string;
  urgency: 'suggested' | 'recommended' | 'needed';
  verifiedScore?: number;
  estimatedScore?: number;
  daysOld?: number;
}

/**
 * Determine if reassessment should be prompted
 */
export function shouldPromptReassessment(
  verified: VerifiedDimensionScore | null,
  estimated: EstimatedDimensionScore | null
): ReassessmentPrompt | null {
  // No verified score ever - prompt to take initial assessment
  if (!verified) {
    return null; // They need full assessment first, not dimension reassessment
  }

  // Check freshness
  if (verified.freshness === 'expired') {
    return {
      pillarId: verified.pillarId,
      dimensionId: verified.dimensionId,
      dimensionName: verified.dimensionName,
      reason: `Your last assessment was ${verified.daysOld} days ago. Check in to see where you are now.`,
      urgency: 'needed',
      verifiedScore: verified.score,
      estimatedScore: estimated?.estimatedScore,
      daysOld: verified.daysOld,
    };
  }

  if (verified.freshness === 'stale') {
    return {
      pillarId: verified.pillarId,
      dimensionId: verified.dimensionId,
      dimensionName: verified.dimensionName,
      reason: `It's been ${verified.daysOld} days since your last assessment. Consider reassessing.`,
      urgency: 'recommended',
      verifiedScore: verified.score,
      estimatedScore: estimated?.estimatedScore,
      daysOld: verified.daysOld,
    };
  }

  // Check if estimated diverges significantly from verified
  if (estimated && verified) {
    const delta = estimated.estimatedScore - verified.score;

    if (delta >= 15 && estimated.confidence >= 60) {
      return {
        pillarId: verified.pillarId,
        dimensionId: verified.dimensionId,
        dimensionName: verified.dimensionName,
        reason: `Your activity suggests growth in this area. Ready to see where you really are?`,
        urgency: 'suggested',
        verifiedScore: verified.score,
        estimatedScore: estimated.estimatedScore,
        daysOld: verified.daysOld,
      };
    }
  }

  return null;
}

// =============================================================================
// HEALTH SUMMARY GENERATION
// =============================================================================

/**
 * Generate display summary for a dimension
 */
export function generateDimensionSummary(
  verified: VerifiedDimensionScore | null,
  estimated: EstimatedDimensionScore | null
): DimensionHealthSummary {
  const pillarId = verified?.pillarId || estimated?.pillarId || 'mind';
  const dimensionId = verified?.dimensionId || estimated?.dimensionId || '';
  const dimensionName = verified?.dimensionName || estimated?.dimensionName || '';

  // Determine what to display
  let displayScore: number;
  let displayStage: DevelopmentStage;
  let scoreSource: 'verified' | 'estimated' | 'none';

  if (verified && verified.freshness !== 'expired') {
    // Show verified if not expired
    displayScore = verified.score;
    displayStage = verified.stage;
    scoreSource = 'verified';
  } else if (estimated) {
    // Fall back to estimated
    displayScore = estimated.estimatedScore;
    displayStage = estimated.estimatedStage;
    scoreSource = 'estimated';
  } else {
    // No data
    displayScore = 0;
    displayStage = 'regulation';
    scoreSource = 'none';
  }

  // Check for reassessment prompt
  const reassessPrompt = shouldPromptReassessment(verified, estimated);

  return {
    pillarId,
    dimensionId,
    dimensionName,
    verified: verified || undefined,
    hasVerifiedScore: verified !== null && verified.freshness !== 'expired',
    estimated: estimated || undefined,
    hasEstimatedScore: estimated !== null,
    showReassessPrompt: reassessPrompt !== null,
    reassessReason: reassessPrompt?.reason,
    displayScore,
    displayStage,
    scoreSource,
  };
}

/**
 * Generate pillar-level summary from dimension summaries
 */
export function generatePillarSummary(
  pillarId: PillarId,
  pillarName: string,
  dimensions: DimensionHealthSummary[]
): PillarHealthSummary {
  // Calculate aggregate verified score
  const verifiedDimensions = dimensions.filter(d => d.hasVerifiedScore);
  let verifiedScore: number | undefined;
  let verifiedStage: DevelopmentStage | undefined;

  if (verifiedDimensions.length > 0) {
    verifiedScore = Math.round(
      verifiedDimensions.reduce((sum, d) => sum + (d.verified?.score || 0), 0) /
      verifiedDimensions.length
    );
    verifiedStage = getStageForScore(verifiedScore).id;
  }

  // Calculate aggregate estimated score
  const estimatedDimensions = dimensions.filter(d => d.hasEstimatedScore);
  let estimatedScore: number | undefined;
  let estimatedStage: DevelopmentStage | undefined;

  if (estimatedDimensions.length > 0) {
    estimatedScore = Math.round(
      estimatedDimensions.reduce((sum, d) => sum + (d.estimated?.estimatedScore || 0), 0) /
      estimatedDimensions.length
    );
    estimatedStage = getStageForScore(estimatedScore).id;
  }

  // Determine overall freshness
  let overallFreshness: 'fresh' | 'aging' | 'stale' | 'expired' | 'none' = 'none';

  if (verifiedDimensions.length > 0) {
    const freshnesses = verifiedDimensions.map(d => d.verified?.freshness || 'expired');
    if (freshnesses.every(f => f === 'fresh')) {
      overallFreshness = 'fresh';
    } else if (freshnesses.every(f => f === 'expired')) {
      overallFreshness = 'expired';
    } else if (freshnesses.some(f => f === 'stale' || f === 'expired')) {
      overallFreshness = 'stale';
    } else {
      overallFreshness = 'aging';
    }
  }

  // Collect dimensions needing reassessment
  const reassessmentDimensions = dimensions
    .filter(d => d.showReassessPrompt)
    .map(d => d.dimensionId);

  return {
    pillarId,
    pillarName,
    verifiedScore,
    verifiedStage,
    estimatedScore,
    estimatedStage,
    dimensions,
    overallFreshness,
    needsReassessment: reassessmentDimensions.length > 0,
    reassessmentDimensions,
  };
}

// =============================================================================
// STAGE HELPERS
// =============================================================================

export function getStageFromScore(score: number): DevelopmentStage {
  return getStageForScore(score).id;
}

export function getStageDisplayInfo(stage: DevelopmentStage): {
  name: string;
  color: string;
  description: string;
} {
  const stageInfo: Record<DevelopmentStage, { name: string; color: string; description: string }> = {
    collapse: {
      name: 'Collapse',
      color: '#ef4444',
      description: 'Needs immediate attention and support',
    },
    regulation: {
      name: 'Regulation',
      color: '#f97316',
      description: 'Building foundational stability',
    },
    integration: {
      name: 'Integration',
      color: '#eab308',
      description: 'Actively developing and integrating',
    },
    embodiment: {
      name: 'Embodiment',
      color: '#22c55e',
      description: 'Naturally expressing development',
    },
    optimization: {
      name: 'Optimization',
      color: '#3b82f6',
      description: 'Refined and well-developed',
    },
  };

  return stageInfo[stage];
}
