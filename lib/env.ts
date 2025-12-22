/**
 * Environment variable validation
 * Validates required environment variables on server startup
 */

type EnvVar = {
  name: string;
  required: boolean;
  description: string;
};

const envVars: EnvVar[] = [
  // Database
  { name: 'DATABASE_URL', required: true, description: 'Prisma database connection string' },

  // Auth
  { name: 'NEXTAUTH_SECRET', required: true, description: 'NextAuth.js secret for JWT signing' },
  { name: 'NEXTAUTH_URL', required: false, description: 'NextAuth.js URL (auto-detected in Vercel)' },
  { name: 'GOOGLE_CLIENT_ID', required: false, description: 'Google OAuth client ID' },
  { name: 'GOOGLE_CLIENT_SECRET', required: false, description: 'Google OAuth client secret' },

  // Stripe
  { name: 'STRIPE_SECRET_KEY', required: true, description: 'Stripe API secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: true, description: 'Stripe webhook signing secret' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: false, description: 'Stripe publishable key' },

  // AI / LM Studio
  { name: 'LM_STUDIO_URL', required: false, description: 'LM Studio API endpoint (defaults to 127.0.0.1:1234)' },
  { name: 'LM_STUDIO_MODEL', required: false, description: 'LM Studio model name' },

  // Captcha (optional)
  { name: 'TURNSTILE_SECRET_KEY', required: false, description: 'Cloudflare Turnstile secret key' },
  { name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', required: false, description: 'Cloudflare Turnstile site key' },
];

/**
 * Validates environment variables and logs warnings/errors
 * Call this on server startup
 */
export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        errors.push(`Missing required env var: ${envVar.name} (${envVar.description})`);
      } else {
        warnings.push(`Optional env var not set: ${envVar.name}`);
      }
    }
  }

  // Additional validation checks
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with sk_ (test or live)');
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET must start with whsec_');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates env vars and logs to console
 * Silent in production unless errors are found
 */
export function checkEnvOnStartup(): void {
  const { valid, errors, warnings } = validateEnv();
  const isDev = process.env.NODE_ENV === 'development';

  if (!valid) {
    console.error('\n❌ Environment variable validation failed:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\n');

    // In production, fail fast for critical issues
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Critical environment variables missing. Check server logs.');
    }
  }

  // Only show warnings in development
  if (isDev && warnings.length > 0) {
    console.warn('\n⚠️ Environment variable warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
    console.warn('\n');
  }
}

// Export individual env var getters with type safety
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  LM_STUDIO_URL: process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions',
  LM_STUDIO_MODEL: process.env.LM_STUDIO_MODEL || 'qwen/qwen3-32b',
} as const;
