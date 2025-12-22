import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyCaptcha, isCaptchaEnabled } from '@/lib/captcha';

describe('CAPTCHA Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should skip verification when no secret key is configured', async () => {
    // Ensure no secret key
    delete process.env.RECAPTCHA_SECRET_KEY;

    // Re-import to get fresh module with no secret
    const { verifyCaptcha: freshVerify } = await import('@/lib/captcha');

    const result = await freshVerify('any-token');
    expect(result.success).toBe(true);
    expect(result.score).toBe(1.0);
  });

  it('should fail when no token provided and captcha is enabled', async () => {
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret';

    const { verifyCaptcha: freshVerify } = await import('@/lib/captcha');

    const result = await freshVerify('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No captcha token');
  });

  it('should correctly report captcha enabled status', () => {
    // Without key
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(isCaptchaEnabled()).toBe(false);
  });
});
