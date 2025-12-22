import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCourseBySlug, getAllModulesForCourse } from '@/lib/courses';
import type { CourseTier } from '@/lib/subscriptions';

/**
 * Credential Type System:
 * - "completion": Proof of finishing a course (intro, beginner, intermediate tiers)
 * - "certificate": Official credential with full verification (advanced, flagship tiers)
 *
 * This tiering protects the value of certificates by reserving them for
 * more rigorous, in-depth courses while still acknowledging all completions.
 */
function getCredentialType(tier: CourseTier): 'completion' | 'certificate' {
  if (tier === 'advanced' || tier === 'flagship') {
    return 'certificate';
  }
  return 'completion';
}

// GET - Fetch user's certificates
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    orderBy: { issuedAt: 'desc' },
  });

  return NextResponse.json(certificates);
}

// POST - Issue a certificate for a completed course
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseSlug } = await request.json();

  if (!courseSlug) {
    return NextResponse.json({ error: 'Course slug required' }, { status: 400 });
  }

  // Get course info
  const course = getCourseBySlug(courseSlug);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Get all modules for the course
  const modules = getAllModulesForCourse(courseSlug);

  // Check if user has completed all modules
  const progress = await prisma.courseProgress.findMany({
    where: {
      userId: session.user.id,
      courseSlug,
      completed: true,
    },
  });

  const completedSlugs = new Set(progress.map(p => p.moduleSlug));
  const allCompleted = modules.every(m => completedSlugs.has(m.slug));

  if (!allCompleted) {
    return NextResponse.json({
      error: 'Course not completed',
      completed: progress.length,
      total: modules.length,
    }, { status: 400 });
  }

  // Check if quiz is required and passed, get score for certificate
  let quizScore: number | undefined;
  if (course.metadata.quiz) {
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        courseSlug,
        passed: true,
      },
      orderBy: { score: 'desc' }, // Get best score
    });

    if (!quizAttempt) {
      return NextResponse.json({
        error: 'Quiz not passed',
        message: 'You must pass the course quiz to earn your certificate',
      }, { status: 400 });
    }

    quizScore = quizAttempt.score;
  }

  // Check if certificate already exists
  const existing = await prisma.certificate.findUnique({
    where: {
      userId_courseSlug: {
        userId: session.user.id,
        courseSlug,
      },
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  // Determine credential type based on course tier
  const courseTier = course.metadata.tier;
  const credentialType = getCredentialType(courseTier);

  // Create certificate with tiering information
  const certificate = await prisma.certificate.create({
    data: {
      userId: session.user.id,
      courseSlug,
      courseName: course.metadata.title,
      userName: session.user.name || 'Student',
      credentialType,
      courseTier,
      quizScore,
    },
  });

  return NextResponse.json(certificate, { status: 201 });
}
