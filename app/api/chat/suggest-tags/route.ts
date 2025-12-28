import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Common topic tags for personal growth conversations
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'shadow-work': ['shadow', 'dark side', 'unconscious', 'projection', 'denied', 'repressed'],
  'relationships': ['relationship', 'partner', 'marriage', 'family', 'friend', 'connection', 'attachment'],
  'anxiety': ['anxious', 'anxiety', 'worry', 'nervous', 'panic', 'fear', 'stress'],
  'depression': ['depressed', 'depression', 'hopeless', 'empty', 'numb', 'sad', 'low'],
  'dreams': ['dream', 'nightmare', 'dreaming', 'symbol', 'unconscious'],
  'self-worth': ['worthy', 'enough', 'confidence', 'self-esteem', 'value', 'deserving'],
  'boundaries': ['boundary', 'boundaries', 'saying no', 'limits', 'people-pleasing'],
  'trauma': ['trauma', 'ptsd', 'triggered', 'flashback', 'abuse', 'neglect'],
  'inner-child': ['inner child', 'childhood', 'younger self', 'wounded', 'parent'],
  'purpose': ['purpose', 'meaning', 'direction', 'calling', 'what am i', 'career'],
  'spirituality': ['spiritual', 'soul', 'meditation', 'awakening', 'transcend', 'divine'],
  'grief': ['grief', 'loss', 'mourning', 'death', 'letting go', 'goodbye'],
  'anger': ['anger', 'angry', 'rage', 'frustrated', 'resentment'],
  'creativity': ['creative', 'creativity', 'art', 'expression', 'create', 'block'],
  'body': ['body', 'somatic', 'embodiment', 'physical', 'sensation', 'breath'],
  'mindfulness': ['mindful', 'present', 'awareness', 'meditation', 'grounding'],
  'growth': ['growth', 'change', 'transform', 'evolve', 'becoming', 'journey'],
  'stuck': ['stuck', 'blocked', 'stagnant', 'can\'t move', 'paralyzed'],
};

/**
 * POST /api/chat/suggest-tags
 * Analyze conversation content and suggest relevant tags
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

    // Need at least 4 messages for meaningful tag suggestions
    if (conversation.messages.length < 4) {
      return NextResponse.json({ suggestedTags: [] });
    }

    // Combine all message content for analysis
    const fullText = conversation.messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Score each topic based on keyword matches
    const topicScores: Array<{ tag: string; score: number }> = [];

    for (const [tag, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        // Count occurrences
        const regex = new RegExp(keyword, 'gi');
        const matches = fullText.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      if (score > 0) {
        topicScores.push({ tag, score });
      }
    }

    // Sort by score and take top 3
    const suggestedTags = topicScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(t => t.score >= 2) // Only suggest if keyword appears 2+ times
      .map(t => t.tag);

    return NextResponse.json({ suggestedTags });
  } catch (error) {
    console.error('Error suggesting tags:', error);
    return NextResponse.json({ error: 'Failed to suggest tags' }, { status: 500 });
  }
}
