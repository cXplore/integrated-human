import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessCourse } from '@/lib/access';
import { getCourseBySlug } from '@/lib/courses';

interface RouteParams {
  params: Promise<{ courseSlug: string }>;
}

/**
 * GET /api/courses/[courseSlug]/access
 * Check if the current user has access to a specific course
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { courseSlug } = await params;
    const session = await auth();

    // Get course to determine tier
    const course = getCourseBySlug(courseSlug);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const courseTier = course.metadata.tier;

    // Free courses are always accessible
    if (courseTier === 'intro') {
      return NextResponse.json({
        hasAccess: true,
        reason: 'free',
        tier: courseTier,
      });
    }

    // Not logged in - no access to paid content
    if (!session?.user?.id) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'none',
        tier: courseTier,
        requiresAuth: true,
      });
    }

    // Check access via subscription or purchase
    const access = await canAccessCourse(session.user.id, courseSlug, courseTier);

    return NextResponse.json({
      ...access,
      tier: courseTier,
    });
  } catch (error) {
    console.error('Error checking course access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
