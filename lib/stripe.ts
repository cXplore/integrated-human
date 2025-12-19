import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env var isn't set
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility - will throw at runtime if key isn't set
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : (null as unknown as Stripe);

export function formatAmountForStripe(amount: number): number {
  // Convert dollars to cents
  return Math.round(amount * 100);
}

export function formatAmountFromStripe(amount: number): number {
  // Convert cents to dollars
  return amount / 100;
}
