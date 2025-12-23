import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateCSRF, csrfErrorResponse } from "@/lib/csrf";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get('courseSlug');

  // Bounds checking for pagination
  const rawLimit = parseInt(searchParams.get('limit') || '200');
  const rawOffset = parseInt(searchParams.get('offset') || '0');
  const limit = Math.max(1, Math.min(500, isNaN(rawLimit) ? 200 : rawLimit));
  const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

  const whereClause: { userId: string; courseSlug?: string } = {
    userId: session.user.id
  };

  if (courseSlug) {
    whereClause.courseSlug = courseSlug;
  }

  const [progress, total] = await Promise.all([
    prisma.courseProgress.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.courseProgress.count({
      where: whereClause,
    }),
  ]);

  return NextResponse.json({
    progress: progress.map((p) => ({
      courseSlug: p.courseSlug,
      moduleSlug: p.moduleSlug,
      completed: p.completed,
      completedAt: p.completedAt,
      updatedAt: p.updatedAt,
    })),
    total,
    hasMore: offset + progress.length < total,
  });
}

export async function POST(request: NextRequest) {
  // CSRF validation
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseSlug, moduleSlug, completed } = await request.json();

  if (!courseSlug || !moduleSlug) {
    return NextResponse.json({ error: "courseSlug and moduleSlug are required" }, { status: 400 });
  }

  const progress = await prisma.courseProgress.upsert({
    where: {
      userId_courseSlug_moduleSlug: {
        userId: session.user.id,
        courseSlug,
        moduleSlug,
      },
    },
    update: {
      completed: completed ?? true,
      completedAt: completed ? new Date() : null,
    },
    create: {
      userId: session.user.id,
      courseSlug,
      moduleSlug,
      completed: completed ?? true,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json({
    courseSlug: progress.courseSlug,
    moduleSlug: progress.moduleSlug,
    completed: progress.completed,
    completedAt: progress.completedAt,
  });
}

export async function DELETE(request: NextRequest) {
  // CSRF validation
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseSlug, moduleSlug } = await request.json();

  if (!courseSlug || !moduleSlug) {
    return NextResponse.json({ error: "courseSlug and moduleSlug are required" }, { status: 400 });
  }

  await prisma.courseProgress.deleteMany({
    where: {
      userId: session.user.id,
      courseSlug,
      moduleSlug,
    },
  });

  return NextResponse.json({ success: true });
}
