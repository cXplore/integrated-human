import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chat/triggers
 * Get user's known trigger patterns for AI awareness
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const triggers = await prisma.triggerPattern.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { intensity: 'desc' },
        { occurrenceCount: 'desc' },
      ],
    });

    return NextResponse.json({ triggers });
  } catch (error) {
    console.error('Error fetching triggers:', error);
    return NextResponse.json({ error: 'Failed to fetch triggers' }, { status: 500 });
  }
}

/**
 * POST /api/chat/triggers
 * Record or update a trigger pattern
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { trigger, intensity, context, preferredResponse, userConfirmed } = await request.json();

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger is required' }, { status: 400 });
    }

    const normalizedTrigger = trigger.toLowerCase().trim();

    // Upsert the trigger pattern
    const triggerPattern = await prisma.triggerPattern.upsert({
      where: {
        userId_trigger: {
          userId: session.user.id,
          trigger: normalizedTrigger,
        },
      },
      update: {
        intensity: intensity ?? undefined,
        context: context ?? undefined,
        preferredResponse: preferredResponse ?? undefined,
        userConfirmed: userConfirmed ?? undefined,
        occurrenceCount: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
      create: {
        userId: session.user.id,
        trigger: normalizedTrigger,
        intensity: intensity ?? 3,
        context: context ?? null,
        preferredResponse: preferredResponse ?? null,
        userConfirmed: userConfirmed ?? false,
      },
    });

    return NextResponse.json({ trigger: triggerPattern });
  } catch (error) {
    console.error('Error saving trigger:', error);
    return NextResponse.json({ error: 'Failed to save trigger' }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/triggers
 * Remove a trigger pattern
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger is required' }, { status: 400 });
    }

    await prisma.triggerPattern.delete({
      where: {
        userId_trigger: {
          userId: session.user.id,
          trigger: trigger.toLowerCase(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trigger:', error);
    return NextResponse.json({ error: 'Failed to delete trigger' }, { status: 500 });
  }
}
