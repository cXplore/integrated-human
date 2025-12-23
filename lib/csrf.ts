/**
 * CSRF Protection for API Routes
 *
 * Uses Origin/Referer header validation combined with SameSite cookies (set by NextAuth).
 * This is the recommended approach for modern browsers and is more reliable than token-based CSRF.
 *
 * How it works:
 * 1. For state-changing requests (POST, PUT, DELETE, PATCH), we verify the Origin header
 * 2. The Origin must match our allowed origins (production domain or localhost for dev)
 * 3. If Origin is missing (older browsers), we fall back to Referer header
 * 4. Combined with SameSite=Lax cookies from NextAuth, this provides strong CSRF protection
 */

// Allowed origins - add your production domain here
const ALLOWED_ORIGINS = [
  'https://integratedhuman.co',
  'https://www.integratedhuman.co',
  'https://integrated-human.vercel.app',
  // Development
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Methods that don't require CSRF validation (safe methods)
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CSRF protection for a request
 * Call this at the start of state-changing API routes (POST, PUT, DELETE, PATCH)
 */
export function validateCSRF(request: Request): CSRFValidationResult {
  const method = request.method.toUpperCase();

  // Safe methods don't need CSRF validation
  if (SAFE_METHODS.includes(method)) {
    return { valid: true };
  }

  // Get Origin header (preferred)
  const origin = request.headers.get('origin');

  // Get Referer as fallback
  const referer = request.headers.get('referer');

  // In development, be more lenient
  if (process.env.NODE_ENV === 'development') {
    // Still validate if headers are present, but don't block if missing
    if (origin && !isAllowedOrigin(origin)) {
      return { valid: false, error: 'Invalid origin' };
    }
    return { valid: true };
  }

  // Production: require valid Origin or Referer
  if (origin) {
    if (isAllowedOrigin(origin)) {
      return { valid: true };
    }
    return { valid: false, error: 'Invalid origin' };
  }

  // Fall back to Referer if no Origin
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (isAllowedOrigin(refererOrigin)) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid referer' };
    } catch {
      return { valid: false, error: 'Invalid referer URL' };
    }
  }

  // No Origin or Referer - block in production
  return { valid: false, error: 'Missing origin header' };
}

/**
 * Check if an origin is in the allowed list
 */
function isAllowedOrigin(origin: string): boolean {
  // Normalize origin (remove trailing slash if any)
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();

  return ALLOWED_ORIGINS.some(allowed =>
    normalizedOrigin === allowed.toLowerCase()
  );
}

/**
 * Create a CSRF error response
 */
export function csrfErrorResponse(error: string = 'CSRF validation failed'): Response {
  return new Response(
    JSON.stringify({ error, code: 'CSRF_FAILED' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Helper to add to API routes that need CSRF protection
 *
 * Usage:
 * ```ts
 * export async function POST(request: Request) {
 *   const csrf = validateCSRF(request);
 *   if (!csrf.valid) {
 *     return csrfErrorResponse(csrf.error);
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
