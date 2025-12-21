import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/subscriptions';

// Stripe Price IDs - these need to be created in Stripe Dashboard
// For now, we'll create prices dynamically. In production, use pre-created Price IDs.
const STRIPE_PRICE_IDS: Record<SubscriptionTier, { monthly: string; yearly: string }> = {
  seeker: {
    monthly: process.env.STRIPE_PRICE_SEEKER_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_SEEKER_YEARLY || '',
  },
  practitioner: {
    monthly: process.env.STRIPE_PRICE_PRACTITIONER_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PRACTITIONER_YEARLY || '',
  },
  master: {
    monthly: process.env.STRIPE_PRICE_MASTER_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_MASTER_YEARLY || '',
  },
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to subscribe' },
        { status: 401 }
      );
    }

    const { tier, interval } = await request.json() as {
      tier: SubscriptionTier;
      interval: 'monthly' | 'yearly';
    };

    if (!tier || !SUBSCRIPTION_TIERS[tier]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    if (interval !== 'monthly' && interval !== 'yearly') {
      return NextResponse.json(
        { error: 'Invalid interval' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage it from your profile.' },
        { status: 400 }
      );
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier];
    const price = interval === 'monthly' ? tierConfig.monthlyPrice : tierConfig.yearlyPrice;

    // Check if we have pre-configured Stripe Price IDs
    let priceId = STRIPE_PRICE_IDS[tier][interval];

    // If no pre-configured price, create one dynamically (for development)
    if (!priceId) {
      // First, find or create a product
      const products = await stripe.products.search({
        query: `name:'Integrated Human ${tierConfig.name}'`,
      });

      let productId: string;
      if (products.data.length > 0) {
        productId = products.data[0].id;
      } else {
        const product = await stripe.products.create({
          name: `Integrated Human ${tierConfig.name}`,
          description: tierConfig.description,
        });
        productId = product.id;
      }

      // Create the price
      const stripePrice = await stripe.prices.create({
        product: productId,
        unit_amount: formatAmountForStripe(price),
        currency: 'usd',
        recurring: {
          interval: interval === 'monthly' ? 'month' : 'year',
        },
        metadata: {
          tier,
          interval,
        },
      });
      priceId = stripePrice.id;
    }

    // Create Stripe checkout session for subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        tier,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          tier,
        },
      },
      customer_email: session.user.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?subscription=cancelled`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
