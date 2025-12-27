/**
 * HEALTH DISPLAY API
 *
 * GET /api/health/display
 *   - Returns combined health data for display
 *   - Uses new two-layer system (verified + estimated)
 *   - Falls back to legacy if no new data exists
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getHealthDisplayData } from '@/lib/assessment/health-bridge';
import type { PillarId } from '@/lib/assessment/types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const displayData = await getHealthDisplayData(session.user.id);

    // Create a flat dimensions array for easy client-side consumption
    const flatDimensions: Array<{
      pillarId: string;
      dimensionId: string;
      verifiedScore: number;
      estimatedScore: number | null;
      freshness: 'fresh' | 'aging' | 'stale' | 'expired' | undefined;
      stage: string;
      daysSinceAssessment: number;
    }> = [];

    const pillars: PillarId[] = ['mind', 'body', 'soul', 'relationships'];
    for (const pillarId of pillars) {
      const pillar = displayData.pillars[pillarId];
      for (const dim of pillar.dimensions) {
        const daysSince = dim.verifiedAt
          ? Math.floor((Date.now() - new Date(dim.verifiedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        flatDimensions.push({
          pillarId,
          dimensionId: dim.dimensionId,
          verifiedScore: dim.score,
          estimatedScore: dim.estimatedDelta !== undefined
            ? dim.score + dim.estimatedDelta
            : null,
          freshness: dim.freshness,
          stage: dim.stage,
          daysSinceAssessment: daysSince,
        });
      }
    }

    return NextResponse.json({
      ...displayData,
      dimensions: flatDimensions,
    });
  } catch (error) {
    console.error('Error fetching health display data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    );
  }
}
