import { NextRequest, NextResponse } from 'next/server';
import { getCourseBySlug } from '@/lib/courses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string }> }
) {
  const { courseSlug } = await params;

  const course = getCourseBySlug(courseSlug);

  if (!course) {
    return NextResponse.json(
      { error: 'Course not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ course });
}
