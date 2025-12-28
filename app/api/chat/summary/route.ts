import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// LM Studio endpoint
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

/**
 * POST /api/chat/summary
 * Generate an AI summary of a conversation
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Fetch conversation with messages
    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { content: true, role: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Need at least 4 messages for meaningful summary
    if (conversation.messages.length < 4) {
      return NextResponse.json({
        error: 'Conversation needs more messages for a summary',
        minMessages: 4,
      }, { status: 400 });
    }

    // Build conversation text for analysis
    const conversationText = conversation.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    // Generate summary using LM Studio
    const summaryPrompt = `Analyze this personal growth conversation and provide insights. Be concise and compassionate.

CONVERSATION:
${conversationText}

Please provide:
1. **Main Theme**: What was the core topic or issue discussed? (1-2 sentences)
2. **Key Insights**: What realizations or understandings emerged? (2-3 bullet points)
3. **Patterns Noticed**: Any recurring themes, beliefs, or behaviors worth noting? (1-2 bullet points, or "None apparent" if not clear)
4. **Growth Opportunities**: Potential areas for continued exploration or practice (1-2 suggestions)
5. **Affirmation**: A brief, personalized affirmation based on what was shared

Keep the total response under 300 words. Use warm, supportive language.`;

    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate and insightful guide helping someone reflect on their personal growth conversation. Provide thoughtful analysis while being warm and supportive.',
          },
          {
            role: 'user',
            content: summaryPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('LM Studio error:', await response.text());
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    const data = await response.json();
    const summaryContent = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      summary: summaryContent,
      messageCount: conversation.messages.length,
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
