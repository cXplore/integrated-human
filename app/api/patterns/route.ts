import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  analyzeCrossModalPatterns,
  summarizeCrossModalAnalysis,
} from '@/lib/cross-modal-patterns';

/**
 * GET /api/patterns
 * Returns cross-modal pattern analysis for the authenticated user
 *
 * Query params:
 * - days: Number of days to analyze (default: 30, max: 90)
 * - summary: If "true", returns condensed summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.id;

    // Rate limiting - this is a heavier operation
    const rateLimit = checkRateLimit(`patterns:${userId}`, {
      limit: 10, // 10 per minute
      windowMs: 60 * 1000,
    });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const summaryOnly = searchParams.get('summary') === 'true';

    const days = Math.min(90, Math.max(7, parseInt(daysParam || '30', 10) || 30));

    // Run analysis
    const analysis = await analyzeCrossModalPatterns(userId, days);

    if (summaryOnly) {
      const summary = summarizeCrossModalAnalysis(analysis);
      return new Response(JSON.stringify(summary), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Pattern analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze patterns' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
