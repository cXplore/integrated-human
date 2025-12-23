/**
 * Quick Check-in API
 * Fast mood/energy tracking that takes 10 seconds
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { validateCSRF, csrfErrorResponse } from '@/lib/csrf';

/**
 * GET /api/quick-check-in
 * Get today's check-in (if any) and recent history
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get today's check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCheckIn = await prisma.quickCheckIn.findFirst({
      where: {
        userId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get last 7 days for trend
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentCheckIns = await prisma.quickCheckIn.findMany({
      where: {
        userId,
        createdAt: { gte: weekAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 7,
    });

    // Calculate streak
    let streak = 0;
    const checkInDates = recentCheckIns.map((c) =>
      new Date(c.createdAt).toDateString()
    );

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      if (checkInDates.includes(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate averages
    const avgMood =
      recentCheckIns.length > 0
        ? recentCheckIns.reduce((sum, c) => sum + c.mood, 0) / recentCheckIns.length
        : null;
    const avgEnergy =
      recentCheckIns.length > 0
        ? recentCheckIns.reduce((sum, c) => sum + c.energy, 0) / recentCheckIns.length
        : null;

    return NextResponse.json({
      todayCheckIn,
      hasCheckedInToday: !!todayCheckIn,
      recentCheckIns,
      streak,
      averages: {
        mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
        energy: avgEnergy ? Math.round(avgEnergy * 10) / 10 : null,
      },
    });
  } catch (error) {
    console.error('Error fetching quick check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quick-check-in
 * Submit a quick check-in
 */
export async function POST(request: NextRequest) {
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { mood, energy, note, pillarFocus } = body;

    // Validate mood and energy (1-5)
    if (typeof mood !== 'number' || mood < 1 || mood > 5) {
      return NextResponse.json(
        { error: 'Mood must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (typeof energy !== 'number' || energy < 1 || energy > 5) {
      return NextResponse.json(
        { error: 'Energy must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate pillarFocus if provided
    const validPillars = ['mind', 'body', 'soul', 'relationships'];
    if (pillarFocus && !validPillars.includes(pillarFocus)) {
      return NextResponse.json(
        { error: 'Invalid pillar focus' },
        { status: 400 }
      );
    }

    // Check if already checked in today - update instead of create
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckIn = await prisma.quickCheckIn.findFirst({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    let checkIn;
    if (existingCheckIn) {
      // Update existing
      checkIn = await prisma.quickCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          mood,
          energy,
          note: note?.slice(0, 200) || null,
          pillarFocus: pillarFocus || null,
        },
      });
    } else {
      // Create new
      checkIn = await prisma.quickCheckIn.create({
        data: {
          userId,
          mood,
          energy,
          note: note?.slice(0, 200) || null,
          pillarFocus: pillarFocus || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      checkIn,
      updated: !!existingCheckIn,
    });
  } catch (error) {
    console.error('Error creating quick check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}
