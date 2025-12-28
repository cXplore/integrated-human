import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeConversationPatterns } from '@/lib/conversation-memory';
import { analyzeEmotionalPatterns } from '@/lib/emotional-arc';

// Protect with a secret key for cron jobs
const CRON_SECRET = process.env.CRON_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * POST /api/cron/analyze-patterns
 *
 * Periodic job to analyze patterns across all active users.
 * Should be called by a cron job (e.g., Vercel cron, GitHub Actions).
 *
 * Recommended: Run daily or weekly
 */
export async function POST(request: NextRequest) {
  // Verify the cron secret - required in production
  const authHeader = request.headers.get('authorization');

  if (IS_PRODUCTION) {
    if (!CRON_SECRET) {
      console.error('[Pattern Analysis] CRON_SECRET not configured in production');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // In dev, only check if CRON_SECRET is set
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    usersProcessed: 0,
    conversationPatternsAnalyzed: 0,
    emotionalPatternsAnalyzed: 0,
    errors: [] as string[],
  };

  try {
    // Get users who have been active in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.user.findMany({
      where: {
        chatConversations: {
          some: {
            updatedAt: { gte: thirtyDaysAgo },
          },
        },
      },
      select: {
        id: true,
        email: true,
        _count: {
          select: { chatConversations: true },
        },
      },
    });

    console.log(`[Pattern Analysis] Starting analysis for ${activeUsers.length} active users`);

    // Process users in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < activeUsers.length; i += batchSize) {
      const batch = activeUsers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (user) => {
          try {
            // Only analyze users with sufficient conversation history
            if (user._count.chatConversations >= 3) {
              // Analyze conversation patterns (themes, recurring topics)
              await analyzeConversationPatterns(user.id, 30);
              results.conversationPatternsAnalyzed++;

              // Analyze emotional patterns
              await analyzeEmotionalPatterns(user.id, 30);
              results.emotionalPatternsAnalyzed++;
            }

            results.usersProcessed++;
          } catch (err) {
            const errorMsg = `Error analyzing user ${user.id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
            console.error(errorMsg);
            results.errors.push(errorMsg);
          }
        })
      );

      // Small delay between batches to be gentle on the database
      if (i + batchSize < activeUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Pattern Analysis] Completed in ${duration}ms. Processed ${results.usersProcessed} users.`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results,
    });
  } catch (error) {
    console.error('[Pattern Analysis] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Pattern analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        ...results,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/analyze-patterns
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    description: 'Pattern analysis cron endpoint',
    usage: 'POST with Authorization: Bearer <CRON_SECRET>',
  });
}
