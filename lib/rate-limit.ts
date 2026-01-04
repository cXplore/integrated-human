/**
 * Database-backed rate limiter
 *
 * Persists rate limit data in PostgreSQL for:
 * - Persistence across server restarts
 * - Consistency across multiple serverless instances
 *
 * Falls back to in-memory for non-critical paths if DB is unavailable.
 */

import { prisma } from './prisma';

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

// In-memory fallback for when DB is unavailable
const memoryFallback = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given identifier (e.g., user ID or IP)
 * Uses database for persistence, with in-memory fallback
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetTime = now + config.windowMs;

  try {
    // Try to get existing entry
    const existing = await prisma.rateLimitEntry.findUnique({
      where: { id: identifier },
    });

    // If no entry or entry has expired, create/reset
    if (!existing || existing.resetTime.getTime() < now) {
      await prisma.rateLimitEntry.upsert({
        where: { id: identifier },
        update: {
          count: 1,
          resetTime: new Date(resetTime),
        },
        create: {
          id: identifier,
          count: 1,
          resetTime: new Date(resetTime),
        },
      });

      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - 1,
        resetTime,
      };
    }

    // Entry exists and is still valid - increment
    const newCount = existing.count + 1;

    // Update count
    await prisma.rateLimitEntry.update({
      where: { id: identifier },
      data: { count: newCount },
    });

    // Check if over limit
    if (newCount > config.limit) {
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        resetTime: existing.resetTime.getTime(),
      };
    }

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - newCount,
      resetTime: existing.resetTime.getTime(),
    };
  } catch (error) {
    console.error('Rate limit DB error, using memory fallback:', error);
    // Fall back to in-memory
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * Synchronous rate limit check (uses memory fallback)
 * Use this for backwards compatibility where async isn't possible
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimitMemory(identifier, config);
}

/**
 * In-memory rate limit check (fallback)
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memoryFallback.get(identifier);

  // If no entry or entry has expired, create a new one
  if (!entry || now > entry.resetTime) {
    const newEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    memoryFallback.set(identifier, newEntry);
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
 * Clean up expired rate limit entries
 * Call this periodically (e.g., via cron job)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = new Date();

  try {
    const result = await prisma.rateLimitEntry.deleteMany({
      where: {
        resetTime: { lt: now },
      },
    });
    return result.count;
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    return 0;
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // AI chat endpoints - more restrictive
  chat: { limit: 20, windowMs: 60 * 1000 }, // 20 requests per minute

  // AI interpretation/synthesis - expensive operations
  aiHeavy: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute

  // AI lighter operations (patterns, analysis)
  aiLight: { limit: 30, windowMs: 60 * 1000 }, // 30 requests per minute

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

// Clean up in-memory fallback periodically
if (typeof setInterval !== 'undefined') {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryFallback.entries()) {
      if (now > entry.resetTime) {
        memoryFallback.delete(key);
      }
    }
  }, 60000);

  if (cleanup.unref) {
    cleanup.unref();
  }
}
