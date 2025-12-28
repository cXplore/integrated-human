import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chat/preferences
 * Get user's chat preferences for AI personalization
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: { userId: string; category?: string } = { userId: session.user.id };
    if (category) {
      where.category = category;
    }

    const preferences = await prisma.chatPreference.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { strength: 'desc' },
        { confidence: 'desc' },
      ],
    });

    // Group by category for easier consumption
    const grouped = preferences.reduce((acc, pref) => {
      if (!acc[pref.category]) {
        acc[pref.category] = [];
      }
      acc[pref.category].push(pref);
      return acc;
    }, {} as Record<string, typeof preferences>);

    return NextResponse.json({ preferences, grouped });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

/**
 * POST /api/chat/preferences
 * Record or update a preference
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, preference, strength, context, source, confidence } = await request.json();

    if (!category || !preference) {
      return NextResponse.json(
        { error: 'Category and preference are required' },
        { status: 400 }
      );
    }

    const validCategories = ['response-style', 'depth', 'tone', 'topics', 'feedback-style', 'pacing', 'approach'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const normalizedPreference = preference.toLowerCase().trim();

    // Upsert the preference
    const chatPreference = await prisma.chatPreference.upsert({
      where: {
        userId_category_preference: {
          userId: session.user.id,
          category,
          preference: normalizedPreference,
        },
      },
      update: {
        strength: strength ?? undefined,
        context: context ?? undefined,
        source: source ?? undefined,
        confidence: confidence !== undefined
          ? { increment: Math.min(10, Math.max(-10, confidence)) } // Adjust confidence
          : undefined,
      },
      create: {
        userId: session.user.id,
        category,
        preference: normalizedPreference,
        strength: strength ?? 3,
        context: context ?? null,
        source: source ?? 'inferred',
        confidence: confidence ?? 50,
      },
    });

    return NextResponse.json({ preference: chatPreference });
  } catch (error) {
    console.error('Error saving preference:', error);
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/preferences
 * Remove a preference
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const preference = searchParams.get('preference');

    if (!category || !preference) {
      return NextResponse.json({ error: 'Category and preference are required' }, { status: 400 });
    }

    await prisma.chatPreference.delete({
      where: {
        userId_category_preference: {
          userId: session.user.id,
          category,
          preference: preference.toLowerCase(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting preference:', error);
    return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 });
  }
}
