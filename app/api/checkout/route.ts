import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getCourseBySlug } from '@/lib/courses';
import { getBundleWithCourses } from '@/lib/bundles';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to purchase a course' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, courseSlug, bundleId, bundleTitle, price: bundlePrice } = body;

    // Handle bundle purchase
    if (type === 'bundle') {
      if (!bundleId) {
        return NextResponse.json(
          { error: 'Bundle ID is required' },
          { status: 400 }
        );
      }

      const bundle = getBundleWithCourses(bundleId);
      if (!bundle) {
        return NextResponse.json(
          { error: 'Bundle not found' },
          { status: 404 }
        );
      }

      // Check if user already owns all courses in the bundle
      const existingPurchases = await prisma.purchase.findMany({
        where: {
          userId: session.user.id,
          courseSlug: { in: bundle.courses },
        },
      });

      const ownedCourses = existingPurchases.map((p) => p.courseSlug);
      const unownedCourses = bundle.courses.filter((c) => !ownedCourses.includes(c));

      if (unownedCourses.length === 0) {
        return NextResponse.json(
          { error: 'You already own all courses in this bundle' },
          { status: 400 }
        );
      }

      // Create Stripe checkout session for bundle
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: bundle.title,
                description: `Bundle includes ${bundle.courseDetails.length} courses: ${bundle.courseDetails.map((c) => c.metadata.title).join(', ')}`,
              },
              unit_amount: formatAmountForStripe(bundle.bundlePrice),
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: session.user.id,
          type: 'bundle',
          bundleId: bundle.id,
          bundleTitle: bundle.title,
          courseSlugs: bundle.courses.join(','),
        },
        customer_email: session.user.email || undefined,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/bundles/${bundleId}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/bundles/${bundleId}?purchase=cancelled`,
      });

      return NextResponse.json({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      });
    }

    // Handle single course purchase
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
        type: 'course',
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
