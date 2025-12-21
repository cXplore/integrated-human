// Subscription tier configuration

export type SubscriptionTier = 'seeker' | 'practitioner' | 'master';
export type CourseTier = 'intro' | 'beginner' | 'intermediate' | 'advanced' | 'flagship';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyTokens: number; // Tokens included per month (1 credit = 1,000 tokens)
  features: string[];
  courseAccess: {
    included: CourseTier[];
    discounts: Record<CourseTier, number>; // percentage off
  };
  bundleDiscount: number; // percentage off bundles
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  seeker: {
    id: 'seeker',
    name: 'Seeker',
    description: 'Perfect for starting your journey',
    monthlyPrice: 9,
    yearlyPrice: 90, // 2 months free
    monthlyTokens: 50000, // 50 credits = 50,000 tokens
    features: [
      'All articles',
      'Intro & Beginner courses included',
      '30-40% off advanced courses',
      '30% off bundles',
      '50 AI credits/month',
    ],
    courseAccess: {
      included: ['intro', 'beginner'],
      discounts: {
        intro: 0,
        beginner: 0,
        intermediate: 30,
        advanced: 40,
        flagship: 30,
      },
    },
    bundleDiscount: 30,
  },
  practitioner: {
    id: 'practitioner',
    name: 'Practitioner',
    description: 'For committed personal growth',
    monthlyPrice: 29,
    yearlyPrice: 290, // 2 months free
    monthlyTokens: 100000, // 100 credits = 100,000 tokens
    features: [
      'All articles',
      'Intro, Beginner & Intermediate courses included',
      '50% off advanced & flagship courses',
      '50% off bundles',
      '100 AI credits/month',
      'Intermediate PDFs & resources',
    ],
    courseAccess: {
      included: ['intro', 'beginner', 'intermediate'],
      discounts: {
        intro: 0,
        beginner: 0,
        intermediate: 0,
        advanced: 50,
        flagship: 50,
      },
    },
    bundleDiscount: 50,
  },
  master: {
    id: 'master',
    name: 'Master',
    description: 'Full access to everything',
    monthlyPrice: 99,
    yearlyPrice: 990, // 2 months free
    monthlyTokens: 500000, // 500 credits = 500,000 tokens
    features: [
      'All articles',
      'All courses included',
      'All bundles included',
      '500 AI credits/month',
      'All PDFs, books & resources',
      'Priority support',
    ],
    courseAccess: {
      included: ['intro', 'beginner', 'intermediate', 'advanced', 'flagship'],
      discounts: {
        intro: 0,
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        flagship: 0,
      },
    },
    bundleDiscount: 100, // 100% = included
  },
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
  credits: number;  // 1 credit = 1,000 tokens
  price: number;    // in dollars
}

// Pre-defined credit packages (never expire)
export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'credits-200', credits: 200, price: 5 },     // 200K tokens for $5
  { id: 'credits-500', credits: 500, price: 12.50 }, // 500K tokens for $12.50
  { id: 'credits-1000', credits: 1000, price: 25 },  // 1M tokens for $25
];

// Custom credit purchases: user can enter any dollar amount ($5 minimum)
// Credits = (amount / AI_CREDIT_PRICE) = amount × 40 credits per dollar
export const MIN_CUSTOM_CREDIT_AMOUNT = 5; // minimum $5
export const MAX_CUSTOM_CREDIT_AMOUNT = 100; // maximum $100

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
 * Check if a subscription tier has access to a course tier
 */
export function hasAccessToCourse(
  subscriptionTier: SubscriptionTier | null,
  courseTier: CourseTier
): boolean {
  if (!subscriptionTier) return false;
  const config = SUBSCRIPTION_TIERS[subscriptionTier];
  return config.courseAccess.included.includes(courseTier);
}

/**
 * Get the discount percentage for a course tier given a subscription
 */
export function getCourseDiscount(
  subscriptionTier: SubscriptionTier | null,
  courseTier: CourseTier
): number {
  if (!subscriptionTier) return 0;
  const config = SUBSCRIPTION_TIERS[subscriptionTier];
  return config.courseAccess.discounts[courseTier] || 0;
}

/**
 * Get the bundle discount for a subscription tier
 */
export function getBundleDiscount(subscriptionTier: SubscriptionTier | null): number {
  if (!subscriptionTier) return 0;
  return SUBSCRIPTION_TIERS[subscriptionTier].bundleDiscount;
}

/**
 * Calculate the discounted price for a course
 */
export function getDiscountedPrice(
  originalPrice: number,
  subscriptionTier: SubscriptionTier | null,
  courseTier: CourseTier
): number {
  if (!subscriptionTier) return originalPrice;

  // If course is included, price is 0
  if (hasAccessToCourse(subscriptionTier, courseTier)) {
    return 0;
  }

  const discount = getCourseDiscount(subscriptionTier, courseTier);
  return Math.round(originalPrice * (1 - discount / 100) * 100) / 100;
}

/**
 * Get monthly tokens for a tier
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
