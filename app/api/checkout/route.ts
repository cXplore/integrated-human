import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getCourseBySlug } from '@/lib/courses';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to purchase a course' },
        { status: 401 }
      );
    }

    const { courseSlug } = await request.json();

    if (!courseSlug) {
      return NextResponse.json(
        { error: 'Course slug is required' },
        { status: 400 }
      );
    }

    // Get course details
    const course = getCourseBySlug(courseSlug);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already purchased
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_courseSlug: {
          userId: session.user.id,
          courseSlug,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased this course' },
        { status: 400 }
      );
    }

    const { metadata } = course;

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: metadata.currency?.toLowerCase() || 'usd',
            product_data: {
              name: metadata.title,
              description: metadata.subtitle || metadata.description?.slice(0, 200),
              images: metadata.image ? [`${process.env.NEXT_PUBLIC_BASE_URL}${metadata.image}`] : undefined,
            },
            unit_amount: formatAmountForStripe(metadata.price),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        courseSlug: courseSlug,
        courseName: metadata.title,
      },
      customer_email: session.user.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/courses/${courseSlug}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/courses/${courseSlug}?purchase=cancelled`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
