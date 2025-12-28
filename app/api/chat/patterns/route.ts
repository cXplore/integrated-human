import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Topic patterns to track across conversations
const PATTERN_TOPICS: Record<string, { keywords: string[]; label: string }> = {
  'relationship-anxiety': {
    keywords: ['relationship', 'partner', 'anxious', 'worried about', 'fear of', 'abandonment', 'trust', 'insecure'],
    label: 'relationship anxiety',
  },
  'self-worth': {
    keywords: ['not good enough', 'worthless', 'unworthy', 'deserve', 'self-esteem', 'confidence', 'imposter'],
    label: 'self-worth struggles',
  },
  'perfectionism': {
    keywords: ['perfect', 'failure', 'mistake', 'not enough', 'high standards', 'critical', 'disappoint'],
    label: 'perfectionism',
  },
  'anger': {
    keywords: ['angry', 'anger', 'rage', 'frustrated', 'resentment', 'fury', 'irritated'],
    label: 'anger',
  },
  'grief': {
    keywords: ['loss', 'grief', 'died', 'death', 'mourning', 'miss them', 'passed away', 'gone'],
    label: 'grief or loss',
  },
  'boundaries': {
    keywords: ['boundary', 'boundaries', 'say no', 'people pleasing', 'overwhelmed', 'too much', 'taken advantage'],
    label: 'boundary challenges',
  },
  'family-patterns': {
    keywords: ['family', 'mother', 'father', 'parent', 'childhood', 'grew up', 'upbringing', 'siblings'],
    label: 'family patterns',
  },
  'work-stress': {
    keywords: ['work', 'job', 'career', 'boss', 'coworker', 'burnout', 'overwork', 'deadline'],
    label: 'work-related stress',
  },
  'sleep-issues': {
    keywords: ['sleep', 'insomnia', 'nightmares', 'tired', 'exhausted', 'can\'t sleep', 'waking up'],
    label: 'sleep challenges',
  },
  'avoidance': {
    keywords: ['avoid', 'procrastinate', 'putting off', 'escape', 'numb', 'distract', 'running from'],
    label: 'avoidance patterns',
  },
  'control': {
    keywords: ['control', 'controlling', 'let go', 'hold on', 'grip', 'certainty', 'predictable'],
    label: 'control patterns',
  },
  'shame': {
    keywords: ['shame', 'ashamed', 'embarrassed', 'humiliated', 'exposed', 'hide', 'secret'],
    label: 'shame',
  },
};

interface PatternResult {
  pattern: string;
  label: string;
  frequency: number;
  conversationCount: number;
  recentMention: string;
  insight: string;
}

/**
 * GET /api/chat/patterns
 * Analyze patterns across user's recent conversations
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch recent conversations (last 30 days, up to 20 conversations)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId: session.user.id,
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        messages: {
          where: { role: 'user' },
          select: { content: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    if (conversations.length < 2) {
      return NextResponse.json({
        patterns: [],
        message: 'Need at least 2 conversations to detect patterns',
      });
    }

    // Track pattern occurrences across conversations
    const patternOccurrences: Record<string, {
      conversations: Set<string>;
      totalMentions: number;
      lastMention: Date;
      sampleContext: string;
    }> = {};

    for (const conv of conversations) {
      // Combine all user messages in conversation
      const conversationText = conv.messages
        .map(m => m.content)
        .join(' ')
        .toLowerCase();

      for (const [patternId, patternData] of Object.entries(PATTERN_TOPICS)) {
        let mentionCount = 0;
        let matchedContext = '';

        for (const keyword of patternData.keywords) {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = conversationText.match(regex);
          if (matches) {
            mentionCount += matches.length;

            // Extract context around first match if we don't have one yet
            if (!matchedContext) {
              const idx = conversationText.toLowerCase().indexOf(keyword.toLowerCase());
              if (idx !== -1) {
                const start = Math.max(0, idx - 50);
                const end = Math.min(conversationText.length, idx + keyword.length + 50);
                matchedContext = '...' + conversationText.slice(start, end).trim() + '...';
              }
            }
          }
        }

        if (mentionCount > 0) {
          if (!patternOccurrences[patternId]) {
            patternOccurrences[patternId] = {
              conversations: new Set(),
              totalMentions: 0,
              lastMention: new Date(0),
              sampleContext: '',
            };
          }

          patternOccurrences[patternId].conversations.add(conv.id);
          patternOccurrences[patternId].totalMentions += mentionCount;

          const latestMessageDate = conv.messages.length > 0
            ? new Date(Math.max(...conv.messages.map(m => new Date(m.createdAt).getTime())))
            : conv.updatedAt;

          if (latestMessageDate > patternOccurrences[patternId].lastMention) {
            patternOccurrences[patternId].lastMention = latestMessageDate;
            patternOccurrences[patternId].sampleContext = matchedContext;
          }
        }
      }
    }

    // Convert to results, filtering for patterns that appear in 2+ conversations
    const patterns: PatternResult[] = [];

    for (const [patternId, data] of Object.entries(patternOccurrences)) {
      const convCount = data.conversations.size;

      // Only include patterns that appear in at least 2 conversations
      if (convCount >= 2) {
        const patternData = PATTERN_TOPICS[patternId];

        patterns.push({
          pattern: patternId,
          label: patternData.label,
          frequency: data.totalMentions,
          conversationCount: convCount,
          recentMention: getRelativeTime(data.lastMention),
          insight: generateInsight(patternData.label, convCount, conversations.length),
        });
      }
    }

    // Sort by conversation count (most recurring first)
    patterns.sort((a, b) => b.conversationCount - a.conversationCount);

    return NextResponse.json({
      patterns: patterns.slice(0, 5), // Return top 5 patterns
      conversationCount: conversations.length,
      timeframe: '30 days',
    });
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return NextResponse.json({ error: 'Failed to detect patterns' }, { status: 500 });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'last week';
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function generateInsight(label: string, convCount: number, totalConv: number): string {
  const percentage = Math.round((convCount / totalConv) * 100);

  if (percentage >= 70) {
    return `${label} has come up in most of your recent conversations. This might be a core theme worth exploring deeply.`;
  } else if (percentage >= 50) {
    return `You've mentioned ${label} in about half of your recent conversations. There may be something important here.`;
  } else {
    return `${label} has appeared across several conversations. You might notice patterns in when this comes up.`;
  }
}
