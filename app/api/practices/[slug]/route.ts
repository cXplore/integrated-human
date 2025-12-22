import { NextRequest, NextResponse } from 'next/server';
import { getPracticeBySlug } from '@/lib/practices';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/practices/[slug]
 * Get a single practice with full content
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const practice = getPracticeBySlug(slug);

    if (!practice) {
      return NextResponse.json(
        { error: 'Practice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ practice });
  } catch (error) {
    console.error('Error fetching practice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practice' },
      { status: 500 }
    );
  }
}
