/**
 * AI Credits Management
 *
 * Centralized utility for checking and deducting AI credits.
 * Used by all AI-powered API routes.
 */

import { prisma } from '@/lib/prisma';
import { calculateTokenCost } from '@/lib/subscriptions';

// =============================================================================
// LM STUDIO CONFIGURATION
// =============================================================================

/**
 * LM Studio endpoint URL
 * Defaults to local development server
 */
export const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';

/**
 * LM Studio model identifier
 */
export const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

/**
 * Check if using local AI (bypass credits for local testing)
 */
export const isLocalAI = LM_STUDIO_URL.includes('127.0.0.1') ||
                         LM_STUDIO_URL.includes('192.168.') ||
                         LM_STUDIO_URL.includes('10.');

// =============================================================================
// TOKEN ESTIMATION
// =============================================================================

/**
 * Rough token estimation (4 chars ≈ 1 token for English text)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// =============================================================================
// CREDIT CHECKING
// =============================================================================

export interface CreditCheckResult {
  hasCredits: boolean;
  balance: number;
}

/**
 * Check if user has enough credits and return their balance
 */
export async function checkCredits(userId: string): Promise<CreditCheckResult> {
  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    return { hasCredits: false, balance: 0 };
  }

  return {
    hasCredits: credits.tokenBalance > 0,
    balance: credits.tokenBalance,
  };
}

// =============================================================================
// TOKEN DEDUCTION
// =============================================================================

export interface DeductTokensOptions {
  userId: string;
  inputTokens: number;
  outputTokens: number;
  context: string; // e.g., 'chat', 'journal', 'dream', 'stuck', 'somatic'
}

/**
 * Deduct tokens from user's balance and record usage
 *
 * Deduction priority:
 * 1. Monthly subscription tokens (if available)
 * 2. Purchased tokens
 */
export async function deductTokens(options: DeductTokensOptions): Promise<void> {
  const { userId, inputTokens, outputTokens, context } = options;
  const totalTokens = inputTokens + outputTokens;
  const cost = calculateTokenCost(inputTokens, outputTokens);

  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    // Create record for tracking even if no credits
    await prisma.aICredits.create({
      data: {
        userId,
        tokenBalance: 0,
        monthlyTokens: 0,
        monthlyUsed: totalTokens,
        purchasedTokens: 0,
      },
    });
  } else {
    // Calculate how much to deduct from monthly vs purchased
    let monthlyDeduction = 0;
    let remainingDeduction = totalTokens;

    const monthlyAvailable = Math.max(0, credits.monthlyTokens - credits.monthlyUsed);

    if (monthlyAvailable > 0) {
      monthlyDeduction = Math.min(monthlyAvailable, remainingDeduction);
      remainingDeduction -= monthlyDeduction;
    }

    await prisma.aICredits.update({
      where: { userId },
      data: {
        tokenBalance: { decrement: totalTokens },
        monthlyUsed: { increment: monthlyDeduction },
        purchasedTokens: remainingDeduction > 0
          ? { decrement: remainingDeduction }
          : undefined,
      },
    });
  }

  // Record usage for analytics
  await prisma.aIUsage.create({
    data: {
      userId,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      model: LM_STUDIO_MODEL,
      context,
    },
  });
}

/**
 * Simple deduction for routes that only track total tokens
 */
export async function deductTokensSimple(
  userId: string,
  totalTokens: number,
  context: string
): Promise<void> {
  // Estimate 30% input, 70% output for simple deduction
  const inputTokens = Math.round(totalTokens * 0.3);
  const outputTokens = totalTokens - inputTokens;

  await deductTokens({
    userId,
    inputTokens,
    outputTokens,
    context,
  });
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Standard "no credits" response for API routes
 */
export function noCreditsResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Insufficient credits',
      code: 'NO_CREDITS',
      message: "You've run out of AI credits. Purchase more to continue.",
      balance: 0,
    }),
    {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
