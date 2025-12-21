import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { tokensToCredits } from '@/lib/subscriptions';

/**
 * GET /api/credits
 * Returns the user's current credit balance and usage info
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get credit balance
    const credits = await prisma.aICredits.findUnique({
      where: { userId },
    });

    if (!credits) {
      // User has no credits record yet
      return NextResponse.json({
        tokenBalance: 0,
        creditBalance: 0,
        monthlyTokens: 0,
        monthlyUsed: 0,
        monthlyRemaining: 0,
        purchasedTokens: 0,
        hasCredits: false,
      });
    }

    // Get recent usage stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = await prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    });

    // Calculate monthly remaining
    const monthlyRemaining = Math.max(0, credits.monthlyTokens - credits.monthlyUsed);

    return NextResponse.json({
      tokenBalance: credits.tokenBalance,
      creditBalance: tokensToCredits(credits.tokenBalance),
      monthlyTokens: credits.monthlyTokens,
      monthlyCredits: tokensToCredits(credits.monthlyTokens),
      monthlyUsed: credits.monthlyUsed,
      monthlyRemaining,
      monthlyRemainingCredits: tokensToCredits(monthlyRemaining),
      purchasedTokens: credits.purchasedTokens,
      purchasedCredits: tokensToCredits(credits.purchasedTokens),
      hasCredits: credits.tokenBalance > 0,
      lastMonthlyReset: credits.lastMonthlyReset,
      recentUsage: {
        tokens: recentUsage._sum.totalTokens || 0,
        credits: tokensToCredits(recentUsage._sum.totalTokens || 0),
        cost: recentUsage._sum.cost || 0,
        messageCount: recentUsage._count,
      },
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
