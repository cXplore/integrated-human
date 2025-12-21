import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const TOPICS = ['shadow', 'growth', 'relationships', 'meaning', 'healing', 'general'];
const MOODS = ['grateful', 'struggling', 'hopeful', 'confused', 'peaceful', 'reflective'];

/**
 * GET /api/reflections
 * Get shared reflections (anonymous - no user info returned)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');

    const where = topic && topic !== 'all' ? { topic } : {};

    const reflections = await prisma.sharedReflection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    const hasMore = reflections.length > limit;
    const items = hasMore ? reflections.slice(0, -1) : reflections;

    // Return anonymous data - strip user IDs
    const anonymousReflections = items.map((r) => ({
      id: r.id,
      content: r.content,
      topic: r.topic,
      mood: r.mood,
      responseCount: r._count.responses,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      reflections: anonymousReflections,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (error) {
    console.error('Error fetching reflections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reflections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reflections
 * Create a new shared reflection (requires auth)
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

    const body = await request.json();
    const { content, topic, mood } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reflection must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Reflection must be less than 2000 characters' },
        { status: 400 }
      );
    }

    if (topic && !TOPICS.includes(topic)) {
      return NextResponse.json(
        { error: 'Invalid topic' },
        { status: 400 }
      );
    }

    if (mood && !MOODS.includes(mood)) {
      return NextResponse.json(
        { error: 'Invalid mood' },
        { status: 400 }
      );
    }

    const reflection = await prisma.sharedReflection.create({
      data: {
        userId: session.user.id,
        content: content.trim(),
        topic: topic || 'general',
        mood: mood || null,
      },
    });

    return NextResponse.json({
      success: true,
      reflection: {
        id: reflection.id,
        content: reflection.content,
        topic: reflection.topic,
        mood: reflection.mood,
        createdAt: reflection.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating reflection:', error);
    return NextResponse.json(
      { error: 'Failed to create reflection' },
      { status: 500 }
    );
  }
}
