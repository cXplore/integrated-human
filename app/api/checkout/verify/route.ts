import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Verify a Stripe checkout session and record the purchase
// This is a fallback for when webhooks don't reach localhost
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify the session is completed
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify the session belongs to this user
    const userId = checkoutSession.metadata?.userId;
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const courseSlug = checkoutSession.metadata?.courseSlug;
    if (!courseSlug) {
      return NextResponse.json(
        { error: 'Course not found in session' },
        { status: 400 }
      );
    }

    // Check if purchase already exists
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_courseSlug: {
          userId: session.user.id,
          courseSlug,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        message: 'Purchase already recorded',
        courseSlug,
      });
    }

    // Create the purchase record
    await prisma.purchase.create({
      data: {
        userId: session.user.id,
        courseSlug,
        stripePaymentId: checkoutSession.payment_intent as string,
        stripeCustomerId: checkoutSession.customer as string | null,
        amount: checkoutSession.amount_total || 0,
        currency: checkoutSession.currency || 'usd',
        status: 'completed',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase recorded',
      courseSlug,
    });
  } catch (error) {
    console.error('Verify checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
}
