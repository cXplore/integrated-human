/**
 * Assessment API Route
 *
 * Handles:
 * - GET: Fetch questions and current progress
 * - POST: Submit answers and get results
 * - PATCH: Save progress (partial completion)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  QUESTIONS_BY_PILLAR,
  QUESTION_COUNTS,
  TOTAL_QUESTION_COUNT,
  generatePillarResult,
  generateIntegrationResult,
  generatePillarPortrait,
  generateIntegrationPortrait,
  getStageForScore,
  type PillarId,
  type Answer,
  type Question,
  type PillarAssessmentResult,
} from '@/lib/assessment';

// ============================================================================
// GET - Fetch questions and progress
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pillar = searchParams.get('pillar') as PillarId | null;
    const includeProgress = searchParams.get('includeProgress') === 'true';

    // Get user's current assessment progress
    let progress = null;
    if (includeProgress) {
      progress = await prisma.assessmentProgress.findUnique({
        where: { userId: session.user.id },
      });
    }

    // Return questions for specific pillar or all
    let questions: Question[] = [];
    if (pillar && QUESTIONS_BY_PILLAR[pillar]) {
      questions = QUESTIONS_BY_PILLAR[pillar];
    } else {
      // Return all questions organized by pillar
      questions = [
        ...QUESTIONS_BY_PILLAR.mind,
        ...QUESTIONS_BY_PILLAR.body,
        ...QUESTIONS_BY_PILLAR.soul,
        ...QUESTIONS_BY_PILLAR.relationships,
      ];
    }

    return NextResponse.json({
      questions,
      pillars: {
        mind: { count: QUESTION_COUNTS.mind },
        body: { count: QUESTION_COUNTS.body },
        soul: { count: QUESTION_COUNTS.soul },
        relationships: { count: QUESTION_COUNTS.relationships },
      },
      progress: progress
        ? {
            currentPillar: progress.currentPhase === 1 ? 'mind' :
                           progress.currentPhase === 2 ? 'body' :
                           progress.currentPhase === 3 ? 'soul' : 'relationships',
            answers: JSON.parse(progress.answers || '{}'),
            startedAt: progress.startedAt,
            lastUpdated: progress.updatedAt,
          }
        : null,
      totalQuestions: TOTAL_QUESTION_COUNT,
    });
  } catch (error) {
    console.error('Assessment GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
  }
}

// ============================================================================
// POST - Submit completed assessment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { answers, startedAt, pillar } = body as {
      answers: Record<string, Answer>;
      startedAt?: string;
      pillar?: PillarId;
    };

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    // Parse startedAt
    const started = startedAt ? new Date(startedAt) : new Date();
    const completed = new Date();

    // If submitting a single pillar
    if (pillar) {
      const pillarResult = generatePillarResult(session.user.id, pillar, answers, started);
      const pillarPortrait = generatePillarPortrait(pillarResult);

      // Save dimension health for this pillar
      await savePillarDimensionHealth(session.user.id, pillar, pillarResult);

      return NextResponse.json({
        success: true,
        pillar,
        result: pillarResult,
        portrait: pillarPortrait,
      });
    }

    // Full integration assessment - need to generate results for each pillar first
    const pillarIds: PillarId[] = ['mind', 'body', 'soul', 'relationships'];
    const pillarResults = pillarIds.map(pillarId =>
      generatePillarResult(session.user.id, pillarId, answers, started)
    );
    const result = generateIntegrationResult(session.user.id, pillarResults);
    const portrait = generateIntegrationPortrait(result);

    // Save to database
    await prisma.assessmentResult.create({
      data: {
        userId: session.user.id,
        type: 'integration',
        results: JSON.stringify({
          result,
          portrait,
          version: '2.0.0',
          completedAt: completed.toISOString(),
        }),
      },
    });

    // Update dimension health for all pillars
    for (const pillarResult of result.pillarResults) {
      await savePillarDimensionHealth(
        session.user.id,
        pillarResult.pillarId,
        pillarResult
      );
    }

    // Clear progress since assessment is complete
    await prisma.assessmentProgress.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      result,
      portrait,
    });
  } catch (error) {
    console.error('Assessment POST error:', error);
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Save progress (partial completion)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { answers, currentPillar, startedAt } = body as {
      answers: Record<string, Answer>;
      currentPillar: PillarId;
      startedAt?: string;
    };

    // Map pillar to phase number for compatibility
    const phaseMap: Record<PillarId, number> = {
      mind: 1,
      body: 2,
      soul: 3,
      relationships: 4,
    };

    // Upsert progress
    await prisma.assessmentProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        answers: JSON.stringify(answers),
        currentPhase: phaseMap[currentPillar] || 1,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
      },
      update: {
        answers: JSON.stringify(answers),
        currentPhase: phaseMap[currentPillar] || 1,
      },
    });

    return NextResponse.json({
      success: true,
      saved: Object.keys(answers).length,
      currentPillar,
    });
  } catch (error) {
    console.error('Assessment PATCH error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}

// ============================================================================
// HELPER: Save Pillar Dimension Health
// ============================================================================

async function savePillarDimensionHealth(
  userId: string,
  pillarId: PillarId,
  result: PillarAssessmentResult
) {
  try {
    const now = new Date();

    // Save each dimension's verified score
    for (const dim of result.dimensionScores) {
      await prisma.dimensionHealth.upsert({
        where: {
          userId_pillarId_dimensionId: {
            userId,
            pillarId,
            dimensionId: dim.dimensionId,
          },
        },
        create: {
          userId,
          pillarId,
          dimensionId: dim.dimensionId,
          verifiedScore: dim.score,
          stage: dim.stage,
          verifiedAt: now,
        },
        update: {
          verifiedScore: dim.score,
          stage: dim.stage,
          verifiedAt: now,
        },
      });

      // Clear any estimated score since we now have verified
      await prisma.dimensionEstimate.deleteMany({
        where: {
          userId,
          pillarId,
          dimensionId: dim.dimensionId,
        },
      });
    }

    // Update pillar health
    await prisma.pillarHealth.upsert({
      where: {
        userId_pillar: {
          userId,
          pillar: pillarId,
        },
      },
      create: {
        userId,
        pillar: pillarId,
        stage: result.overallStage,
        dimensions: JSON.stringify(
          result.dimensionScores.reduce((acc, d) => {
            acc[d.dimensionId] = d.score;
            return acc;
          }, {} as Record<string, number>)
        ),
        trend: 'stable',
      },
      update: {
        stage: result.overallStage,
        dimensions: JSON.stringify(
          result.dimensionScores.reduce((acc, d) => {
            acc[d.dimensionId] = d.score;
            return acc;
          }, {} as Record<string, number>)
        ),
      },
    });
  } catch (error) {
    console.error('Failed to save pillar dimension health:', error);
    // Don't throw - health update is secondary
  }
}
