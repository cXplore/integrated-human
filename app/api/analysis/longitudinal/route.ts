import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { generateLongitudinalAnalysis } from '@/lib/longitudinal-analysis';

/**
 * GET /api/analysis/longitudinal
 * Returns longitudinal analysis for the authenticated user
 *
 * Query params:
 * - days: Number of days to analyze (default: 90, max: 365)
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

    // Rate limiting - this is a heavy operation
    const rateLimit = checkRateLimit(`longitudinal:${userId}`, {
      limit: 5, // 5 per minute
      windowMs: 60 * 1000,
    });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');

    const days = Math.min(365, Math.max(30, parseInt(daysParam || '90', 10) || 90));

    // Run analysis
    const analysis = await generateLongitudinalAnalysis(userId, days);

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Longitudinal analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate analysis' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
