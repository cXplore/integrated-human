import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/chat/save-to-journal
 * Save conversation insights as a journal entry
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { conversationId, summary, conversationTitle } = await request.json();

    if (!summary) {
      return NextResponse.json({ error: 'Summary content required' }, { status: 400 });
    }

    // Get conversation tags if available
    let conversationTags: string[] = [];
    if (conversationId) {
      const conversation = await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
        select: { tags: true },
      });
      if (conversation?.tags) {
        try {
          conversationTags = JSON.parse(conversation.tags);
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Create the journal entry
    const title = conversationTitle
      ? `Insights: ${conversationTitle}`
      : `Conversation Insights - ${new Date().toLocaleDateString()}`;

    const content = `## Conversation Insights

${summary}

---
*Saved from AI companion conversation*`;

    // Add 'chat-insights' tag along with any conversation tags
    const allTags = ['chat-insights', ...conversationTags];

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title,
        content,
        tags: JSON.stringify(allTags),
      },
    });

    return NextResponse.json({
      success: true,
      entryId: entry.id,
    });
  } catch (error) {
    console.error('Error saving to journal:', error);
    return NextResponse.json({ error: 'Failed to save to journal' }, { status: 500 });
  }
}
