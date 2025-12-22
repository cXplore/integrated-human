/**
 * Simple in-memory rate limiter
 * For production at scale, consider using Redis-based solutions like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for a given identifier (e.g., user ID or IP)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or entry has expired, create a new one
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // AI chat endpoints - more restrictive
  chat: { limit: 20, windowMs: 60 * 1000 }, // 20 requests per minute

  // AI interpretation/synthesis - expensive operations
  aiHeavy: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute

  // Contact form - prevent spam
  contact: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour

  // Lead magnet downloads - prevent abuse
  leadMagnet: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour

  // General API - more lenient
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
} as const;

/**
 * Helper to create rate limit error response
 */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Please slow down and try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
        'Retry-After': String(retryAfter),
      },
    }
  );
}
