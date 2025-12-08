import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.articleProgress.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(progress.map(p => ({
    slug: p.slug,
    completed: p.completed,
    completedAt: p.completedAt,
  })));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, completed } = await request.json();
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const progress = await prisma.articleProgress.upsert({
    where: {
      userId_slug: {
        userId: session.user.id,
        slug,
      },
    },
    update: {
      completed: completed ?? true,
      completedAt: completed ? new Date() : null,
    },
    create: {
      userId: session.user.id,
      slug,
      completed: completed ?? true,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json({
    slug: progress.slug,
    completed: progress.completed,
    completedAt: progress.completedAt,
  });
}

export async function DELETE(request: NextRequest) {
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
