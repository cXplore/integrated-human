import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all journal-type exercise responses from courses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Bounds checking for pagination
    const rawLimit = parseInt(searchParams.get('limit') || '50');
    const rawOffset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 50 : rawLimit));
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);
    const courseSlug = searchParams.get('courseSlug');

    const entries = await prisma.exerciseResponse.findMany({
      where: {
        userId: session.user.id,
        type: 'journal',
        ...(courseSlug && { courseSlug }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.exerciseResponse.count({
      where: {
        userId: session.user.id,
        type: 'journal',
        ...(courseSlug && { courseSlug }),
      },
    });

    return NextResponse.json({
      entries,
      total,
      hasMore: offset + entries.length < total,
    });
  } catch (error) {
    console.error('Error fetching course journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course journal entries' },
      { status: 500 }
    );
  }
}
