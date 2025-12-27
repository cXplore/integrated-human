/**
 * DIMENSION REASSESSMENT API
 *
 * GET /api/assessment/reassess?pillar=mind&dimension=emotional-regulation
 *   - Returns questions for reassessing a specific dimension
 *
 * POST /api/assessment/reassess
 *   - Submit reassessment answers and get new score
 *   - Updates DimensionHealth with verified score
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getReassessmentQuestions,
  scoreReassessment,
  interpretReassessment,
} from '@/lib/assessment/reassessment';
import { getStageForScore } from '@/lib/assessment/framework';
import type { PillarId, Answer } from '@/lib/assessment/types';

// =============================================================================
// GET - Fetch reassessment questions for a dimension
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pillarId = searchParams.get('pillar') as PillarId | null;
    const dimensionId = searchParams.get('dimension');

    if (!pillarId || !dimensionId) {
      return NextResponse.json(
        { error: 'Missing pillar or dimension parameter' },
        { status: 400 }
      );
    }

    // Validate pillar
    const validPillars: PillarId[] = ['mind', 'body', 'soul', 'relationships'];
    if (!validPillars.includes(pillarId)) {
      return NextResponse.json(
        { error: 'Invalid pillar' },
        { status: 400 }
      );
    }

    // Get questions for this dimension
    const questions = getReassessmentQuestions(pillarId, dimensionId);

    if (!questions) {
      return NextResponse.json(
        { error: 'Dimension not found' },
        { status: 404 }
      );
    }

    // Get previous score if exists
    const previousHealth = await prisma.dimensionHealth.findUnique({
      where: {
        userId_pillarId_dimensionId: {
          userId: session.user.id,
          pillarId,
          dimensionId,
        },
      },
    });

    // Get estimated score if exists
    const estimatedScore = await prisma.dimensionEstimate.findUnique({
      where: {
        userId_pillarId_dimensionId: {
          userId: session.user.id,
          pillarId,
          dimensionId,
        },
      },
    });

    return NextResponse.json({
      ...questions,
      previousScore: previousHealth?.verifiedScore,
      previousStage: previousHealth?.verifiedStage,
      previousVerifiedAt: previousHealth?.verifiedAt,
      estimatedScore: estimatedScore?.estimatedScore,
      estimatedStage: estimatedScore?.estimatedStage,
    });
  } catch (error) {
    console.error('Error fetching reassessment questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Submit reassessment and update verified score
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pillarId, dimensionId, answers } = body as {
      pillarId: PillarId;
      dimensionId: string;
      answers: Record<string, Answer>;
    };

    if (!pillarId || !dimensionId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get previous scores
    const previousHealth = await prisma.dimensionHealth.findUnique({
      where: {
        userId_pillarId_dimensionId: {
          userId: session.user.id,
          pillarId,
          dimensionId,
        },
      },
    });

    const estimatedScore = await prisma.dimensionEstimate.findUnique({
      where: {
        userId_pillarId_dimensionId: {
          userId: session.user.id,
          pillarId,
          dimensionId,
        },
      },
    });

    // Score the reassessment
    const result = scoreReassessment(
      pillarId,
      dimensionId,
      answers,
      previousHealth?.verifiedScore,
      previousHealth?.verifiedStage as any
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to score reassessment' },
        { status: 500 }
      );
    }

    // Generate interpretation
    const comparison = interpretReassessment(
      result,
      estimatedScore?.estimatedScore
    );

    // Update or create DimensionHealth (verified score)
    await prisma.dimensionHealth.upsert({
      where: {
        userId_pillarId_dimensionId: {
          userId: session.user.id,
          pillarId,
          dimensionId,
        },
      },
      update: {
        verifiedScore: result.newScore,
        verifiedStage: result.newStage,
        verifiedAt: new Date(),
        facetScores: JSON.stringify(
          result.facetScores.reduce((acc, f) => {
            acc[f.facetId] = f.score;
            return acc;
          }, {} as Record<string, number>)
        ),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        pillarId,
        dimensionId,
        verifiedScore: result.newScore,
        verifiedStage: result.newStage,
        verifiedAt: new Date(),
        facetScores: JSON.stringify(
          result.facetScores.reduce((acc, f) => {
            acc[f.facetId] = f.score;
            return acc;
          }, {} as Record<string, number>)
        ),
      },
    });

    // Record the reassessment
    await prisma.dimensionReassessment.create({
      data: {
        userId: session.user.id,
        pillarId,
        dimensionId,
        previousScore: previousHealth?.verifiedScore ?? result.newScore,
        previousStage: previousHealth?.verifiedStage ?? result.newStage,
        newScore: result.newScore,
        newStage: result.newStage,
        scoreChange: result.scoreChange ?? 0,
        answers: JSON.stringify(answers),
        estimatedScoreAtTime: estimatedScore?.estimatedScore,
      },
    });

    // Update the estimate to match verified (reset delta)
    if (estimatedScore) {
      await prisma.dimensionEstimate.update({
        where: {
          userId_pillarId_dimensionId: {
            userId: session.user.id,
            pillarId,
            dimensionId,
          },
        },
        data: {
          verifiedScore: result.newScore,
          scoreDelta: 0,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      result,
      comparison,
    });
  } catch (error) {
    console.error('Error submitting reassessment:', error);
    return NextResponse.json(
      { error: 'Failed to submit reassessment' },
      { status: 500 }
    );
  }
}
