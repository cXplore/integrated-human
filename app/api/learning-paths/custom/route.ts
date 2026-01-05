import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  generateCustomPath,
  type DimensionScore,
  type PathGenerationOptions,
  type CustomLearningPath,
} from '@/lib/custom-learning-path';
import { type PillarId } from '@/lib/assessment/types';
import { type SpectrumStage } from '@/lib/integration-health';

// GET - Fetch user's custom learning paths
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paths = await (prisma as any).customLearningPath.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      paths: paths.map((p: any) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        primaryPillar: p.primaryPillar,
        targetDimensions: JSON.parse(p.targetDimensions),
        completedSteps: JSON.parse(p.completedSteps),
        currentStepIndex: p.currentStepIndex,
        isActive: p.isActive,
        startedAt: p.startedAt,
        lastActivityAt: p.lastActivityAt,
        completedAt: p.completedAt,
        pathData: JSON.parse(p.pathData),
      })),
    });
  } catch (error) {
    console.error('Error fetching custom paths:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom paths' },
      { status: 500 }
    );
  }
}

// POST - Generate a new custom learning path from assessment
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { focusPillar, focusDimension, maxSteps, includeOptional } = body;

    // Fetch user's dimension health scores
    const dimensionHealthRecords = await prisma.dimensionHealth.findMany({
      where: { userId: session.user.id },
    });

    if (dimensionHealthRecords.length === 0) {
      return NextResponse.json(
        { error: 'No assessment data found. Please complete an assessment first.' },
        { status: 400 }
      );
    }

    // Convert to DimensionScore format
    const dimensionScores: DimensionScore[] = dimensionHealthRecords.map(record => ({
      pillarId: record.pillarId as PillarId,
      dimensionId: record.dimensionId,
      dimensionName: formatDimensionName(record.dimensionId),
      score: record.verifiedScore,
      stage: record.verifiedStage as SpectrumStage,
    }));

    // Generate the custom path
    const options: PathGenerationOptions = {
      userId: session.user.id,
      dimensionScores,
      maxSteps: maxSteps || 12,
      focusPillar: focusPillar as PillarId | undefined,
      focusDimension,
      includeOptional: includeOptional ?? false,
    };

    const customPath = generateCustomPath(options);

    // Deactivate any existing active paths (user can only have one active)
    await (prisma as any).customLearningPath.updateMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Save the new path to database
    const savedPath = await (prisma as any).customLearningPath.create({
      data: {
        userId: session.user.id,
        title: customPath.title,
        subtitle: customPath.subtitle,
        description: customPath.description,
        pathData: JSON.stringify(customPath),
        primaryPillar: customPath.primaryPillar,
        targetDimensions: JSON.stringify(customPath.targetDimensions),
        completedSteps: '[]',
        currentStepIndex: 0,
        isActive: true,
        startedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      path: customPath,
      savedPathId: savedPath.id,
    });
  } catch (error) {
    console.error('Error generating custom path:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom path' },
      { status: 500 }
    );
  }
}

// PATCH - Update progress on a custom path
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pathId, completedStepSlug, currentStepIndex } = body;

    if (!pathId) {
      return NextResponse.json({ error: 'Path ID required' }, { status: 400 });
    }

    // Fetch the path
    const path = await (prisma as any).customLearningPath.findUnique({
      where: { id: pathId },
    });

    if (!path || path.userId !== session.user.id) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    // Update completed steps if provided
    let completedSteps: string[] = JSON.parse(path.completedSteps);
    if (completedStepSlug && !completedSteps.includes(completedStepSlug)) {
      completedSteps.push(completedStepSlug);
    }

    // Check if path is now complete
    const pathData: CustomLearningPath = JSON.parse(path.pathData);
    const totalSteps = pathData.steps.length;
    const isComplete = completedSteps.length >= totalSteps;

    // Update the path
    const updated = await (prisma as any).customLearningPath.update({
      where: { id: pathId },
      data: {
        completedSteps: JSON.stringify(completedSteps),
        currentStepIndex: currentStepIndex ?? path.currentStepIndex,
        lastActivityAt: new Date(),
        completedAt: isComplete ? new Date() : null,
        isActive: !isComplete,
      },
    });

    return NextResponse.json({
      success: true,
      completedSteps,
      currentStepIndex: updated.currentStepIndex,
      isComplete,
      progress: Math.round((completedSteps.length / totalSteps) * 100),
    });
  } catch (error) {
    console.error('Error updating path progress:', error);
    return NextResponse.json(
      { error: 'Failed to update path progress' },
      { status: 500 }
    );
  }
}

// Helper to format dimension ID to display name
function formatDimensionName(dimensionId: string): string {
  return dimensionId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
