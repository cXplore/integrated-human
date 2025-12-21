import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type AssessmentType = 'archetype' | 'attachment' | 'nervous-system' | 'values';

interface SaveAssessmentRequest {
  type: AssessmentType;
  results: Record<string, unknown>;
  summary?: string;
}

/**
 * GET /api/assessments
 * Returns all assessment results for the current user
 * Optional query param: ?type=archetype to get specific type
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AssessmentType | null;

    if (type) {
      // Get specific assessment
      const result = await prisma.assessmentResult.findUnique({
        where: {
          userId_type: { userId, type },
        },
      });

      if (!result) {
        return NextResponse.json({ result: null });
      }

      return NextResponse.json({
        result: {
          ...result,
          results: JSON.parse(result.results),
        },
      });
    }

    // Get all assessments
    const results = await prisma.assessmentResult.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      results: results.map(r => ({
        ...r,
        results: JSON.parse(r.results),
      })),
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assessments
 * Save or update an assessment result
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json() as SaveAssessmentRequest;

    const { type, results, summary } = body;

    if (!type || !results) {
      return NextResponse.json(
        { error: 'Type and results are required' },
        { status: 400 }
      );
    }

    const validTypes: AssessmentType[] = ['archetype', 'attachment', 'nervous-system', 'values'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid assessment type' },
        { status: 400 }
      );
    }

    // Upsert - create or update
    const result = await prisma.assessmentResult.upsert({
      where: {
        userId_type: { userId, type },
      },
      update: {
        results: JSON.stringify(results),
        summary: summary || null,
      },
      create: {
        userId,
        type,
        results: JSON.stringify(results),
        summary: summary || null,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        results: JSON.parse(result.results),
      },
    });
  } catch (error) {
    console.error('Error saving assessment:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assessments?type=archetype
 * Delete an assessment result
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AssessmentType | null;

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    await prisma.assessmentResult.delete({
      where: {
        userId_type: { userId, type },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
