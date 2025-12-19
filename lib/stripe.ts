import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export function formatAmountForStripe(amount: number): number {
  // Convert dollars to cents
  return Math.round(amount * 100);
}

export function formatAmountFromStripe(amount: number): number {
  // Convert cents to dollars
  return amount / 100;
}
