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

        if (credits <= 0) {
          console.error('Invalid credits amount in metadata:', session.id);
          break;
        }

        try {
          // Add purchased tokens to user's balance
          await prisma.aICredits.upsert({
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
          await prisma.creditPurchase.create({
            data: {
              userId,
              credits,
              tokens,
              amount: session.amount_total || 0,
              stripePaymentId: session.payment_intent as string,
            },
          });

          console.log(`Credit purchase recorded for user ${userId}, credits: ${credits}, tokens: ${tokens}, package: ${packageId}`);
        } catch (error) {
          console.error('Error processing credit purchase:', error);
        }
        break;
      }

      // Handle bundle purchase
      if (purchaseType === 'bundle') {
        const courseSlugs = session.metadata?.courseSlugs?.split(',') || [];
        const bundleId = session.metadata?.bundleId;

        if (courseSlugs.length === 0) {
          console.error('No course slugs in bundle metadata:', session.id);
          break;
        }

        // Create purchase records for all courses in the bundle
        try {
          for (const courseSlug of courseSlugs) {
            // Check if already purchased (in case user owned some courses already)
            const existing = await prisma.purchase.findUnique({
              where: {
                userId_courseSlug: { userId, courseSlug },
              },
            });

            if (!existing) {
              await prisma.purchase.create({
                data: {
                  userId,
                  courseSlug,
                  stripePaymentId: session.payment_intent as string,
                  stripeCustomerId: session.customer as string | null,
                  amount: Math.round((session.amount_total || 0) / courseSlugs.length),
                  currency: session.currency || 'usd',
                  status: 'completed',
                },
              });
            }
          }
          console.log(`Bundle purchase recorded for user ${userId}, bundle ${bundleId}, courses: ${courseSlugs.join(', ')}`);
        } catch (error) {
          console.error('Error creating bundle purchase records:', error);
        }
        break;
      }

      // Handle single course purchase
      const courseSlug = session.metadata?.courseSlug;

      if (!courseSlug) {
        console.error('Missing courseSlug in checkout session:', session.id);
        break;
      }

      // Create purchase record
      try {
        await prisma.purchase.create({
          data: {
            userId,
            courseSlug,
            stripePaymentId: session.payment_intent as string,
            stripeCustomerId: session.customer as string | null,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: 'completed',
          },
        });
        console.log(`Purchase recorded for user ${userId}, course ${courseSlug}`);
      } catch (error) {
        // Handle duplicate purchase (user might have already purchased)
        console.error('Error creating purchase record:', error);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;

      // Update purchase status to refunded
      try {
        await prisma.purchase.updateMany({
          where: {
            stripePaymentId: charge.payment_intent as string,
          },
          data: {
            status: 'refunded',
          },
        });
        console.log(`Purchase refunded for payment ${charge.payment_intent}`);
      } catch (error) {
        console.error('Error updating purchase status:', error);
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

        // Initialize or update AI tokens
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
            // Reset monthly AI tokens
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

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
