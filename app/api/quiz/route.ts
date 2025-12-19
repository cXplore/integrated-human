import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCourseBySlug } from '@/lib/courses';

// GET - Get quiz status for a course (has passed, best score, etc.)
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get('courseSlug');

  if (!courseSlug) {
    return NextResponse.json({ error: 'Course slug required' }, { status: 400 });
  }

  // Get all attempts for this course
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      courseSlug,
    },
    orderBy: { attemptedAt: 'desc' },
  });

  const hasPassed = attempts.some(a => a.passed);
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
  const attemptCount = attempts.length;

  return NextResponse.json({
    hasPassed,
    bestScore,
    attemptCount,
    lastAttempt: attempts[0] || null,
  });
}

// POST - Submit quiz answers
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseSlug, answers } = await request.json();

  if (!courseSlug || !answers) {
    return NextResponse.json({ error: 'Course slug and answers required' }, { status: 400 });
  }

  // Get course with quiz
  const course = getCourseBySlug(courseSlug);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (!course.metadata.quiz) {
    return NextResponse.json({ error: 'This course has no quiz' }, { status: 400 });
  }

  const { quiz } = course.metadata;

  // Calculate score
  let correctCount = 0;
  const results: { questionId: number; correct: boolean; userAnswer: number; correctAnswer: number }[] = [];

  quiz.questions.forEach((question) => {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correctIndex;
    if (isCorrect) correctCount++;

    results.push({
      questionId: question.id,
      correct: isCorrect,
      userAnswer,
      correctAnswer: question.correctIndex,
    });
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  // Save attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      courseSlug,
      score,
      passed,
      answers: JSON.stringify(answers),
    },
  });

  return NextResponse.json({
    score,
    passed,
    passingScore: quiz.passingScore,
    correctCount,
    totalQuestions: quiz.questions.length,
    results,
    attemptId: attempt.id,
  });
}
