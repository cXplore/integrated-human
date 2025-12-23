/**
 * Health Analysis API
 * POST: Run AI analysis on user's reflective content
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyzeUserHealth, checkReassessmentTriggers } from '@/lib/health-ai';
import { validateCSRF, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // CSRF validation
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting - this is a heavy AI operation
  const rateLimit = checkRateLimit(`health-analyze:${session.user.id}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 per hour
  });
  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Analysis limit reached. Try again later.', retryAfter },
      { status: 429 }
    );
  }

  try {
    // Run parallel: AI analysis and reassessment checks
    const [analysis, reassessmentTriggers] = await Promise.all([
      analyzeUserHealth(session.user.id),
      checkReassessmentTriggers(session.user.id),
    ]);

    if (!analysis) {
      return NextResponse.json({
        analysis: null,
        message: 'Not enough data for analysis yet. Keep journaling and checking in!',
        reassessmentTriggers,
      });
    }

    return NextResponse.json({
      analysis,
      reassessmentTriggers,
    });
  } catch (error) {
    console.error('Error analyzing health:', error);
    return NextResponse.json(
      { error: 'Failed to analyze health data' },
      { status: 500 }
    );
  }
}
