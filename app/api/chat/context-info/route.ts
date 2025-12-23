import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { gatherHealthData, calculateDataFreshness } from '@/lib/integration-health';

/**
 * GET - Get context info for the chat interface
 * Returns information about whether the AI has health context and how fresh it is
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasHealthContext: false });
  }

  try {
    // Check if user has any health data
    const health = await prisma.integrationHealth.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!health) {
      return NextResponse.json({
        hasHealthContext: false,
        dataFreshness: 'expired',
      });
    }

    // Calculate freshness
    const healthData = await gatherHealthData(session.user.id);
    const freshness = calculateDataFreshness(healthData);

    return NextResponse.json({
      hasHealthContext: true,
      dataFreshness: freshness.overall,
      dataConfidence: freshness.overallConfidence,
      suggestedActions: freshness.suggestedActions,
    });
  } catch (error) {
    console.error('Error fetching context info:', error);
    return NextResponse.json({ hasHealthContext: false });
  }
}
