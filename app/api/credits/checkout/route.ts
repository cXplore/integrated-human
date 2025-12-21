import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import {
  CREDIT_PACKAGES,
  AI_CREDIT_PRICE,
  MIN_CUSTOM_CREDIT_AMOUNT,
  MAX_CUSTOM_CREDIT_AMOUNT,
} from '@/lib/subscriptions';

interface CheckoutRequest {
  packageId?: string;
  customAmount?: number;
  credits?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to purchase credits' },
        { status: 401 }
      );
    }

    const body = await request.json() as CheckoutRequest;
    const { packageId, customAmount } = body;

    let credits: number;
    let price: number;
    let description: string;

    if (customAmount !== undefined) {
      // Custom amount purchase
      if (
        typeof customAmount !== 'number' ||
        customAmount < MIN_CUSTOM_CREDIT_AMOUNT ||
        customAmount > MAX_CUSTOM_CREDIT_AMOUNT
      ) {
        return NextResponse.json(
          { error: `Amount must be between $${MIN_CUSTOM_CREDIT_AMOUNT} and $${MAX_CUSTOM_CREDIT_AMOUNT}` },
          { status: 400 }
        );
      }

      credits = Math.floor(customAmount / AI_CREDIT_PRICE);
      price = customAmount;
      description = `Purchase ${credits.toLocaleString()} AI credits (custom amount)`;
    } else if (packageId) {
      // Package purchase
      const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);

      if (!creditPackage) {
        return NextResponse.json(
          { error: 'Invalid credit package' },
          { status: 400 }
        );
      }

      credits = creditPackage.credits;
      price = creditPackage.price;
      description = `Purchase ${credits.toLocaleString()} AI credits`;
    } else {
      return NextResponse.json(
        { error: 'Either packageId or customAmount is required' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session for one-time payment
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits.toLocaleString()} AI Credits`,
              description,
            },
            unit_amount: formatAmountForStripe(price),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        type: 'credit_purchase',
        packageId: packageId || 'custom',
        credits: credits.toString(),
      },
      customer_email: session.user.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile?credits=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?credits=cancelled`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Credit purchase checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
