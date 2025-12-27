/**
 * DIMENSION HEALTH API
 *
 * GET /api/health/dimensions
 *   - Returns all dimension health (verified + estimated) for the user
 *   - Includes freshness status and reassessment prompts
 *
 * GET /api/health/dimensions?pillar=mind
 *   - Returns dimension health for a specific pillar
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateFreshness,
  calculateEstimatedScore,
  generateDimensionSummary,
  generatePillarSummary,
  type VerifiedDimensionScore,
  type EstimatedDimensionScore,
  type ScoreContributor,
} from '@/lib/assessment/dimension-health';
import { getPillarById, ASSESSMENT_FRAMEWORK } from '@/lib/assessment/framework';
import type { PillarId, DevelopmentStage } from '@/lib/assessment/types';

// =============================================================================
// GET - Fetch dimension health for user
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pillarFilter = searchParams.get('pillar') as PillarId | null;

    // Fetch verified scores
    const verifiedScores = await prisma.dimensionHealth.findMany({
      where: {
        userId: session.user.id,
        ...(pillarFilter ? { pillarId: pillarFilter } : {}),
      },
    });

    // Fetch estimated scores
    const estimatedScores = await prisma.dimensionEstimate.findMany({
      where: {
        userId: session.user.id,
        ...(pillarFilter ? { pillarId: pillarFilter } : {}),
      },
    });

    // Fetch recent growth activities for context
    const recentActivities = await prisma.growthActivity.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
        ...(pillarFilter ? { pillarId: pillarFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

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

    // Group activities by dimension
    const activitiesByDimension = new Map<string, ScoreContributor[]>();
    for (const a of recentActivities) {
      const key = `${a.pillarId}:${a.dimensionId}`;
      if (!activitiesByDimension.has(key)) {
        activitiesByDimension.set(key, []);
      }
      activitiesByDimension.get(key)!.push({
        type: a.activityType as any,
        reference: a.referenceId || '',
        points: a.points,
        date: a.createdAt,
        reason: a.reason || undefined,
      });
    }

    // Build summaries for each pillar
    const pillars = pillarFilter
      ? [getPillarById(pillarFilter)].filter(Boolean)
      : ASSESSMENT_FRAMEWORK.pillars;

    const pillarSummaries = pillars.map(pillar => {
      if (!pillar) return null;

      const dimensionSummaries = pillar.dimensions.map(dim => {
        const key = `${pillar.id}:${dim.id}`;
        const verified = verifiedMap.get(key) || null;
        const estimated = estimatedMap.get(key) || null;

        return generateDimensionSummary(verified, estimated);
      });

      return generatePillarSummary(
        pillar.id as PillarId,
        pillar.name,
        dimensionSummaries
      );
    }).filter(Boolean);

    // Calculate overall stats
    const allDimensions = pillarSummaries.flatMap(p => p!.dimensions);
    const verifiedCount = allDimensions.filter(d => d.hasVerifiedScore).length;
    const totalDimensions = allDimensions.length;
    const needsReassessment = allDimensions.filter(d => d.showReassessPrompt);

    return NextResponse.json({
      pillars: pillarSummaries,
      stats: {
        totalDimensions,
        verifiedDimensions: verifiedCount,
        estimatedDimensions: allDimensions.filter(d => d.hasEstimatedScore).length,
        needsReassessmentCount: needsReassessment.length,
        overallCompleteness: Math.round((verifiedCount / totalDimensions) * 100),
      },
      reassessmentNeeded: needsReassessment.map(d => ({
        pillarId: d.pillarId,
        dimensionId: d.dimensionId,
        dimensionName: d.dimensionName,
        reason: d.reassessReason,
      })),
    });
  } catch (error) {
    console.error('Error fetching dimension health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dimension health' },
      { status: 500 }
    );
  }
}
