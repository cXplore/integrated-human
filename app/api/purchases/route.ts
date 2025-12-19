import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Check if user has purchased a course or get all purchases
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get('courseSlug');

    if (courseSlug) {
      // Check specific course purchase
      const purchase = await prisma.purchase.findUnique({
        where: {
          userId_courseSlug: {
            userId: session.user.id,
            courseSlug,
          },
        },
      });

      return NextResponse.json({
        purchased: !!purchase && purchase.status === 'completed',
        purchase,
      });
    }

    // Get all purchases for user
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return NextResponse.json(
      { error: 'Failed to check purchase status' },
      { status: 500 }
    );
  }
}
