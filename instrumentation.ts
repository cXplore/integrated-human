/**
 * Next.js Instrumentation
 * Runs on server startup
 */

export async function register() {
  // Validate environment variables on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { checkEnvOnStartup } = await import('./lib/env');
    checkEnvOnStartup();
  }
}
