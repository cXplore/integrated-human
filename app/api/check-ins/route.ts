import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { validateCSRF, csrfErrorResponse } from '@/lib/csrf';

// Check-in prompts by type
const CHECK_IN_PROMPTS = {
  'what-shifted': [
    "What has shifted in you since you started this work?",
    "What do you understand now that you didn't before?",
    "What pattern have you noticed becoming more visible?",
  ],
  'applying-learning': [
    "How have you applied what you've learned in your daily life?",
    "Where did you catch yourself using a new tool or awareness?",
    "What situation called for something you've been practicing?",
  ],
  'current-edge': [
    "What's your current growing edge? Where are you being stretched?",
    "What feels uncomfortable but important right now?",
    "What are you resisting that might be worth moving toward?",
  ],
  'gratitude': [
    "What are you grateful for in your inner journey right now?",
    "What part of yourself are you learning to appreciate?",
    "What challenge has become a gift?",
  ],
};

/**
 * GET /api/check-ins
 * Get user's check-in history and whether a check-in is due
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
    // Bounds checking for pagination
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.max(1, Math.min(50, isNaN(rawLimit) ? 10 : rawLimit));

    // Get recent check-ins
    const checkIns = await prisma.integrationCheckIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Check if a weekly check-in is due (last check-in > 7 days ago, or never)
    const lastCheckIn = checkIns[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const isCheckInDue = !lastCheckIn || new Date(lastCheckIn.createdAt) < oneWeekAgo;

    // Get a random prompt for the next check-in
    const promptTypes = Object.keys(CHECK_IN_PROMPTS) as Array<keyof typeof CHECK_IN_PROMPTS>;
    const randomType = promptTypes[Math.floor(Math.random() * promptTypes.length)];
    const prompts = CHECK_IN_PROMPTS[randomType];
    const nextPrompt = {
      type: randomType,
      prompt: prompts[Math.floor(Math.random() * prompts.length)],
    };

    // Get total count
    const totalCount = await prisma.integrationCheckIn.count({
      where: { userId },
    });

    return NextResponse.json({
      checkIns,
      isCheckInDue,
      nextPrompt,
      totalCount,
      lastCheckInDate: lastCheckIn?.createdAt || null,
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/check-ins
 * Create a new check-in
 */
export async function POST(request: NextRequest) {
  // CSRF validation
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
    const { type, promptType, response, relatedSlug } = body;

    if (!response || typeof response !== 'string' || response.trim().length < 10) {
      return NextResponse.json(
        { error: 'Response must be at least 10 characters' },
        { status: 400 }
      );
    }

    const validTypes = ['weekly', 'course-completion', 'milestone'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid check-in type' },
        { status: 400 }
      );
    }

    const validPromptTypes = ['what-shifted', 'applying-learning', 'current-edge', 'gratitude'];
    if (!validPromptTypes.includes(promptType)) {
      return NextResponse.json(
        { error: 'Invalid prompt type' },
        { status: 400 }
      );
    }

    const checkIn = await prisma.integrationCheckIn.create({
      data: {
        userId,
        type,
        promptType,
        response: response.trim(),
        relatedSlug: relatedSlug || null,
      },
    });

    return NextResponse.json({
      success: true,
      checkIn,
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}
