import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dreams/symbols
 * Get user's personal dream symbol dictionary
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (symbol) {
      // Get specific symbol
      const dreamSymbol = await prisma.dreamSymbol.findUnique({
        where: {
          userId_symbol: {
            userId: session.user.id,
            symbol: symbol.toLowerCase(),
          },
        },
      });

      return NextResponse.json({ symbol: dreamSymbol });
    }

    // Get all symbols, ordered by occurrence count
    const symbols = await prisma.dreamSymbol.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { occurrenceCount: 'desc' },
        { lastSeenAt: 'desc' },
      ],
    });

    return NextResponse.json({ symbols });
  } catch (error) {
    console.error('Error fetching dream symbols:', error);
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 });
  }
}

/**
 * POST /api/dreams/symbols
 * Add or update a personal dream symbol meaning
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { symbol, personalMeaning, context } = await request.json();

    if (!symbol || !personalMeaning) {
      return NextResponse.json(
        { error: 'Symbol and personalMeaning are required' },
        { status: 400 }
      );
    }

    const normalizedSymbol = symbol.toLowerCase().trim();

    // Upsert - update if exists, create if not
    const dreamSymbol = await prisma.dreamSymbol.upsert({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: normalizedSymbol,
        },
      },
      update: {
        personalMeaning,
        context: context || undefined,
        occurrenceCount: { increment: 1 },
        lastSeenAt: new Date(),
      },
      create: {
        userId: session.user.id,
        symbol: normalizedSymbol,
        personalMeaning,
        context: context || null,
        occurrenceCount: 1,
      },
    });

    return NextResponse.json({ symbol: dreamSymbol });
  } catch (error) {
    console.error('Error saving dream symbol:', error);
    return NextResponse.json({ error: 'Failed to save symbol' }, { status: 500 });
  }
}

/**
 * DELETE /api/dreams/symbols
 * Remove a symbol from personal dictionary
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    await prisma.dreamSymbol.delete({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: symbol.toLowerCase(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dream symbol:', error);
    return NextResponse.json({ error: 'Failed to delete symbol' }, { status: 500 });
  }
}
