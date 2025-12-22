import { prisma } from '@/lib/prisma';
import {
  SubscriptionTier,
  CourseTier,
  hasSubscription,
  calculateTokenCost,
  TOKENS_PER_CREDIT,
} from '@/lib/subscriptions';

export interface UserAccess {
  isSubscribed: boolean;
  tier: SubscriptionTier | null;
  status: string | null;
  aiCredits: {
    tokenBalance: number;
    monthlyTokens: number;
    monthlyUsed: number;
    purchasedTokens: number;
  } | null;
}

/**
 * Get a user's subscription and access info
 */
export async function getUserAccess(userId: string): Promise<UserAccess> {
  const [subscription, aiCredits] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
    }),
    prisma.aICredits.findUnique({
      where: { userId },
    }),
  ]);

  const isActive = subscription?.status === 'active';

  return {
    isSubscribed: isActive,
    tier: isActive ? (subscription.tier as SubscriptionTier) : null,
    status: subscription?.status || null,
    aiCredits: aiCredits
      ? {
          tokenBalance: aiCredits.tokenBalance,
          monthlyTokens: aiCredits.monthlyTokens,
          monthlyUsed: aiCredits.monthlyUsed,
          purchasedTokens: aiCredits.purchasedTokens,
        }
      : null,
  };
}

/**
 * Check if a user has access to a specific course (via subscription or purchase)
 * - Intro courses: Always free
 * - All other courses: Require membership
 */
export async function canAccessCourse(
  userId: string,
  courseSlug: string,
  courseTier: CourseTier
): Promise<{ hasAccess: boolean; reason: 'subscription' | 'purchase' | 'free' | 'none' }> {
  // Check if course is free tier (always accessible)
  if (courseTier === 'intro') {
    return { hasAccess: true, reason: 'free' };
  }

  // Check for direct purchase (legacy - keeping for backwards compatibility)
  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_courseSlug: { userId, courseSlug },
    },
  });

  if (purchase && purchase.status === 'completed') {
    return { hasAccess: true, reason: 'purchase' };
  }

  // Check subscription access
  const access = await getUserAccess(userId);

  // Members can access everything
  if (hasSubscription(access.tier)) {
    return { hasAccess: true, reason: 'subscription' };
  }

  return { hasAccess: false, reason: 'none' };
}

/**
 * Get the price a user should pay for a course
 * - Free tier users: locked (need membership)
 * - Members: everything included
 */
export async function getUserPriceForCourse(
  userId: string | null,
  originalPrice: number,
  courseTier: CourseTier
): Promise<{ price: number; discount: number; included: boolean; locked: boolean }> {
  // Intro is always free
  if (courseTier === 'intro') {
    return { price: 0, discount: 100, included: true, locked: false };
  }

  if (!userId) {
    return { price: originalPrice, discount: 0, included: false, locked: true };
  }

  const access = await getUserAccess(userId);

  // Members get everything
  if (hasSubscription(access.tier)) {
    return { price: 0, discount: 100, included: true, locked: false };
  }

  // No subscription
  return { price: originalPrice, discount: 0, included: false, locked: true };
}

/**
 * Get the price a user should pay for a bundle
 * Bundles are included with any subscription
 */
export async function getUserPriceForBundle(
  userId: string | null,
  originalPrice: number
): Promise<{ price: number; discount: number; included: boolean }> {
  if (!userId) {
    return { price: originalPrice, discount: 0, included: false };
  }

  const access = await getUserAccess(userId);

  // Any subscriber gets bundles
  if (hasSubscription(access.tier)) {
    return { price: 0, discount: 100, included: true };
  }

  return { price: originalPrice, discount: 0, included: false };
}

/**
 * Use AI tokens and track usage
 * Called after API response with actual token counts
 */
export async function useAITokens(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  context?: string,
  model: string = 'claude-sonnet-4.5'
): Promise<{ success: boolean; remainingTokens: number; error?: string }> {
  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    return { success: false, remainingTokens: 0, error: 'No credits found' };
  }

  const totalTokens = inputTokens + outputTokens;

  if (credits.tokenBalance < totalTokens) {
    return {
      success: false,
      remainingTokens: credits.tokenBalance,
      error: 'Insufficient tokens',
    };
  }

  // Calculate actual cost for analytics
  const cost = calculateTokenCost(inputTokens, outputTokens);

  // Deduct tokens and track usage
  const [updatedCredits] = await prisma.$transaction([
    prisma.aICredits.update({
      where: { userId },
      data: {
        tokenBalance: { decrement: totalTokens },
        monthlyUsed: { increment: totalTokens },
      },
    }),
    prisma.aIUsage.create({
      data: {
        userId,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        model,
        context,
      },
    }),
  ]);

  return {
    success: true,
    remainingTokens: updatedCredits.tokenBalance,
  };
}

/**
 * Check if user has enough tokens for an estimated request
 * Used before making API call to prevent wasted requests
 */
export async function hasEnoughTokens(
  userId: string,
  estimatedTokens: number = 2000 // Default estimate for a message
): Promise<boolean> {
  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

  return credits ? credits.tokenBalance >= estimatedTokens : false;
}

/**
 * Get user's remaining tokens as credits (for display)
 */
export async function getRemainingCredits(userId: string): Promise<number> {
  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

  if (!credits) return 0;
  return Math.floor(credits.tokenBalance / TOKENS_PER_CREDIT);
}
