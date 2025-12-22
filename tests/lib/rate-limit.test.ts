import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset time for consistent tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', () => {
    const result = checkRateLimit('test-user-1', { limit: 5, windowMs: 60000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should block requests over limit', () => {
    const config = { limit: 3, windowMs: 60000 };

    // Make 3 requests (should all succeed)
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit('test-user-2', config);
      expect(result.success).toBe(true);
    }

    // 4th request should be blocked
    const blocked = checkRateLimit('test-user-2', config);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('should reset after window expires', () => {
    const config = { limit: 2, windowMs: 1000 }; // 1 second window

    // Use up all requests
    checkRateLimit('test-user-3', config);
    checkRateLimit('test-user-3', config);

    // Should be blocked
    expect(checkRateLimit('test-user-3', config).success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1001);

    // Should be allowed again
    expect(checkRateLimit('test-user-3', config).success).toBe(true);
  });

  it('should track different identifiers separately', () => {
    const config = { limit: 1, windowMs: 60000 };

    // First user uses their limit
    checkRateLimit('user-a', config);
    expect(checkRateLimit('user-a', config).success).toBe(false);

    // Second user should still be allowed
    expect(checkRateLimit('user-b', config).success).toBe(true);
  });

  it('should have correct resetTime value when blocked', () => {
    const config = { limit: 1, windowMs: 5000 };
    const now = Date.now();

    checkRateLimit('test-user-4', config);
    const blocked = checkRateLimit('test-user-4', config);

    expect(blocked.success).toBe(false);
    expect(blocked.resetTime).toBeDefined();
    // resetTime should be in the future (now + windowMs)
    expect(blocked.resetTime).toBeGreaterThanOrEqual(now);
    expect(blocked.resetTime).toBeLessThanOrEqual(now + config.windowMs + 100); // Small buffer for test timing
  });

  it('should have defined rate limit configs', () => {
    expect(RATE_LIMITS.chat).toBeDefined();
    expect(RATE_LIMITS.chat.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.chat.windowMs).toBeGreaterThan(0);

    expect(RATE_LIMITS.aiHeavy).toBeDefined();
    expect(RATE_LIMITS.contact).toBeDefined();
    expect(RATE_LIMITS.api).toBeDefined();
  });
});
