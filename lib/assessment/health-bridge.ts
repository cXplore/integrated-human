/**
 * HEALTH BRIDGE
 *
 * Connects the new two-layer dimension health system to the existing
 * integration health display. This acts as a bridge between:
 *
 * - Old system: Activity-based scoring (lib/integration-health.ts)
 * - New system: Verified (assessment) + Estimated (activity) scoring
 *
 * The bridge:
 * 1. Fetches dimension health from new tables if available
 * 2. Falls back to legacy activity-based calculation if not
 * 3. Aggregates dimensions into pillar scores for display
 * 4. Provides freshness/confidence indicators
 */

import { prisma } from '@/lib/prisma';
import type { PillarId, DevelopmentStage } from './types';
import {
  calculateFreshness,
  calculateEstimatedScore,
  generateDimensionSummary,
  generatePillarSummary,
  getStageDisplayInfo,
  type VerifiedDimensionScore,
  type EstimatedDimensionScore,
  type DimensionHealthSummary,
  type PillarHealthSummary,
  type ScoreContributor,
} from './dimension-health';
import { getPillarById, ASSESSMENT_FRAMEWORK } from './framework';

// =============================================================================
// TYPES
// =============================================================================

export interface HealthDisplayData {
  pillars: {
    [K in PillarId]: {
      // Display values
      score: number;
      stage: DevelopmentStage;
      stageInfo: { name: string; color: string; description: string };

      // Source info
      scoreSource: 'verified' | 'estimated' | 'legacy' | 'none';
      confidence?: number; // 0-100, only for estimated
      freshness?: 'fresh' | 'aging' | 'stale' | 'expired';
      verifiedAt?: Date;

      // Breakdown
      dimensions: DimensionDisplayData[];

      // Actions
      needsAssessment: boolean;
      needsReassessment: boolean;
      reassessmentReason?: string;
    };
  };
  overall: {
    score: number;
    stage: DevelopmentStage;
    stageInfo: { name: string; color: string; description: string };
    completeness: number; // 0-100: % of dimensions with verified scores
  };
  dataStatus: {
    hasNewSystemData: boolean;
    hasLegacyData: boolean;
    lastUpdated: Date;
  };
}

export interface DimensionDisplayData {
  dimensionId: string;
  dimensionName: string;
  score: number;
  stage: DevelopmentStage;
  scoreSource: 'verified' | 'estimated' | 'none';
  confidence?: number;
  freshness?: 'fresh' | 'aging' | 'stale' | 'expired';
  verifiedAt?: Date;
  estimatedDelta?: number; // How much estimated differs from verified
  showReassessPrompt: boolean;
  reassessReason?: string;
}

// =============================================================================
// MAIN BRIDGE FUNCTION
// =============================================================================

/**
 * Get health display data for a user
 * Combines new dimension health system with legacy fallback
 */
export async function getHealthDisplayData(userId: string): Promise<HealthDisplayData> {
  // Fetch all dimension data from new tables
  const [verifiedScores, estimatedScores, recentActivities] = await Promise.all([
    prisma.dimensionHealth.findMany({
      where: { userId },
    }),
    prisma.dimensionEstimate.findMany({
      where: { userId },
    }),
    prisma.growthActivity.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  const hasNewSystemData = verifiedScores.length > 0 || estimatedScores.length > 0;

  // Build verified score map
  const verifiedMap = new Map<string, VerifiedDimensionScore>();
  for (const v of verifiedScores) {
    const { freshness, daysOld } = calculateFreshness(v.verifiedAt);
    const pillar = getPillarById(v.pillarId);
    const dimension = pillar?.dimensions.find(d => d.id === v.dimensionId);

    verifiedMap.set(`${v.pillarId}:${v.dimensionId}`, {
      pillarId: v.pillarId as PillarId,
      dimensionId: v.dimensionId,
      dimensionName: dimension?.name || v.dimensionId,
      score: v.verifiedScore,
      stage: v.verifiedStage as DevelopmentStage,
      verifiedAt: v.verifiedAt,
      freshness,
      daysOld,
      facetScores: v.facetScores ? JSON.parse(v.facetScores) : undefined,
    });
  }

  // Build estimated score map
  const estimatedMap = new Map<string, EstimatedDimensionScore>();
  for (const e of estimatedScores) {
    const pillar = getPillarById(e.pillarId);
    const dimension = pillar?.dimensions.find(d => d.id === e.dimensionId);

    estimatedMap.set(`${e.pillarId}:${e.dimensionId}`, {
      pillarId: e.pillarId as PillarId,
      dimensionId: e.dimensionId,
      dimensionName: dimension?.name || e.dimensionId,
      estimatedScore: e.estimatedScore,
      estimatedStage: e.estimatedStage as DevelopmentStage,
      confidence: e.confidence,
      contributors: e.contributors ? JSON.parse(e.contributors) : [],
      verifiedScore: e.verifiedScore || undefined,
      scoreDelta: e.scoreDelta || undefined,
    });
  }

  // Build pillar summaries
  const pillarData: HealthDisplayData['pillars'] = {} as any;
  let totalVerifiedDimensions = 0;
  let totalDimensions = 0;

  for (const pillarDef of ASSESSMENT_FRAMEWORK.pillars) {
    const pillarId = pillarDef.id as PillarId;
    const dimensionDisplays: DimensionDisplayData[] = [];

    let pillarVerifiedTotal = 0;
    let pillarEstimatedTotal = 0;
    let verifiedCount = 0;
    let estimatedCount = 0;
    let worstFreshness: 'fresh' | 'aging' | 'stale' | 'expired' = 'fresh';
    let needsReassessment = false;
    let reassessmentReasons: string[] = [];

    for (const dim of pillarDef.dimensions) {
      const key = `${pillarId}:${dim.id}`;
      const verified = verifiedMap.get(key) || null;
      const estimated = estimatedMap.get(key) || null;

      totalDimensions++;

      const summary = generateDimensionSummary(verified, estimated);

      // Track verified vs estimated counts
      if (summary.hasVerifiedScore) {
        totalVerifiedDimensions++;
        verifiedCount++;
        pillarVerifiedTotal += verified!.score;

        // Track worst freshness
        if (verified!.freshness === 'expired') worstFreshness = 'expired';
        else if (verified!.freshness === 'stale' && worstFreshness !== 'expired')
          worstFreshness = 'stale';
        else if (verified!.freshness === 'aging' && worstFreshness === 'fresh')
          worstFreshness = 'aging';
      }

      if (summary.hasEstimatedScore) {
        estimatedCount++;
        pillarEstimatedTotal += estimated!.estimatedScore;
      }

      if (summary.showReassessPrompt) {
        needsReassessment = true;
        if (summary.reassessReason) {
          reassessmentReasons.push(`${dim.name}: ${summary.reassessReason}`);
        }
      }

      dimensionDisplays.push({
        dimensionId: dim.id,
        dimensionName: dim.name,
        score: summary.displayScore,
        stage: summary.displayStage,
        scoreSource: summary.scoreSource,
        confidence: estimated?.confidence,
        freshness: verified?.freshness,
        verifiedAt: verified?.verifiedAt,
        estimatedDelta: estimated?.scoreDelta,
        showReassessPrompt: summary.showReassessPrompt,
        reassessReason: summary.reassessReason,
      });
    }

    // Calculate pillar score
    let pillarScore: number;
    let scoreSource: 'verified' | 'estimated' | 'legacy' | 'none';

    if (verifiedCount > 0) {
      // Use average of verified scores (prioritize verified)
      pillarScore = Math.round(pillarVerifiedTotal / verifiedCount);
      scoreSource = 'verified';
    } else if (estimatedCount > 0) {
      // Fall back to estimated
      pillarScore = Math.round(pillarEstimatedTotal / estimatedCount);
      scoreSource = 'estimated';
    } else {
      // No data at all
      pillarScore = 40; // Default to middle of regulation
      scoreSource = 'none';
    }

    const pillarStage = getStageFromScore(pillarScore);
    const stageInfo = getStageDisplayInfo(pillarStage);

    pillarData[pillarId] = {
      score: pillarScore,
      stage: pillarStage,
      stageInfo,
      scoreSource,
      confidence:
        scoreSource === 'estimated'
          ? Math.round(
              dimensionDisplays
                .filter(d => d.confidence !== undefined)
                .reduce((sum, d) => sum + d.confidence!, 0) /
                estimatedCount
            )
          : undefined,
      freshness: scoreSource === 'verified' ? worstFreshness : undefined,
      verifiedAt:
        scoreSource === 'verified'
          ? verifiedScores.find(v => v.pillarId === pillarId)?.verifiedAt
          : undefined,
      dimensions: dimensionDisplays,
      needsAssessment: verifiedCount === 0,
      needsReassessment,
      reassessmentReason:
        reassessmentReasons.length > 0 ? reassessmentReasons[0] : undefined,
    };
  }

  // Calculate overall score
  const pillarScores = Object.values(pillarData).map(p => p.score);
  const overallScore = Math.round(
    pillarScores.reduce((sum, s) => sum + s, 0) / pillarScores.length
  );
  const overallStage = getStageFromScore(overallScore);
  const overallStageInfo = getStageDisplayInfo(overallStage);

  return {
    pillars: pillarData,
    overall: {
      score: overallScore,
      stage: overallStage,
      stageInfo: overallStageInfo,
      completeness: Math.round((totalVerifiedDimensions / totalDimensions) * 100),
    },
    dataStatus: {
      hasNewSystemData,
      hasLegacyData: false, // We're not checking legacy here
      lastUpdated: new Date(),
    },
  };
}

/**
 * Get simple stage from score
 */
function getStageFromScore(score: number): DevelopmentStage {
  if (score <= 20) return 'collapse';
  if (score <= 40) return 'regulation';
  if (score <= 60) return 'integration';
  if (score <= 80) return 'embodiment';
  return 'optimization';
}

// =============================================================================
// SYNC FUNCTIONS
// =============================================================================

/**
 * Sync new dimension health data to legacy IntegrationHealth table
 * Call this after assessment completion or significant activity
 */
export async function syncToLegacyHealth(userId: string): Promise<void> {
  const displayData = await getHealthDisplayData(userId);

  // Update IntegrationHealth
  await prisma.integrationHealth.create({
    data: {
      userId,
      mindScore: displayData.pillars.mind.score,
      bodyScore: displayData.pillars.body.score,
      soulScore: displayData.pillars.soul.score,
      relationshipsScore: displayData.pillars.relationships.score,
      mindStage: displayData.pillars.mind.stage,
      bodyStage: displayData.pillars.body.stage,
      soulStage: displayData.pillars.soul.stage,
      relationshipsStage: displayData.pillars.relationships.stage,
      dataSourcesUsed: JSON.stringify(['dimension-health', 'dimension-estimate']),
    },
  });

  // Update PillarHealth for each pillar
  const pillars: PillarId[] = ['mind', 'body', 'soul', 'relationships'];
  for (const pillarId of pillars) {
    const pillar = displayData.pillars[pillarId];

    await prisma.pillarHealth.upsert({
      where: { userId_pillar: { userId, pillar: pillarId } },
      create: {
        userId,
        pillar: pillarId,
        stage: pillar.stage,
        dimensions: JSON.stringify(
          pillar.dimensions.reduce(
            (acc, d) => {
              acc[d.dimensionId] = d.score;
              return acc;
            },
            {} as Record<string, number>
          )
        ),
        trend: 'stable',
      },
      update: {
        stage: pillar.stage,
        dimensions: JSON.stringify(
          pillar.dimensions.reduce(
            (acc, d) => {
              acc[d.dimensionId] = d.score;
              return acc;
            },
            {} as Record<string, number>
          )
        ),
      },
    });
  }
}

/**
 * Update estimates for dimensions after recording activity
 * This recalculates the estimated score based on all recent activities
 */
export async function updateDimensionEstimates(
  userId: string,
  pillarId: PillarId,
  dimensionId: string
): Promise<void> {
  // Get verified score if exists
  const verified = await prisma.dimensionHealth.findUnique({
    where: {
      userId_pillarId_dimensionId: {
        userId,
        pillarId,
        dimensionId,
      },
    },
  });

  // Get all recent activities for this dimension
  const activities = await prisma.growthActivity.findMany({
    where: {
      userId,
      pillarId,
      dimensionId,
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Convert to contributors
  const contributors: ScoreContributor[] = activities.map(a => ({
    type: a.activityType as any,
    reference: a.referenceId || '',
    points: a.points,
    date: a.createdAt,
    reason: a.reason || undefined,
  }));

  // Calculate new estimate
  const { estimatedScore, confidence } = calculateEstimatedScore(
    verified?.verifiedScore ?? null,
    contributors
  );

  const estimatedStage = getStageFromScore(estimatedScore);
  const scoreDelta = verified ? estimatedScore - verified.verifiedScore : null;

  // Upsert the estimate
  await prisma.dimensionEstimate.upsert({
    where: {
      userId_pillarId_dimensionId: {
        userId,
        pillarId,
        dimensionId,
      },
    },
    update: {
      estimatedScore,
      estimatedStage,
      confidence,
      contributors: JSON.stringify(contributors.slice(0, 20)),
      verifiedScore: verified?.verifiedScore,
      scoreDelta,
      updatedAt: new Date(),
    },
    create: {
      userId,
      pillarId,
      dimensionId,
      estimatedScore,
      estimatedStage,
      confidence,
      contributors: JSON.stringify(contributors.slice(0, 20)),
      verifiedScore: verified?.verifiedScore,
      scoreDelta,
    },
  });
}

// =============================================================================
// MIGRATION HELPER
// =============================================================================

/**
 * Migrate legacy pillar health data to new dimension system
 * This creates estimated scores from existing activity-based calculations
 */
export async function migrateLegacyToNewSystem(userId: string): Promise<void> {
  // Get existing pillar health
  const legacyHealth = await prisma.pillarHealth.findMany({
    where: { userId },
  });

  if (legacyHealth.length === 0) {
    return; // No legacy data to migrate
  }

  // For each pillar, create dimension estimates based on legacy dimensions
  for (const legacy of legacyHealth) {
    const pillarId = legacy.pillar as PillarId;
    const pillarDef = getPillarById(pillarId);

    if (!pillarDef) continue;

    // Parse legacy dimensions if they exist
    let legacyDimensions: Record<string, number> = {};
    if (legacy.dimensions) {
      try {
        legacyDimensions = JSON.parse(legacy.dimensions);
      } catch {
        // Invalid JSON, skip
      }
    }

    // Create estimates for each dimension in the new system
    for (const dim of pillarDef.dimensions) {
      // Try to map from legacy dimension names
      // Legacy had things like "shadowWork", new has "emotional-regulation"
      // This is a best-effort mapping
      const legacyScore = findClosestLegacyScore(dim.id, legacyDimensions);

      if (legacyScore !== null) {
        const stage = getStageFromScore(legacyScore);

        await prisma.dimensionEstimate.upsert({
          where: {
            userId_pillarId_dimensionId: {
              userId,
              pillarId,
              dimensionId: dim.id,
            },
          },
          update: {
            // Don't overwrite if already exists
          },
          create: {
            userId,
            pillarId,
            dimensionId: dim.id,
            estimatedScore: legacyScore,
            estimatedStage: stage,
            confidence: 30, // Low confidence for migrated data
            contributors: JSON.stringify([
              {
                type: 'legacy-migration',
                reference: 'pillar-health',
                points: 0,
                date: new Date(),
                reason: 'Migrated from legacy pillar health',
              },
            ]),
          },
        });
      }
    }
  }
}

/**
 * Find closest matching legacy score for a dimension
 */
function findClosestLegacyScore(
  dimensionId: string,
  legacyDimensions: Record<string, number>
): number | null {
  // Direct mappings from old to new
  const mappings: Record<string, string[]> = {
    // Mind
    'emotional-regulation': ['emotionalIntelligence', 'emotionalRegulation'],
    'cognitive-flexibility': ['cognitiveClarity', 'mentalClarity'],
    'self-awareness': ['shadowWork', 'selfAwareness'],
    'pattern-recognition': ['patternRecognition', 'cognitiveClarity'],

    // Body
    'nervous-system': ['nervousSystem', 'nervousSystemRegulation'],
    embodiment: ['embodiment', 'somaticAwareness'],
    vitality: ['physicalVitality', 'energy'],

    // Soul
    presence: ['presence', 'mindfulness'],
    meaning: ['meaningfulness', 'purpose'],
    'spiritual-practice': ['spiritualPractice', 'contemplativePractice'],

    // Relationships
    attachment: ['attachmentSecurity', 'attachmentHealth'],
    boundaries: ['boundaries', 'healthyBoundaries'],
    intimacy: ['intimacy', 'connectionCapacity'],
  };

  const possibleKeys = mappings[dimensionId] || [];

  for (const key of possibleKeys) {
    if (key in legacyDimensions) {
      return legacyDimensions[key];
    }
  }

  // If no mapping found, return null
  return null;
}
