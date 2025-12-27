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
  PHASE_1_QUESTIONS,
  PHASE_2_QUESTIONS,
  PHASE_3_QUESTIONS,
  calculateAssessmentResult,
  generatePortrait,
  checkSafety,
  PHASE_INFO,
} from '@/lib/assessment';
import type { Answer, Question } from '@/lib/assessment';

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
    const phase = searchParams.get('phase');
    const includeProgress = searchParams.get('includeProgress') === 'true';

    // Get user's current assessment progress
    let progress = null;
    if (includeProgress) {
      progress = await prisma.assessmentProgress.findUnique({
        where: { userId: session.user.id },
      });
    }

    // Return questions for specific phase or all
    let questions: Question[] = [];
    if (phase === '1') {
      questions = PHASE_1_QUESTIONS;
    } else if (phase === '2') {
      questions = PHASE_2_QUESTIONS;
    } else if (phase === '3') {
      questions = PHASE_3_QUESTIONS;
    } else {
      // Return all questions
      questions = [...PHASE_1_QUESTIONS, ...PHASE_2_QUESTIONS, ...PHASE_3_QUESTIONS];
    }

    return NextResponse.json({
      questions,
      phases: PHASE_INFO,
      progress: progress
        ? {
            phase: progress.currentPhase,
            answers: JSON.parse(progress.answers || '{}'),
            startedAt: progress.startedAt,
            lastUpdated: progress.updatedAt,
          }
        : null,
      totalQuestions: PHASE_1_QUESTIONS.length + PHASE_2_QUESTIONS.length + PHASE_3_QUESTIONS.length,
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
    const { answers, startedAt } = body as {
      answers: Record<string, Answer>;
      startedAt: string;
    };

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    // Parse startedAt
    const started = startedAt ? new Date(startedAt) : new Date();

    // Calculate results
    const result = calculateAssessmentResult(session.user.id, answers, started);

    // Check safety
    const safetyCheck = checkSafety(answers);

    // Generate portrait
    const portrait = generatePortrait(result);

    // Save to database
    await prisma.assessmentResult.create({
      data: {
        userId: session.user.id,
        type: 'integration',
        results: JSON.stringify({
          result,
          portrait,
          safetyCheck,
          version: '1.0.0',
        }),
      },
    });

    // Update integration health based on assessment
    await updateHealthFromAssessment(session.user.id, result);

    // Clear progress since assessment is complete
    await prisma.assessmentProgress.deleteMany({
      where: { userId: session.user.id },
    });

    // Update user profile to mark assessment as completed
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        onboardingCompleted: true,
      },
      update: {
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      result,
      portrait,
      safetyCheck,
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
    const { answers, currentPhase, startedAt } = body as {
      answers: Record<string, Answer>;
      currentPhase: number;
      startedAt?: string;
    };

    // Upsert progress
    await prisma.assessmentProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        answers: JSON.stringify(answers),
        currentPhase,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
      },
      update: {
        answers: JSON.stringify(answers),
        currentPhase,
      },
    });

    return NextResponse.json({
      success: true,
      saved: Object.keys(answers).length,
      currentPhase,
    });
  } catch (error) {
    console.error('Assessment PATCH error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}

// ============================================================================
// HELPER: Update Integration Health from Assessment
// ============================================================================

async function updateHealthFromAssessment(
  userId: string,
  result: ReturnType<typeof calculateAssessmentResult>
) {
  try {
    // Create new integration health snapshot
    await prisma.integrationHealth.create({
      data: {
        userId,
        mindScore: result.pillars.find((p) => p.pillar === 'mind')?.score ?? 50,
        bodyScore: result.pillars.find((p) => p.pillar === 'body')?.score ?? 50,
        soulScore: result.pillars.find((p) => p.pillar === 'soul')?.score ?? 50,
        relationshipsScore: result.pillars.find((p) => p.pillar === 'relationships')?.score ?? 50,
        mindStage: result.pillars.find((p) => p.pillar === 'mind')?.stage ?? 'regulation',
        bodyStage: result.pillars.find((p) => p.pillar === 'body')?.stage ?? 'regulation',
        soulStage: result.pillars.find((p) => p.pillar === 'soul')?.stage ?? 'regulation',
        relationshipsStage: result.pillars.find((p) => p.pillar === 'relationships')?.stage ?? 'regulation',
        dataSourcesUsed: JSON.stringify(['integration-assessment']),
      },
    });

    // Update pillar health records
    for (const pillar of result.pillars) {
      await prisma.pillarHealth.upsert({
        where: {
          userId_pillar: {
            userId,
            pillar: pillar.pillar,
          },
        },
        create: {
          userId,
          pillar: pillar.pillar,
          stage: pillar.stage,
          dimensions: JSON.stringify(
            pillar.dimensions.reduce((acc, d) => {
              acc[d.dimension] = d.normalizedScore;
              return acc;
            }, {} as Record<string, number>)
          ),
          trend: 'stable',
        },
        update: {
          stage: pillar.stage,
          dimensions: JSON.stringify(
            pillar.dimensions.reduce((acc, d) => {
              acc[d.dimension] = d.normalizedScore;
              return acc;
            }, {} as Record<string, number>)
          ),
        },
      });
    }
  } catch (error) {
    console.error('Failed to update health from assessment:', error);
    // Don't throw - health update is secondary
  }
}
