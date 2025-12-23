import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { SubscriptionTier, getMonthlyTokens, TOKENS_PER_CREDIT } from '@/lib/subscriptions';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const purchaseType = session.metadata?.type || 'course';

      if (!userId) {
        console.error('Missing userId in checkout session:', session.id);
        break;
      }

      // Handle credit purchase (token-based)
      if (purchaseType === 'credit_purchase') {
        const credits = parseInt(session.metadata?.credits || '0', 10);
        const packageId = session.metadata?.packageId;
        const tokens = credits * TOKENS_PER_CREDIT; // Convert credits to tokens
        const paymentIntentId = session.payment_intent as string;

        if (credits <= 0) {
          console.error('Invalid credits amount in metadata:', session.id);
          break;
        }

        if (!paymentIntentId) {
          console.error('Missing payment_intent in session:', session.id);
          break;
        }

        try {
          // IDEMPOTENCY CHECK: Skip if already processed
          const existingPurchase = await prisma.creditPurchase.findFirst({
            where: { stripePaymentId: paymentIntentId },
          });

          if (existingPurchase) {
            console.log(`Credit purchase already processed for payment ${paymentIntentId}, skipping`);
            break;
          }

          // Use transaction to ensure atomicity
          await prisma.$transaction(async (tx) => {
            // Add purchased tokens to user's balance
            await tx.aICredits.upsert({
              where: { userId },
              update: {
                purchasedTokens: { increment: tokens },
                tokenBalance: { increment: tokens },
              },
              create: {
                userId,
                tokenBalance: tokens,
                monthlyTokens: 0,
                monthlyUsed: 0,
                purchasedTokens: tokens,
              },
            });

            // Record the credit purchase
            await tx.creditPurchase.create({
              data: {
                userId,
                credits,
                tokens,
                amount: session.amount_total || 0,
                stripePaymentId: paymentIntentId,
              },
            });
          });

          console.log(`Credit purchase recorded for user ${userId}, credits: ${credits}, tokens: ${tokens}, package: ${packageId}`);
        } catch (error) {
          console.error('Error processing credit purchase:', error);
        }
        break;
      }

      // Unknown purchase type - log it
      console.warn(`Unknown purchase type in checkout session: ${purchaseType}`, session.id);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      if (!paymentIntentId) {
        console.error('Missing payment_intent in refunded charge:', charge.id);
        break;
      }

      // Handle credit purchase refunds - deduct the refunded tokens
      try {
        const creditPurchase = await prisma.creditPurchase.findFirst({
          where: { stripePaymentId: paymentIntentId },
        });

        if (creditPurchase) {
          // IDEMPOTENCY CHECK: Skip if already processed
          if (creditPurchase.refunded) {
            console.log(`Refund already processed for payment ${paymentIntentId}, skipping`);
            break;
          }

          // Use transaction to ensure atomicity
          await prisma.$transaction(async (tx) => {
            // Get current user balance
            const user = await tx.aICredits.findUnique({
              where: { userId: creditPurchase.userId },
            });

            if (user) {
              // Refund tokens from the user's balance
              await tx.aICredits.update({
                where: { userId: creditPurchase.userId },
                data: {
                  purchasedTokens: { decrement: creditPurchase.tokens },
                  tokenBalance: { decrement: Math.min(creditPurchase.tokens, user.tokenBalance) },
                },
              });
            }

            // Mark the credit purchase as refunded
            await tx.creditPurchase.update({
              where: { id: creditPurchase.id },
              data: { refunded: true, refundedAt: new Date() },
            });
          });

          console.log(`Credit purchase refunded for user ${creditPurchase.userId}, tokens: ${creditPurchase.tokens}`);
        }
      } catch (error) {
        console.error('Error processing refund:', error);
      }
      break;
    }

    // Subscription events
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
      };
      const userId = subscription.metadata?.userId;
      const tier = subscription.metadata?.tier as SubscriptionTier;

      if (!userId || !tier) {
        console.error('Missing userId or tier in subscription metadata:', subscription.id);
        break;
      }

      try {
        // Upsert subscription record
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            tier,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0]?.price.id || '',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          create: {
            userId,
            tier,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0]?.price.id || '',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        // Initialize or update AI tokens based on tier
        const monthlyTokens = getMonthlyTokens(tier);

        // Get existing purchased tokens to preserve them
        const existingCredits = await prisma.aICredits.findUnique({
          where: { userId },
        });
        const purchasedTokens = existingCredits?.purchasedTokens || 0;

        await prisma.aICredits.upsert({
          where: { userId },
          update: {
            monthlyTokens: monthlyTokens,
            tokenBalance: monthlyTokens + purchasedTokens, // Monthly + purchased
            monthlyUsed: 0,
            lastMonthlyReset: new Date(),
          },
          create: {
            userId,
            tokenBalance: monthlyTokens,
            monthlyTokens: monthlyTokens,
            monthlyUsed: 0,
            purchasedTokens: 0,
          },
        });

        console.log(`Subscription ${event.type} for user ${userId}, tier: ${tier}`);
      } catch (error) {
        console.error('Error handling subscription event:', error);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error('Missing userId in subscription metadata:', subscription.id);
        break;
      }

      try {
        // Update subscription status to canceled
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'canceled',
          },
        });

        // Reset monthly tokens (keep purchased tokens)
        const currentCredits = await prisma.aICredits.findUnique({
          where: { userId },
        });

        if (currentCredits) {
          await prisma.aICredits.update({
            where: { userId },
            data: {
              monthlyTokens: 0,
              monthlyUsed: 0,
              tokenBalance: currentCredits.purchasedTokens, // Keep only purchased
            },
          });
        }

        console.log(`Subscription canceled for user ${userId}`);
      } catch (error) {
        console.error('Error handling subscription deletion:', error);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | null;
      };

      // Only handle subscription renewals (not initial payment)
      if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
        const subscriptionId = invoice.subscription;

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;
          const tier = subscription.metadata?.tier as SubscriptionTier;

          if (userId && tier) {
            // Reset monthly AI tokens based on tier
            const monthlyTokens = getMonthlyTokens(tier);
            const currentCredits = await prisma.aICredits.findUnique({
              where: { userId },
            });

            await prisma.aICredits.update({
              where: { userId },
              data: {
                monthlyTokens: monthlyTokens,
                monthlyUsed: 0,
                tokenBalance: monthlyTokens + (currentCredits?.purchasedTokens || 0),
                lastMonthlyReset: new Date(),
              },
            });

            console.log(`Monthly tokens reset for user ${userId}, tier: ${tier}, tokens: ${monthlyTokens}`);
          }
        } catch (error) {
          console.error('Error resetting monthly credits:', error);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | null;
      };

      if (invoice.subscription) {
        const subscriptionId = invoice.subscription;

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Update subscription status to past_due
            await prisma.subscription.update({
              where: { userId },
              data: {
                status: 'past_due',
              },
            });

            // Log for monitoring/alerting - could integrate with email service
            console.warn(`Payment failed for user ${userId}, subscription ${subscriptionId}`);

            // Note: Stripe will retry the payment automatically based on your settings.
            // Consider sending the user an email notification here.
            // After final retry failure, Stripe will send customer.subscription.deleted
          }
        } catch (error) {
          console.error('Error handling payment failure:', error);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
