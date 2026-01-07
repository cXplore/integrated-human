import { describe, it, expect } from 'vitest';
import {
  calculateTokenCost,
  calculateTotalTokens,
  calculateCreditsUsed,
  hasSubscription,
  canAccessCourseTier,
  tokensToCredits,
  creditsToTokens,
  TOKENS_PER_CREDIT,
  INPUT_TOKEN_COST,
  OUTPUT_TOKEN_COST,
  SUBSCRIPTION_TIERS,
  FREE_TIER,
} from '@/lib/subscriptions';

describe('Token Calculations', () => {
  it('should calculate token cost correctly', () => {
    // 1000 input + 1000 output tokens
    const cost = calculateTokenCost(1000, 1000);

    // Expected: (1000 × $0.000003) + (1000 × $0.000015) = $0.003 + $0.015 = $0.018
    expect(cost).toBeCloseTo(0.018, 6);
  });

  it('should include cache hits in cost calculation', () => {
    const costWithCache = calculateTokenCost(1000, 1000, 500);
    const costWithoutCache = calculateTokenCost(1000, 1000, 0);

    // Cache should add to the cost (but less than regular input)
    expect(costWithCache).toBeGreaterThan(costWithoutCache);
  });

  it('should calculate total tokens correctly', () => {
    const total = calculateTotalTokens(500, 800, 200);
    expect(total).toBe(1500);
  });

  it('should calculate credits used correctly', () => {
    // 2000 tokens = 2 credits
    const credits = calculateCreditsUsed(1000, 1000, 0);
    expect(credits).toBe(2);

    // 500 tokens = 0.5 credits
    const halfCredit = calculateCreditsUsed(250, 250, 0);
    expect(halfCredit).toBe(0.5);
  });
});

describe('Subscription Checks', () => {
  it('should identify member subscription', () => {
    expect(hasSubscription('member')).toBe(true);
    expect(hasSubscription(null)).toBe(false);
  });

  it('should allow intro courses for everyone', () => {
    expect(canAccessCourseTier(null, 'intro')).toBe(true);
    expect(canAccessCourseTier('member', 'intro')).toBe(true);
  });

  it('should restrict non-intro courses for free users', () => {
    expect(canAccessCourseTier(null, 'beginner')).toBe(false);
    expect(canAccessCourseTier(null, 'intermediate')).toBe(false);
    expect(canAccessCourseTier(null, 'advanced')).toBe(false);
    expect(canAccessCourseTier(null, 'flagship')).toBe(false);
  });

  it('should allow all courses for members', () => {
    expect(canAccessCourseTier('member', 'beginner')).toBe(true);
    expect(canAccessCourseTier('member', 'intermediate')).toBe(true);
    expect(canAccessCourseTier('member', 'advanced')).toBe(true);
    expect(canAccessCourseTier('member', 'flagship')).toBe(true);
  });
});

describe('Token/Credit Conversions', () => {
  it('should convert tokens to credits correctly', () => {
    expect(tokensToCredits(1000)).toBe(1);
    expect(tokensToCredits(5000)).toBe(5);
    expect(tokensToCredits(1500)).toBe(1); // Floors the result
    expect(tokensToCredits(999)).toBe(0);
  });

  it('should convert credits to tokens correctly', () => {
    expect(creditsToTokens(1)).toBe(1000);
    expect(creditsToTokens(5)).toBe(5000);
    expect(creditsToTokens(0.5)).toBe(500);
  });

  it('should have consistent TOKENS_PER_CREDIT', () => {
    expect(TOKENS_PER_CREDIT).toBe(1000);
  });
});

describe('Configuration Constants', () => {
  it('should have valid subscription tier config', () => {
    const member = SUBSCRIPTION_TIERS.member;

    expect(member.id).toBe('member');
    expect(member.monthlyPrice).toBe(19);
    expect(member.yearlyPrice).toBe(190);
    expect(member.monthlyTokens).toBe(1000000);
    expect(member.features.length).toBeGreaterThan(0);
  });

  it('should have valid free tier config', () => {
    expect(FREE_TIER.articleLimit).toBe(50);
    expect(FREE_TIER.courseLimit).toBe(5);
    expect(FREE_TIER.courseTiers).toContain('intro');
    expect(FREE_TIER.aiCredits).toBe(0);
  });

  it('should have valid token costs', () => {
    // Input should be cheaper than output
    expect(INPUT_TOKEN_COST).toBeLessThan(OUTPUT_TOKEN_COST);
    expect(INPUT_TOKEN_COST).toBeGreaterThan(0);
    expect(OUTPUT_TOKEN_COST).toBeGreaterThan(0);
  });
});
