import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface SymbolEntry {
  id: string;
  symbol: string;
  personalMeaning: string;
  context: string | null;
  occurrenceCount: number;
  lastSeenAt: Date;
  sources: string[];
}

/**
 * GET /api/user/symbol-dictionary
 * Get user's personal symbol dictionary
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const sort = url.searchParams.get('sort') || 'occurrences'; // occurrences, recent, alphabetical

  try {
    // Build where clause
    const where: { userId: string; symbol?: { contains: string; mode: 'insensitive' } } = { userId };
    if (search) {
      where.symbol = { contains: search, mode: 'insensitive' };
    }

    // Build order clause
    let orderBy: { occurrenceCount?: 'desc'; lastSeenAt?: 'desc'; symbol?: 'asc' } = {};
    switch (sort) {
      case 'recent':
        orderBy = { lastSeenAt: 'desc' };
        break;
      case 'alphabetical':
        orderBy = { symbol: 'asc' };
        break;
      default:
        orderBy = { occurrenceCount: 'desc' };
    }

    const symbols = await prisma.dreamSymbol.findMany({
      where,
      orderBy,
      take: 100,
    });

    // Get dream entries to find sources for each symbol
    const dreamEntries = await prisma.dreamEntry.findMany({
      where: { userId },
      select: { id: true, symbols: true, title: true, dreamDate: true },
      orderBy: { dreamDate: 'desc' },
      take: 50,
    });

    // Parse symbols from dreams to find sources
    const symbolSources = new Map<string, string[]>();
    for (const dream of dreamEntries) {
      if (dream.symbols) {
        try {
          const dreamSymbols = JSON.parse(dream.symbols) as string[];
          for (const s of dreamSymbols) {
            const normalizedSymbol = s.toLowerCase().trim();
            if (!symbolSources.has(normalizedSymbol)) {
              symbolSources.set(normalizedSymbol, []);
            }
            const sources = symbolSources.get(normalizedSymbol)!;
            if (sources.length < 5) {
              sources.push(dream.title || `Dream on ${dream.dreamDate.toLocaleDateString()}`);
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Enrich symbols with sources
    const enrichedSymbols: SymbolEntry[] = symbols.map(s => ({
      id: s.id,
      symbol: s.symbol,
      personalMeaning: s.personalMeaning,
      context: s.context,
      occurrenceCount: s.occurrenceCount,
      lastSeenAt: s.lastSeenAt,
      sources: symbolSources.get(s.symbol.toLowerCase()) || [],
    }));

    // Get statistics
    const stats = {
      totalSymbols: symbols.length,
      mostRecurring: symbols.slice(0, 5).map(s => ({
        symbol: s.symbol,
        count: s.occurrenceCount,
      })),
      recentlyActive: symbols
        .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
        .slice(0, 3)
        .map(s => s.symbol),
    };

    return NextResponse.json({
      symbols: enrichedSymbols,
      stats,
    });
  } catch (error) {
    console.error('Error fetching symbol dictionary:', error);
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 });
  }
}

/**
 * POST /api/user/symbol-dictionary
 * Add or update a symbol in the dictionary
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { symbol, personalMeaning, context } = await request.json();

    if (!symbol || !personalMeaning) {
      return NextResponse.json(
        { error: 'Symbol and personal meaning are required' },
        { status: 400 }
      );
    }

    const normalizedSymbol = symbol.toLowerCase().trim();

    const entry = await prisma.dreamSymbol.upsert({
      where: {
        userId_symbol: { userId, symbol: normalizedSymbol },
      },
      update: {
        personalMeaning,
        context: context || undefined,
        occurrenceCount: { increment: 1 },
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        symbol: normalizedSymbol,
        personalMeaning,
        context,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error saving symbol:', error);
    return NextResponse.json({ error: 'Failed to save symbol' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/symbol-dictionary
 * Update a symbol's meaning
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { symbolId, personalMeaning, context } = await request.json();

    if (!symbolId) {
      return NextResponse.json({ error: 'Symbol ID is required' }, { status: 400 });
    }

    const entry = await prisma.dreamSymbol.update({
      where: { id: symbolId, userId },
      data: {
        personalMeaning: personalMeaning || undefined,
        context: context !== undefined ? context : undefined,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating symbol:', error);
    return NextResponse.json({ error: 'Failed to update symbol' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/symbol-dictionary
 * Remove a symbol from the dictionary
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { symbolId } = await request.json();

    if (!symbolId) {
      return NextResponse.json({ error: 'Symbol ID is required' }, { status: 400 });
    }

    await prisma.dreamSymbol.delete({
      where: { id: symbolId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting symbol:', error);
    return NextResponse.json({ error: 'Failed to delete symbol' }, { status: 500 });
  }
}
