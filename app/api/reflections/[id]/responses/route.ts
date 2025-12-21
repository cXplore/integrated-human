import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reflections/[id]/responses
 * Get responses for a reflection (anonymous)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const responses = await prisma.sharedReflectionResponse.findMany({
      where: { reflectionId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Return anonymous data - strip user IDs
    const anonymousResponses = responses.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ responses: anonymousResponses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reflections/[id]/responses
 * Add a response to a reflection (requires auth)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      return NextResponse.json(
        { error: 'Response must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Response must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Verify reflection exists
    const reflection = await prisma.sharedReflection.findUnique({
      where: { id },
    });

    if (!reflection) {
      return NextResponse.json(
        { error: 'Reflection not found' },
        { status: 404 }
      );
    }

    const response = await prisma.sharedReflectionResponse.create({
      data: {
        reflectionId: id,
        userId: session.user.id,
        content: content.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        createdAt: response.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json(
      { error: 'Failed to create response' },
      { status: 500 }
    );
  }
}
