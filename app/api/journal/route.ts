import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch journal entries
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
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const rawOffset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 20 : rawLimit));
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);
    const tag = searchParams.get('tag');

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: session.user.id,
        ...(tag && {
          tags: {
            contains: tag,
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.journalEntry.count({
      where: {
        userId: session.user.id,
        ...(tag && {
          tags: {
            contains: tag,
          },
        }),
      },
    });

    return NextResponse.json({
      entries,
      total,
      hasMore: offset + entries.length < total,
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}

// POST - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { title, content, promptId, mood, tags } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title: title || null,
        content: content.trim(),
        promptId: promptId || null,
        mood: mood || null,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}
