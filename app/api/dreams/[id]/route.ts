import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import { validateCSRF, csrfErrorResponse } from '@/lib/csrf';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dreams/[id]
 * Get a specific dream entry
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const dream = await prisma.dreamEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!dream) {
      return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
    }

    return NextResponse.json({
      dream: {
        ...dream,
        symbols: safeJsonParse(dream.symbols, []),
        emotions: safeJsonParse(dream.emotions, []),
      },
    });
  } catch (error) {
    console.error('Error fetching dream:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dream' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dreams/[id]
 * Update a dream entry
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // CSRF validation
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.dreamEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title?.trim() || null;
    if (body.content !== undefined) updateData.content = body.content.trim();
    if (body.dreamDate !== undefined) updateData.dreamDate = new Date(body.dreamDate);
    if (body.emotions !== undefined) updateData.emotions = body.emotions ? JSON.stringify(body.emotions) : null;
    if (body.symbols !== undefined) updateData.symbols = JSON.stringify(body.symbols);
    if (body.lucid !== undefined) updateData.lucid = body.lucid;
    if (body.recurring !== undefined) updateData.recurring = body.recurring;
    if (body.interpretation !== undefined) updateData.interpretation = body.interpretation;

    const dream = await prisma.dreamEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      dream: {
        ...dream,
        symbols: safeJsonParse(dream.symbols, []),
        emotions: safeJsonParse(dream.emotions, []),
      },
    });
  } catch (error) {
    console.error('Error updating dream:', error);
    return NextResponse.json(
      { error: 'Failed to update dream' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dreams/[id]
 * Delete a dream entry
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // CSRF validation
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.dreamEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
    }

    await prisma.dreamEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dream:', error);
    return NextResponse.json(
      { error: 'Failed to delete dream' },
      { status: 500 }
    );
  }
}
