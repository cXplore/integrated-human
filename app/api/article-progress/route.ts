import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateCSRF, csrfErrorResponse } from "@/lib/csrf";

interface ArticleProgressRecord {
  slug: string;
  completed: boolean;
  completedAt: Date | null;
  scrollProgress: number;
  lastReadAt: Date;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.articleProgress.findMany({
    where: { userId: session.user.id },
    orderBy: { lastReadAt: "desc" },
  });

  return NextResponse.json(progress.map((p: ArticleProgressRecord) => ({
    slug: p.slug,
    completed: p.completed,
    completedAt: p.completedAt,
    scrollProgress: p.scrollProgress,
    lastReadAt: p.lastReadAt,
  })));
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

  const { slug, completed, scrollProgress } = await request.json();
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  // Get existing progress to preserve scroll position if not provided
  const existing = await prisma.articleProgress.findUnique({
    where: {
      userId_slug: {
        userId: session.user.id,
        slug,
      },
    },
  });

  // Only update scroll progress if it's higher than existing (don't go backwards)
  const newScrollProgress = scrollProgress !== undefined
    ? Math.max(scrollProgress, existing?.scrollProgress ?? 0)
    : existing?.scrollProgress ?? 0;

  // Mark as completed if scroll progress hits 90%+
  const shouldMarkComplete = newScrollProgress >= 90 || completed === true;

  const progress = await prisma.articleProgress.upsert({
    where: {
      userId_slug: {
        userId: session.user.id,
        slug,
      },
    },
    update: {
      completed: shouldMarkComplete ? true : existing?.completed ?? false,
      completedAt: shouldMarkComplete && !existing?.completedAt ? new Date() : existing?.completedAt,
      scrollProgress: newScrollProgress,
      lastReadAt: new Date(),
    },
    create: {
      userId: session.user.id,
      slug,
      completed: shouldMarkComplete,
      completedAt: shouldMarkComplete ? new Date() : null,
      scrollProgress: newScrollProgress,
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({
    slug: progress.slug,
    completed: progress.completed,
    completedAt: progress.completedAt,
    scrollProgress: progress.scrollProgress,
    lastReadAt: progress.lastReadAt,
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

  const { slug } = await request.json();
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  await prisma.articleProgress.deleteMany({
    where: {
      userId: session.user.id,
      slug,
    },
  });

  return NextResponse.json({ success: true });
}
