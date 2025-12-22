/**
 * Server-side reCAPTCHA v3 verification
 *
 * Usage:
 * 1. Add RECAPTCHA_SECRET_KEY to .env
 * 2. Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY to .env
 * 3. Include reCAPTCHA script in layout or component
 * 4. Get token on form submit: grecaptcha.execute(siteKey, {action: 'contact'})
 * 5. Send token to API route and verify with verifyCaptcha()
 */

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

// Minimum score threshold (0.0 - 1.0, higher is more likely human)
// 0.5 is Google's recommended threshold
const SCORE_THRESHOLD = 0.5;

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface CaptchaResult {
  success: boolean;
  score?: number;
  error?: string;
}

/**
 * Verify a reCAPTCHA v3 token
 * @param token The token from the client
 * @param expectedAction The expected action name (e.g., 'contact', 'signup')
 * @returns CaptchaResult with success status and score
 */
export async function verifyCaptcha(
  token: string,
  expectedAction?: string
): Promise<CaptchaResult> {
  // If no secret key configured, skip verification (development mode)
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('RECAPTCHA_SECRET_KEY not configured, skipping verification');
    return { success: true, score: 1.0 };
  }

  if (!token) {
    return { success: false, error: 'No captcha token provided' };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes']?.join(', ') || 'unknown error';
      return { success: false, error: `Captcha verification failed: ${errorCodes}` };
    }

    // Check score threshold
    const score = data.score ?? 0;
    if (score < SCORE_THRESHOLD) {
      return {
        success: false,
        score,
        error: `Captcha score too low: ${score}`,
      };
    }

    // Optionally verify the action matches
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        score,
        error: `Captcha action mismatch: expected ${expectedAction}, got ${data.action}`,
      };
    }

    return { success: true, score };
  } catch (error) {
    console.error('Captcha verification error:', error);
    return { success: false, error: 'Captcha verification request failed' };
  }
}

/**
 * Check if captcha is required (has secret key configured)
 */
export function isCaptchaEnabled(): boolean {
  return !!RECAPTCHA_SECRET_KEY;
}
