import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateCSRF, csrfErrorResponse } from "@/lib/csrf";

// GET - Fetch user's reading list
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Bounds checking for pagination
  const rawLimit = parseInt(searchParams.get('limit') || '100');
  const rawOffset = parseInt(searchParams.get('offset') || '0');
  const limit = Math.max(1, Math.min(200, isNaN(rawLimit) ? 100 : rawLimit));
  const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

  const [items, total] = await Promise.all([
    prisma.readingListItem.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.readingListItem.count({
      where: { userId: session.user.id },
    }),
  ]);

  return NextResponse.json({
    items: items.map((item: { slug: string }) => item.slug),
    total,
    hasMore: offset + items.length < total,
  });
}

// POST - Add item to reading list
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

  const { slug, title } = await request.json();

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const item = await prisma.readingListItem.upsert({
    where: {
      userId_slug: {
        userId: session.user.id,
        slug,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      slug,
      title,
    },
  });

  return NextResponse.json(item);
}

// DELETE - Remove item from reading list
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

  await prisma.readingListItem.deleteMany({
    where: {
      userId: session.user.id,
      slug,
    },
  });

  return NextResponse.json({ success: true });
}
