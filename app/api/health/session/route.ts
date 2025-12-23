/**
 * Health Session API
 * POST: Start a new health session or continue existing one
 * GET: Get current/recent session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { startHealthSession, continueHealthSession } from '@/lib/health-ai';
import { getOrCreateHealth } from '@/lib/integration-health';
import { validateCSRF, csrfErrorResponse } from '@/lib/csrf';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get most recent in-progress or completed session
    const healthSession = await prisma.healthSession.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['in_progress', 'completed'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!healthSession) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        id: healthSession.id,
        type: healthSession.type,
        status: healthSession.status,
        messages: JSON.parse(healthSession.messages),
        createdAt: healthSession.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching health session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

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

  // Rate limiting for AI operations
  const rateLimit = checkRateLimit(`health-session:${session.user.id}`, RATE_LIMITS.aiHeavy);
  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { action, sessionId, message, type } = body;

    if (action === 'start') {
      // Start new session
      const result = await startHealthSession(
        session.user.id,
        type || 'weekly-checkin'
      );

      return NextResponse.json({
        sessionId: result.sessionId,
        message: result.initialMessage,
        status: 'in_progress',
      });
    }

    if (action === 'continue' && sessionId && message) {
      // Get health snapshot for context
      const health = await getOrCreateHealth(session.user.id);

      const result = await continueHealthSession(
        session.user.id,
        sessionId,
        message,
        health
      );

      return NextResponse.json({
        sessionId,
        message: result.response,
        status: result.sessionComplete ? 'completed' : 'in_progress',
        healthUpdates: result.healthUpdates,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in health session:', error);
    return NextResponse.json(
      { error: 'Failed to process session' },
      { status: 500 }
    );
  }
}
