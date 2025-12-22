import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { SUBSCRIPTION_TIERS } from '@/lib/subscriptions';

/**
 * GET /api/subscriptions
 * Get current user's subscription details
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    // Get tier details
    const tierConfig = SUBSCRIPTION_TIERS[subscription.tier as keyof typeof SUBSCRIPTION_TIERS];

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        tierName: tierConfig?.name || subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        features: tierConfig?.features || [],
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Manage subscription (cancel, resume, etc.)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'cancel': {
        // Cancel at period end (not immediate)
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        await prisma.subscription.update({
          where: { userId: session.user.id },
          data: { cancelAtPeriodEnd: true },
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription will be canceled at the end of the billing period',
        });
      }

      case 'resume': {
        // Resume a subscription that was set to cancel
        if (!subscription.cancelAtPeriodEnd) {
          return NextResponse.json(
            { error: 'Subscription is not set to cancel' },
            { status: 400 }
          );
        }

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });

        await prisma.subscription.update({
          where: { userId: session.user.id },
          data: { cancelAtPeriodEnd: false },
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription resumed',
        });
      }

      case 'portal': {
        // Create a Stripe Customer Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile/subscription`,
        });

        return NextResponse.json({
          url: portalSession.url,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
