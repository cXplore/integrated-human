import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stuck/check-ins
 * Fetch stuck patterns that are due for follow-up (7+ days old, unresolved)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get unresolved patterns that are 7+ days old
    const pendingCheckIns = await prisma.stuckPattern.findMany({
      where: {
        userId: session.user.id,
        resolved: false,
        createdAt: { lte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        description: true,
        stuckType: true,
        theme: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      checkIns: pendingCheckIns.map((p) => ({
        id: p.id,
        description: p.description.slice(0, 150) + (p.description.length > 150 ? '...' : ''),
        stuckType: p.stuckType,
        theme: p.theme,
        daysAgo: Math.floor((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}

/**
 * POST /api/stuck/check-ins
 * Update a stuck pattern with check-in response
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { patternId, status, notes } = await request.json();

    if (!patternId || !status) {
      return NextResponse.json({ error: 'Pattern ID and status required' }, { status: 400 });
    }

    if (!['resolved', 'still-stuck', 'dismiss'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'dismiss') {
      // Mark as dismissed (resolved without notes)
      await prisma.stuckPattern.update({
        where: { id: patternId, userId: session.user.id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolutionNotes: 'Dismissed without resolution',
        },
      });
    } else if (status === 'resolved') {
      await prisma.stuckPattern.update({
        where: { id: patternId, userId: session.user.id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolutionNotes: notes || 'Marked as resolved during check-in',
        },
      });
    } else if (status === 'still-stuck') {
      // For still-stuck, update the timestamp to delay next check-in by 7 days
      // and add a note about the check-in
      await prisma.stuckPattern.update({
        where: { id: patternId, userId: session.user.id },
        data: {
          updatedAt: new Date(),
          resolutionNotes: notes ? `Check-in note: ${notes}` : null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating check-in:', error);
    return NextResponse.json({ error: 'Failed to update check-in' }, { status: 500 });
  }
}
