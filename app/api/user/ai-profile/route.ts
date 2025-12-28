import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/ai-profile
 * Get user's AI learning profile (triggers and preferences)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [triggers, preferences] = await Promise.all([
      prisma.triggerPattern.findMany({
        where: { userId },
        orderBy: [{ intensity: 'desc' }, { occurrenceCount: 'desc' }],
        select: {
          trigger: true,
          intensity: true,
          context: true,
          preferredResponse: true,
          occurrenceCount: true,
        },
      }),
      prisma.chatPreference.findMany({
        where: {
          userId,
          confidence: { gte: 20 },
        },
        orderBy: [{ confidence: 'desc' }, { strength: 'desc' }],
        select: {
          category: true,
          preference: true,
          strength: true,
          confidence: true,
        },
      }),
    ]);

    return NextResponse.json({
      triggers,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching AI profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/ai-profile
 * Update a trigger's preferred response
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { trigger, preferredResponse } = await request.json();

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger is required' }, { status: 400 });
    }

    await prisma.triggerPattern.update({
      where: {
        userId_trigger: { userId, trigger },
      },
      data: { preferredResponse },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating trigger:', error);
    return NextResponse.json({ error: 'Failed to update trigger' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/ai-profile
 * Delete a trigger or preference
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { type, trigger, category, preference } = await request.json();

    if (type === 'trigger' && trigger) {
      await prisma.triggerPattern.delete({
        where: {
          userId_trigger: { userId, trigger },
        },
      });
    } else if (type === 'preference' && category && preference) {
      await prisma.chatPreference.delete({
        where: {
          userId_category_preference: { userId, category, preference },
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from AI profile:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

/**
 * POST /api/user/ai-profile
 * Manually add a trigger or preference
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { type, ...data } = await request.json();

    if (type === 'trigger') {
      const { trigger, intensity, context, preferredResponse } = data;

      if (!trigger) {
        return NextResponse.json({ error: 'Trigger is required' }, { status: 400 });
      }

      await prisma.triggerPattern.upsert({
        where: { userId_trigger: { userId, trigger } },
        update: {
          intensity: intensity || 3,
          context,
          preferredResponse,
        },
        create: {
          userId,
          trigger,
          intensity: intensity || 3,
          context,
          preferredResponse,
        },
      });
    } else if (type === 'preference') {
      const { category, preference, strength } = data;

      if (!category || !preference) {
        return NextResponse.json({ error: 'Category and preference are required' }, { status: 400 });
      }

      await prisma.chatPreference.upsert({
        where: { userId_category_preference: { userId, category, preference } },
        update: {
          strength: strength || 3,
          confidence: 100, // Explicitly added by user
          source: 'explicit',
        },
        create: {
          userId,
          category,
          preference,
          strength: strength || 3,
          confidence: 100,
          source: 'explicit',
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding to AI profile:', error);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}
