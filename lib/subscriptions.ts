// Subscription configuration - Simple single-tier system
// Free: 50 articles, 5 intro courses, free resources, no AI
// Member ($19): Everything unlocked, 500 AI credits/month

export type SubscriptionTier = 'member';
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
    monthlyTokens: 500000, // 500 credits
    features: [
      'All articles',
      'All courses including Flagship',
      'Certificates on Flagship courses',
      'All learning paths',
      'All PDFs & resources',
      '500 AI credits/month',
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
// - 5min Cache:     $3.75 (write)
// - 1hr Cache:      $6.00 (write)
// - Cache Hits:     $0.30
// - Output:         $15.00
//
// Per-token costs in dollars:
// - Input:  $0.000003
// - Output: $0.000015
// - Cache hits: $0.0000003
//
// Typical conversation message:
// - Input: ~500 tokens × $0.000003 = $0.0015
// - Output: ~600 tokens × $0.000015 = $0.009
// - Total per message: ~$0.0105
//
// 1 credit = 1,000 tokens
// We charge by actual tokens used (input + output combined)
// Same price per credit for everyone - no bulk discounts
// This ensures people with less money aren't disadvantaged
//
// PRICING RATIONALE:
// Realistic usage is ~20% input / 80% output (users send short messages, AI gives long responses)
// Cost per 1K tokens at 20/80 split: (200 × $0.000003) + (800 × $0.000015) = $0.0126
// We charge $0.025 per 1K tokens = ~50% profit margin
//
// Long conversations increase input tokens (context grows), but users pay for actual
// tokens used so this is fair. We track input/output separately in AIUsage for analytics.

export const TOKENS_PER_CREDIT = 1000;
export const AI_CREDIT_PRICE = 0.025; // dollars per credit (1,000 tokens) - 50% margin

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

// Pre-defined credit packages (never expire)
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits-100',
    name: 'Light',
    credits: 100,
    price: 2.50,
    description: 'Good for occasional use'
  },
  {
    id: 'credits-250',
    name: 'Regular',
    credits: 250,
    price: 6,
    description: 'Most popular top-up'
  },
  {
    id: 'credits-500',
    name: 'Heavy',
    credits: 500,
    price: 12,
    description: 'For intensive journaling & exploration'
  },
];

// Custom credit purchases: user can enter any dollar amount ($2.50 minimum)
export const MIN_CUSTOM_CREDIT_AMOUNT = 2.50; // minimum $2.50
export const MAX_CUSTOM_CREDIT_AMOUNT = 50; // maximum $50

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
  return subscriptionTier === 'member';
}

/**
 * Check if user can access a specific course tier
 * With single tier, members can access everything
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
