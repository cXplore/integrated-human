import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAllPractices } from '@/lib/practices';

// Keywords that indicate practice relevance
const PRACTICE_KEYWORDS: Record<string, string[]> = {
  // Breathwork practices
  'box-breathing': ['anxiety', 'anxious', 'overwhelm', 'stressed', 'racing thoughts', 'calm', 'nervous', 'panic'],
  'physiological-sigh': ['stress', 'tension', 'quick relief', 'anxious', 'activated'],
  'cold-water-activation': ['stuck', 'numb', 'dissociated', 'freeze', 'disconnected', 'dorsal'],

  // Somatic practices
  'grounding-5-4-3-2-1': ['dissociated', 'ungrounded', 'floaty', 'disconnected', 'present', 'grounding'],
  'shaking-release': ['tension', 'trauma', 'holding', 'body', 'release', 'stuck energy'],
  'body-scan': ['awareness', 'tension', 'body', 'sensation', 'notice', 'disconnected'],
  'orienting': ['anxious', 'hypervigilant', 'unsafe', 'nervous', 'environment'],

  // Emotional practices
  'anger-release': ['anger', 'angry', 'rage', 'frustrated', 'resentment', 'fury'],
  'self-compassion-break': ['self-critical', 'harsh', 'shame', 'guilt', 'compassion', 'kind to myself'],
  'loving-kindness': ['lonely', 'disconnected', 'love', 'warmth', 'compassion', 'kindness'],

  // Shadow/depth practices
  'shadow-dialogue': ['shadow', 'dark', 'part of me', 'hidden', 'unconscious', 'denied'],

  // Relational practices
  'repair-conversation': ['relationship', 'conflict', 'repair', 'apologize', 'hurt someone', 'reconnect'],

  // Daily practices
  'morning-intention': ['intention', 'morning', 'routine', 'day', 'purpose', 'direction'],
};

interface SuggestedPractice {
  slug: string;
  title: string;
  description: string;
  duration: string;
  relevance: string;
}

/**
 * POST /api/chat/suggest-practices
 * Analyze conversation and suggest relevant practices
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

    // Fetch conversation messages
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

    // Combine all user messages for analysis
    const userText = conversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Score each practice based on keyword matches
    const practiceScores: Array<{ slug: string; score: number; matchedKeywords: string[] }> = [];

    for (const [slug, keywords] of Object.entries(PRACTICE_KEYWORDS)) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (userText.includes(keyword.toLowerCase())) {
          score++;
          matchedKeywords.push(keyword);
        }
      }

      if (score > 0) {
        practiceScores.push({ slug, score, matchedKeywords });
      }
    }

    // Sort by score and take top 2
    const topPractices = practiceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (topPractices.length === 0) {
      return NextResponse.json({ suggestedPractices: [] });
    }

    // Get full practice data
    const allPractices = getAllPractices();
    const suggestedPractices: SuggestedPractice[] = [];

    for (const { slug, matchedKeywords } of topPractices) {
      const practice = allPractices.find(p => p.slug === slug);
      if (practice) {
        // Generate a relevance message based on matched keywords
        const relevance = generateRelevanceMessage(matchedKeywords);

        suggestedPractices.push({
          slug: practice.slug,
          title: practice.metadata.title,
          description: practice.metadata.description,
          duration: `${practice.metadata.durationMinutes} min`,
          relevance,
        });
      }
    }

    return NextResponse.json({ suggestedPractices });
  } catch (error) {
    console.error('Error suggesting practices:', error);
    return NextResponse.json({ error: 'Failed to suggest practices' }, { status: 500 });
  }
}

function generateRelevanceMessage(keywords: string[]): string {
  if (keywords.length === 0) return 'May help with what you described';

  // Map keywords to more human-readable reasons
  const keywordMappings: Record<string, string> = {
    anxiety: 'anxiety',
    anxious: 'anxiety',
    overwhelm: 'overwhelm',
    stressed: 'stress',
    tension: 'tension',
    anger: 'anger',
    angry: 'anger',
    rage: 'anger',
    shadow: 'shadow work',
    dissociated: 'grounding',
    disconnected: 'reconnecting',
    stuck: 'getting unstuck',
    relationship: 'relationships',
    conflict: 'relationship repair',
    shame: 'shame',
    'self-critical': 'self-compassion',
  };

  const reasons = keywords
    .slice(0, 2)
    .map(k => keywordMappings[k] || k)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  if (reasons.length === 0) return 'May help with what you described';
  if (reasons.length === 1) return `May help with ${reasons[0]}`;
  return `May help with ${reasons.join(' and ')}`;
}
