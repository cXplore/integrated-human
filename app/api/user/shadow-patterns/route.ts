import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserShadowPatterns } from '@/lib/shadow-patterns';

/**
 * GET /api/user/shadow-patterns
 * Get user's detected shadow patterns
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const patterns = await getUserShadowPatterns(session.user.id);

    return NextResponse.json({
      patterns,
      disclaimer: 'These patterns are invitations for reflection, not diagnoses. Take what resonates and leave what doesn\'t.',
    });
  } catch (error) {
    console.error('Error fetching shadow patterns:', error);
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
  }
}
