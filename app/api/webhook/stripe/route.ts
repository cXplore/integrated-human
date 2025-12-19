import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

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
      const courseSlug = session.metadata?.courseSlug;

      if (!userId || !courseSlug) {
        console.error('Missing metadata in checkout session:', session.id);
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

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
