import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Get a specific conversation with all messages
export async function GET(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

// PATCH - Update conversation (title, mode, active status, tags, starred)
export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();

  try {
    // If setting this conversation as active, deactivate others first
    if (updates.isActive === true) {
      await prisma.chatConversation.updateMany({
        where: { userId: session.user.id, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    // Serialize tags to JSON string if provided
    const tagsData = updates.tags !== undefined
      ? JSON.stringify(updates.tags)
      : undefined;

    const conversation = await prisma.chatConversation.updateMany({
      where: { id, userId: session.user.id },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.mode !== undefined && { mode: updates.mode }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.starred !== undefined && { starred: updates.starred }),
        ...(tagsData !== undefined && { tags: tagsData }),
      },
    });

    if (conversation.count === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

// DELETE - Delete a conversation
export async function DELETE(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await prisma.chatConversation.deleteMany({
      where: { id, userId: session.user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
