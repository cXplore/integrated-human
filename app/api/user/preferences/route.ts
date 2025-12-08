import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch user preferences
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { newsletterSubscribed: true },
  });

  return NextResponse.json({
    newsletterSubscribed: user?.newsletterSubscribed ?? false,
  });
}

// PATCH - Update user preferences
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newsletterSubscribed } = await request.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { newsletterSubscribed },
    select: { newsletterSubscribed: true },
  });

  return NextResponse.json({
    newsletterSubscribed: user.newsletterSubscribed,
  });
}
