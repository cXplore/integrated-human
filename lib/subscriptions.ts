// Subscription configuration - Two-tier system
// Free: 50 articles, 5 intro courses, free resources, no AI
// Member ($19): Everything unlocked, 1,000 AI credits/month
// Pro ($49): Everything unlocked, 2,500 AI credits/month

export type SubscriptionTier = 'member' | 'pro';
export type CourseTier = 'intro' | 'beginner' | 'intermediate' | 'advanced' | 'flagship';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyTokens: number; // Tokens included per month (1 credit = 1,000 tokens)
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  member: {
    id: 'member',
    name: 'Member',
    description: 'Full access to everything',
    monthlyPrice: 19,
    yearlyPrice: 190, // 2 months free
    monthlyTokens: 1000000, // 1,000 credits (~130 conversations/month)
    features: [
      'All articles',
      'All courses including Flagship',
      'Certificates on Flagship courses',
      'All learning paths',
      'All PDFs & resources',
      '1,000 AI credits/month',
      'Journal companion',
      'Dream interpretation',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For dedicated practitioners',
    monthlyPrice: 49,
    yearlyPrice: 490, // 2 months free
    monthlyTokens: 2500000, // 2,500 credits (~330 conversations/month)
    features: [
      'All articles',
      'All courses including Flagship',
      'Certificates on Flagship courses',
      'All learning paths',
      'All PDFs & resources',
      '2,500 AI credits/month',
      'Journal companion',
      'Dream interpretation',
    ],
  },
};

// Free tier content limits
export const FREE_TIER = {
  articleLimit: 50,
  courseLimit: 5, // 5 intro courses
  courseTiers: ['intro'] as CourseTier[], // Only intro courses
  aiCredits: 0,
};

// AI Credit pricing - Token-based system
// Using Claude Sonnet 4.5 pricing (December 2025):
//
// Token costs (per million tokens):
// - Base Input:     $3.00
// - Output:         $15.00
// - Cache Hits:     $0.30
//
// WORST-CASE COST CALCULATION:
// The absolute worst case is 100% output tokens at $15/1M = $0.015 per 1K tokens
// This happens when users send short messages and AI gives long responses.
//
// Realistic usage is ~13% input / 87% output, but we price for worst case.
//
// PRICING:
// 1 credit = 1,000 tokens
// $0.02 per credit = $20 per 1,000 credits
// Same price for everyone - no bulk discounts (fair pricing)
//
// MARGIN ANALYSIS:
// - Worst-case cost: $0.015 per credit
// - Our price: $0.02 per credit
// - Worst-case margin: 25%
// - Realistic margin: ~33%
//
// We are ALWAYS profitable, even if every message is 100% output tokens.

export const TOKENS_PER_CREDIT = 1000;
export const AI_CREDIT_PRICE = 0.02; // dollars per credit (1,000 tokens) - 25% margin worst case

// Cost per token in dollars (for internal cost calculation)
export const INPUT_TOKEN_COST = 0.000003;   // $3 per 1M tokens
export const OUTPUT_TOKEN_COST = 0.000015;  // $15 per 1M tokens
export const CACHE_HIT_COST = 0.0000003;    // $0.30 per 1M tokens (90% cheaper than input)

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;  // 1 credit = 1,000 tokens
  price: number;    // in dollars
  description: string;
}

// Credit top-up packages (never expire)
// Simplified options - most users should upgrade tier instead
// Flat rate: $0.02 per credit ($20 per 1,000 credits)
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits-500',
    name: 'Top Up',
    credits: 500,
    price: 10,
    description: '~65 conversations'
  },
  {
    id: 'credits-1000',
    name: 'Top Up+',
    credits: 1000,
    price: 20,
    description: '~130 conversations'
  },
];

// Custom credit purchases: user can enter any dollar amount ($10 minimum)
export const MIN_CUSTOM_CREDIT_AMOUNT = 10; // minimum $10 (500 credits)
export const MAX_CUSTOM_CREDIT_AMOUNT = 200; // maximum $200

/**
 * Calculate the actual dollar cost for token usage
 * This is for internal analytics - we charge users based on total tokens, not cost
 */
export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  cacheHitTokens: number = 0
): number {
  return (
    (inputTokens * INPUT_TOKEN_COST) +
    (outputTokens * OUTPUT_TOKEN_COST) +
    (cacheHitTokens * CACHE_HIT_COST)
  );
}

/**
 * Calculate total tokens used (for billing purposes)
 * We bill based on total tokens, not weighted by cost
 */
export function calculateTotalTokens(
  inputTokens: number,
  outputTokens: number,
  cacheHitTokens: number = 0
): number {
  // Cache hits count as tokens used (though they cost less)
  // This keeps billing simple and predictable for users
  return inputTokens + outputTokens + cacheHitTokens;
}

/**
 * Calculate credits to deduct based on actual token usage
 * Returns fractional credits (we track in tokens internally for precision)
 */
export function calculateCreditsUsed(
  inputTokens: number,
  outputTokens: number,
  cacheHitTokens: number = 0
): number {
  const totalTokens = calculateTotalTokens(inputTokens, outputTokens, cacheHitTokens);
  return totalTokens / TOKENS_PER_CREDIT;
}

/**
 * Check if user has a paid subscription
 */
export function hasSubscription(subscriptionTier: SubscriptionTier | null): boolean {
  return subscriptionTier === 'member' || subscriptionTier === 'pro';
}

/**
 * Check if user can access a specific course tier
 * Both member and pro can access everything
 */
export function canAccessCourseTier(
  subscriptionTier: SubscriptionTier | null,
  courseTier: CourseTier
): boolean {
  // Intro courses are always free
  if (courseTier === 'intro') return true;

  // No subscription = only intro
  if (!subscriptionTier) return false;

  // Members can access everything
  return true;
}

/**
 * Get monthly tokens for a subscription tier
 */
export function getMonthlyTokens(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].monthlyTokens;
}

/**
 * Convert tokens to credits for display (1 credit = 1,000 tokens)
 */
export function tokensToCredits(tokens: number): number {
  return Math.floor(tokens / TOKENS_PER_CREDIT);
}

/**
 * Convert credits to tokens
 */
export function creditsToTokens(credits: number): number {
  return credits * TOKENS_PER_CREDIT;
}
