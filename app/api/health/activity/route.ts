/**
 * GROWTH ACTIVITY API
 *
 * POST /api/health/activity
 *   - Record a growth activity (course completion, article read, etc.)
 *   - Updates estimated scores for affected dimensions
 *
 * This is called when user completes content that maps to dimensions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getDimensionsForContent,
  getPointsForContentType,
} from '@/lib/assessment/content-mapping';
import {
  calculateEstimatedScore,
  getStageFromScore,
  type ScoreContributor,
} from '@/lib/assessment/dimension-health';
import type { PillarId } from '@/lib/assessment/types';

// =============================================================================
// POST - Record growth activity
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      activityType,
      referenceType,
      referenceId,
      title,
      customPoints,
      reason,
      // For direct dimension specification (e.g., AI insights)
      pillarId: directPillarId,
      dimensionId: directDimensionId,
    } = body as {
      activityType: 'course-complete' | 'article-read' | 'practice-done' | 'journal-entry' | 'ai-insight' | 'exercise-response';
      referenceType?: string;
      referenceId?: string;
      title?: string;
      customPoints?: number;
      reason?: string;
      pillarId?: PillarId;
      dimensionId?: string;
    };

    if (!activityType) {
      return NextResponse.json(
        { error: 'Missing activityType' },
        { status: 400 }
      );
    }

    // Determine which dimensions this activity affects
    let contributions: Array<{
      pillarId: PillarId;
      dimensionId: string;
      points: number;
    }> = [];

    if (directPillarId && directDimensionId) {
      // Direct dimension specification (e.g., from AI insights)
      contributions = [{
        pillarId: directPillarId,
        dimensionId: directDimensionId,
        points: customPoints || 2,
      }];
    } else if (referenceId && referenceType) {
      // Look up from content mapping
      const contentType = referenceType === 'course' ? 'course' :
                         referenceType === 'article' ? 'article' :
                         referenceType === 'practice' ? 'practice' : null;

      if (contentType) {
        contributions = getDimensionsForContent(contentType, referenceId);
      }
    }

    if (contributions.length === 0) {
      // Activity doesn't map to any dimensions, just record it
      await prisma.growthActivity.create({
        data: {
          userId: session.user.id,
          activityType,
          referenceType,
          referenceId,
          pillarId: 'mind', // Default
          dimensionId: 'self-awareness', // Default
          points: 0,
          reason: reason || title || 'Activity recorded',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Activity recorded but does not map to dimensions',
        dimensionsAffected: 0,
      });
    }

    // Record activity for each affected dimension
    const activityRecords = [];
    const updatedEstimates = [];

    for (const contribution of contributions) {
      // Record the activity
      const activity = await prisma.growthActivity.create({
        data: {
          userId: session.user.id,
          activityType,
          referenceType,
          referenceId,
          pillarId: contribution.pillarId,
          dimensionId: contribution.dimensionId,
          points: customPoints || contribution.points,
          reason: reason || title || `Completed ${referenceType}: ${referenceId}`,
        },
      });

      activityRecords.push(activity);

      // Get all activities for this dimension (last 90 days)
      const recentActivities = await prisma.growthActivity.findMany({
        where: {
          userId: session.user.id,
          pillarId: contribution.pillarId,
          dimensionId: contribution.dimensionId,
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Convert to ScoreContributors
      const contributors: ScoreContributor[] = recentActivities.map(a => ({
        type: a.activityType as any,
        reference: a.referenceId || '',
        points: a.points,
        date: a.createdAt,
        reason: a.reason || undefined,
      }));

      // Get current verified score if exists
      const verifiedHealth = await prisma.dimensionHealth.findUnique({
        where: {
          userId_pillarId_dimensionId: {
            userId: session.user.id,
            pillarId: contribution.pillarId,
            dimensionId: contribution.dimensionId,
          },
        },
      });

      // Calculate new estimated score
      const { estimatedScore, confidence } = calculateEstimatedScore(
        verifiedHealth?.verifiedScore ?? null,
        contributors
      );

      const estimatedStage = getStageFromScore(estimatedScore);
      const scoreDelta = verifiedHealth
        ? estimatedScore - verifiedHealth.verifiedScore
        : null;

      // Update or create estimate
      const estimate = await prisma.dimensionEstimate.upsert({
        where: {
          userId_pillarId_dimensionId: {
            userId: session.user.id,
            pillarId: contribution.pillarId,
            dimensionId: contribution.dimensionId,
          },
        },
        update: {
          estimatedScore,
          estimatedStage,
          confidence,
          contributors: JSON.stringify(contributors.slice(0, 20)), // Keep last 20
          verifiedScore: verifiedHealth?.verifiedScore,
          scoreDelta,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          pillarId: contribution.pillarId,
          dimensionId: contribution.dimensionId,
          estimatedScore,
          estimatedStage,
          confidence,
          contributors: JSON.stringify(contributors.slice(0, 20)),
          verifiedScore: verifiedHealth?.verifiedScore,
          scoreDelta,
        },
      });

      updatedEstimates.push({
        pillarId: contribution.pillarId,
        dimensionId: contribution.dimensionId,
        estimatedScore,
        estimatedStage,
        confidence,
        scoreDelta,
        pointsAdded: customPoints || contribution.points,
      });
    }

    return NextResponse.json({
      success: true,
      activitiesRecorded: activityRecords.length,
      dimensionsAffected: updatedEstimates.length,
      updates: updatedEstimates,
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json(
      { error: 'Failed to record activity' },
      { status: 500 }
    );
  }
}
