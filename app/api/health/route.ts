/**
 * Integration Health API
 * GET: Retrieve current health snapshot
 * POST: Force recalculation after significant events
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrCreateHealth, recalculateHealth, STAGE_INFO, PILLAR_INFO } from '@/lib/integration-health';
import { validateCSRF, csrfErrorResponse } from '@/lib/csrf';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const health = await getOrCreateHealth(session.user.id);

    return NextResponse.json({
      health,
      meta: {
        stages: STAGE_INFO,
        pillars: PILLAR_INFO,
      },
    });
  } catch (error) {
    console.error('Error fetching health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
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

  try {
    const body = await request.json().catch(() => ({}));
    const { trigger } = body; // Optional: what triggered the recalculation

    const health = await recalculateHealth(session.user.id);

    return NextResponse.json({
      health,
      recalculated: true,
      trigger: trigger || 'manual',
      meta: {
        stages: STAGE_INFO,
        pillars: PILLAR_INFO,
      },
    });
  } catch (error) {
    console.error('Error recalculating health:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate health' },
      { status: 500 }
    );
  }
}
