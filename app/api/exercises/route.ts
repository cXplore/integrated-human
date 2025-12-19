import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a specific exercise response
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ value: undefined });
    }

    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get('courseSlug');
    const moduleSlug = searchParams.get('moduleSlug');
    const exerciseId = searchParams.get('exerciseId');

    if (!courseSlug || !moduleSlug || !exerciseId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const response = await prisma.exerciseResponse.findUnique({
      where: {
        userId_courseSlug_moduleSlug_exerciseId: {
          userId: session.user.id,
          courseSlug,
          moduleSlug,
          exerciseId,
        },
      },
    });

    return NextResponse.json({
      value: response?.value,
      type: response?.type,
    });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    );
  }
}

// POST - Save an exercise response
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { courseSlug, moduleSlug, exerciseId, type, value } = await request.json();

    if (!courseSlug || !moduleSlug || !exerciseId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = await prisma.exerciseResponse.upsert({
      where: {
        userId_courseSlug_moduleSlug_exerciseId: {
          userId: session.user.id,
          courseSlug,
          moduleSlug,
          exerciseId,
        },
      },
      update: {
        value: value || '',
        type,
      },
      create: {
        userId: session.user.id,
        courseSlug,
        moduleSlug,
        exerciseId,
        type,
        value: value || '',
      },
    });

    return NextResponse.json({
      success: true,
      id: response.id,
    });
  } catch (error) {
    console.error('Error saving exercise:', error);
    return NextResponse.json(
      { error: 'Failed to save exercise' },
      { status: 500 }
    );
  }
}
