import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import { validateCSRF, csrfErrorResponse } from '@/lib/csrf';
import { extractDreamSymbols, trackDreamSymbols } from '@/lib/symbol-tracker';

/**
 * GET /api/dreams
 * List user's dream journal entries
 * Query params:
 * - limit: number of dreams to return (default 20, max 100)
 * - offset: pagination offset (default 0)
 * - includeStats: whether to include emotion/symbol statistics (default false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Bounds checking for pagination parameters
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const rawOffset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 20 : rawLimit));
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Fetch dreams and count in parallel
    const [dreams, total] = await Promise.all([
      prisma.dreamEntry.findMany({
        where: { userId: session.user.id },
        orderBy: { dreamDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.dreamEntry.count({
        where: { userId: session.user.id },
      }),
    ]);

    // Build base response
    const response: {
      dreams: Array<{
        id: string;
        title: string | null;
        content: string;
        dreamDate: Date;
        symbols: string[];
        emotions: string[];
        lucid: boolean;
        recurring: boolean;
        interpretation: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>;
      total: number;
      hasMore: boolean;
      stats?: {
        totalDreams: number;
        emotionDistribution: Record<string, number>;
        recurringSymbols: Array<{ symbol: string; count: number }>;
      };
    } = {
      dreams: dreams.map(d => ({
        ...d,
        symbols: safeJsonParse<string[]>(d.symbols, []),
        emotions: safeJsonParse<string[]>(d.emotions, []),
      })),
      total,
      hasMore: offset + dreams.length < total,
    };

    // Only fetch stats when explicitly requested (avoids N+1 on pagination)
    if (includeStats) {
      // Fetch only the fields needed for stats
      const allDreams = await prisma.dreamEntry.findMany({
        where: { userId: session.user.id },
        select: { emotions: true, symbols: true },
      });

      const emotionCounts: Record<string, number> = {};
      const symbolCounts: Record<string, number> = {};

      allDreams.forEach(d => {
        const emotions = safeJsonParse<string[]>(d.emotions, []);
        emotions.forEach(e => {
          emotionCounts[e] = (emotionCounts[e] || 0) + 1;
        });
        const symbols = safeJsonParse<string[]>(d.symbols, []);
        symbols.forEach(s => {
          symbolCounts[s] = (symbolCounts[s] || 0) + 1;
        });
      });

      const recurringSymbols = Object.entries(symbolCounts)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([symbol, count]) => ({ symbol, count }));

      response.stats = {
        totalDreams: total,
        emotionDistribution: emotionCounts,
        recurringSymbols,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dreams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dreams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dreams
 * Create a new dream entry
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, dreamDate, emotions, symbols, lucid, recurring } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Dream description must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Create the dream entry first
    const dream = await prisma.dreamEntry.create({
      data: {
        userId: session.user.id,
        title: title?.trim() || null,
        content: content.trim(),
        dreamDate: dreamDate ? new Date(dreamDate) : new Date(),
        emotions: emotions ? JSON.stringify(emotions) : null,
        symbols: symbols ? JSON.stringify(symbols) : null,
        lucid: lucid || false,
        recurring: recurring || false,
      },
    });

    // Handle symbol tracking (fire-and-forget to not block response)
    const userId = session.user.id;
    const dreamId = dream.id;
    const dreamContent = content.trim();

    if (symbols && symbols.length > 0) {
      // If symbols were provided, track them for the personal dictionary
      trackDreamSymbols(userId, dreamId, symbols, dreamContent).catch(err => {
        console.error('Error tracking dream symbols:', err);
      });
    } else if (dreamContent.length > 50) {
      // If no symbols provided and content is substantial, extract them using AI
      extractDreamSymbols(dreamContent).then(async (extractedSymbols) => {
        if (extractedSymbols.length > 0) {
          // Update the dream entry with extracted symbols
          await prisma.dreamEntry.update({
            where: { id: dreamId },
            data: { symbols: JSON.stringify(extractedSymbols) },
          });
          // Track symbols for the user's personal dictionary
          await trackDreamSymbols(userId, dreamId, extractedSymbols, dreamContent);
        }
      }).catch(err => {
        console.error('Error extracting dream symbols:', err);
      });
    }

    return NextResponse.json({
      dream: {
        ...dream,
        symbols: safeJsonParse<string[]>(dream.symbols, []),
        emotions: safeJsonParse<string[]>(dream.emotions, []),
      },
    });
  } catch (error) {
    console.error('Error creating dream:', error);
    return NextResponse.json(
      { error: 'Failed to create dream entry' },
      { status: 500 }
    );
  }
}
