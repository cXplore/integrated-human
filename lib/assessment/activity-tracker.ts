/**
 * ACTIVITY TRACKER
 *
 * Records user activities that contribute to dimension health estimates.
 * Called when users complete content, practice exercises, etc.
 */

import { prisma } from '@/lib/prisma';
import type { PillarId } from './types';
import { getDimensionsForContent, getPointsForContentType } from './content-mapping';
import { updateDimensionEstimates } from './health-bridge';

// =============================================================================
// TYPES
// =============================================================================

export interface RecordActivityInput {
  userId: string;
  contentType: 'course' | 'article' | 'practice';
  slug: string;
  title?: string;
  customPoints?: number;
}

export interface DirectActivityInput {
  userId: string;
  activityType: 'journal-entry' | 'ai-insight' | 'exercise-response' | 'practice-done';
  pillarId: PillarId;
  dimensionId: string;
  points?: number;
  reason?: string;
  referenceId?: string;
}

export interface ActivityResult {
  success: boolean;
  activitiesRecorded: number;
  dimensionsAffected: string[];
}

// =============================================================================
// CONTENT ACTIVITY RECORDING
// =============================================================================

/**
 * Record activity when user completes content (course, article, practice)
 * Automatically maps to relevant dimensions and updates estimates
 */
export async function recordContentActivity(
  input: RecordActivityInput
): Promise<ActivityResult> {
  const { userId, contentType, slug, title, customPoints } = input;

  // Find which dimensions this content affects
  const contributions = getDimensionsForContent(contentType, slug);

  if (contributions.length === 0) {
    // Content doesn't map to any dimensions - still record but with no impact
    await prisma.growthActivity.create({
      data: {
        userId,
        activityType: `${contentType}-complete`,
        referenceType: contentType,
        referenceId: slug,
        pillarId: 'mind', // Default
        dimensionId: 'self-awareness', // Default
        points: 0,
        reason: title || `Completed ${contentType}: ${slug}`,
      },
    });

    return {
      success: true,
      activitiesRecorded: 1,
      dimensionsAffected: [],
    };
  }

  // Record activity for each affected dimension
  const dimensionsAffected: string[] = [];

  for (const contribution of contributions) {
    const points = customPoints ?? contribution.points;

    await prisma.growthActivity.create({
      data: {
        userId,
        activityType: `${contentType}-complete`,
        referenceType: contentType,
        referenceId: slug,
        pillarId: contribution.pillarId,
        dimensionId: contribution.dimensionId,
        points,
        reason: title || `Completed ${contentType}: ${slug}`,
      },
    });

    dimensionsAffected.push(`${contribution.pillarId}:${contribution.dimensionId}`);

    // Update the dimension estimate
    try {
      await updateDimensionEstimates(userId, contribution.pillarId, contribution.dimensionId);
    } catch (error) {
      console.error('Failed to update dimension estimate:', error);
    }
  }

  return {
    success: true,
    activitiesRecorded: contributions.length,
    dimensionsAffected,
  };
}

// =============================================================================
// DIRECT ACTIVITY RECORDING
// =============================================================================

/**
 * Record activity that directly targets a specific dimension
 * Used for journal entries, AI insights, exercise responses, etc.
 */
export async function recordDirectActivity(
  input: DirectActivityInput
): Promise<ActivityResult> {
  const { userId, activityType, pillarId, dimensionId, points = 2, reason, referenceId } = input;

  await prisma.growthActivity.create({
    data: {
      userId,
      activityType,
      referenceType: activityType,
      referenceId,
      pillarId,
      dimensionId,
      points,
      reason: reason || `${activityType} activity`,
    },
  });

  // Update the dimension estimate
  try {
    await updateDimensionEstimates(userId, pillarId, dimensionId);
  } catch (error) {
    console.error('Failed to update dimension estimate:', error);
  }

  return {
    success: true,
    activitiesRecorded: 1,
    dimensionsAffected: [`${pillarId}:${dimensionId}`],
  };
}

// =============================================================================
// BULK ACTIVITY RECORDING
// =============================================================================

/**
 * Record multiple activities at once
 * Useful for AI analysis that identifies multiple growth areas
 */
export async function recordBulkActivities(
  userId: string,
  activities: Array<{
    pillarId: PillarId;
    dimensionId: string;
    points: number;
    reason: string;
    activityType?: string;
  }>
): Promise<ActivityResult> {
  const dimensionsAffected: string[] = [];

  for (const activity of activities) {
    await prisma.growthActivity.create({
      data: {
        userId,
        activityType: activity.activityType || 'ai-insight',
        pillarId: activity.pillarId,
        dimensionId: activity.dimensionId,
        points: activity.points,
        reason: activity.reason,
      },
    });

    dimensionsAffected.push(`${activity.pillarId}:${activity.dimensionId}`);
  }

  // Update estimates for all affected dimensions
  const uniqueDimensions = [...new Set(dimensionsAffected)];
  for (const dim of uniqueDimensions) {
    const [pillarId, dimensionId] = dim.split(':');
    try {
      await updateDimensionEstimates(userId, pillarId as PillarId, dimensionId);
    } catch (error) {
      console.error('Failed to update dimension estimate:', error);
    }
  }

  return {
    success: true,
    activitiesRecorded: activities.length,
    dimensionsAffected: uniqueDimensions,
  };
}

// =============================================================================
// ACTIVITY QUERYING
// =============================================================================

/**
 * Get recent activities for a user
 */
export async function getRecentActivities(
  userId: string,
  options: {
    pillarId?: PillarId;
    dimensionId?: string;
    days?: number;
    limit?: number;
  } = {}
): Promise<Array<{
  id: string;
  activityType: string;
  pillarId: string;
  dimensionId: string;
  points: number;
  reason: string | null;
  createdAt: Date;
}>> {
  const { pillarId, dimensionId, days = 90, limit = 50 } = options;

  const activities = await prisma.growthActivity.findMany({
    where: {
      userId,
      ...(pillarId ? { pillarId } : {}),
      ...(dimensionId ? { dimensionId } : {}),
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return activities;
}

/**
 * Get activity summary for a user
 */
export async function getActivitySummary(
  userId: string,
  days: number = 30
): Promise<{
  totalActivities: number;
  totalPoints: number;
  byPillar: Record<PillarId, { count: number; points: number }>;
  byType: Record<string, number>;
  mostActiveDimensions: Array<{ pillarId: string; dimensionId: string; count: number }>;
}> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const activities = await prisma.growthActivity.findMany({
    where: {
      userId,
      createdAt: { gte: cutoff },
    },
  });

  const byPillar: Record<PillarId, { count: number; points: number }> = {
    mind: { count: 0, points: 0 },
    body: { count: 0, points: 0 },
    soul: { count: 0, points: 0 },
    relationships: { count: 0, points: 0 },
  };

  const byType: Record<string, number> = {};
  const dimensionCounts: Record<string, number> = {};

  for (const activity of activities) {
    const pillarId = activity.pillarId as PillarId;
    if (byPillar[pillarId]) {
      byPillar[pillarId].count++;
      byPillar[pillarId].points += activity.points;
    }

    byType[activity.activityType] = (byType[activity.activityType] || 0) + 1;

    const dimKey = `${activity.pillarId}:${activity.dimensionId}`;
    dimensionCounts[dimKey] = (dimensionCounts[dimKey] || 0) + 1;
  }

  const mostActiveDimensions = Object.entries(dimensionCounts)
    .map(([key, count]) => {
      const [pillarId, dimensionId] = key.split(':');
      return { pillarId, dimensionId, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalActivities: activities.length,
    totalPoints: activities.reduce((sum, a) => sum + a.points, 0),
    byPillar,
    byType,
    mostActiveDimensions,
  };
}
