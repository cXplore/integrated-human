import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Mood keywords with emotional valence
const MOOD_INDICATORS: Record<string, { keywords: string[]; valence: 'positive' | 'negative' | 'neutral' }> = {
  anxious: {
    keywords: ['anxious', 'anxiety', 'worried', 'nervous', 'panic', 'scared', 'fear', 'overwhelmed', 'stressed'],
    valence: 'negative',
  },
  sad: {
    keywords: ['sad', 'depressed', 'down', 'hopeless', 'empty', 'lonely', 'grief', 'loss', 'crying', 'tears'],
    valence: 'negative',
  },
  angry: {
    keywords: ['angry', 'frustrated', 'rage', 'furious', 'annoyed', 'resentment', 'irritated', 'mad'],
    valence: 'negative',
  },
  confused: {
    keywords: ['confused', 'lost', 'uncertain', 'stuck', 'don\'t know', 'unclear', 'mixed up'],
    valence: 'neutral',
  },
  hopeful: {
    keywords: ['hopeful', 'optimistic', 'better', 'improving', 'progress', 'excited', 'looking forward'],
    valence: 'positive',
  },
  calm: {
    keywords: ['calm', 'peaceful', 'relaxed', 'centered', 'grounded', 'at ease', 'serene'],
    valence: 'positive',
  },
  grateful: {
    keywords: ['grateful', 'thankful', 'appreciate', 'blessed', 'fortunate'],
    valence: 'positive',
  },
  tired: {
    keywords: ['tired', 'exhausted', 'drained', 'burnt out', 'fatigue', 'weary', 'worn out'],
    valence: 'negative',
  },
  numb: {
    keywords: ['numb', 'disconnected', 'dissociated', 'nothing', 'empty', 'detached', 'shut down'],
    valence: 'negative',
  },
  curious: {
    keywords: ['curious', 'wondering', 'interested', 'exploring', 'learning', 'understanding'],
    valence: 'positive',
  },
};

// Intensity modifiers
const INTENSITY_HIGH = ['very', 'really', 'extremely', 'so', 'incredibly', 'deeply', 'completely'];
const INTENSITY_LOW = ['a little', 'somewhat', 'kind of', 'slightly', 'a bit'];

interface MoodResult {
  primaryMood: string;
  intensity: 'low' | 'moderate' | 'high';
  valence: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

/**
 * POST /api/chat/detect-mood
 * Analyze recent messages to detect user's current mood
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

    // Fetch recent user messages (last 5)
    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        messages: {
          where: { role: 'user' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { content: true },
        },
      },
    });

    if (!conversation || conversation.messages.length === 0) {
      return NextResponse.json({ mood: null });
    }

    // Combine recent user messages
    const recentText = conversation.messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Score each mood
    const moodScores: Array<{ mood: string; score: number; valence: 'positive' | 'negative' | 'neutral' }> = [];

    for (const [mood, data] of Object.entries(MOOD_INDICATORS)) {
      let score = 0;

      for (const keyword of data.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = recentText.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      if (score > 0) {
        moodScores.push({ mood, score, valence: data.valence });
      }
    }

    if (moodScores.length === 0) {
      return NextResponse.json({ mood: null });
    }

    // Get primary mood (highest score)
    moodScores.sort((a, b) => b.score - a.score);
    const primary = moodScores[0];

    // Determine intensity
    let intensity: 'low' | 'moderate' | 'high' = 'moderate';

    for (const word of INTENSITY_HIGH) {
      if (recentText.includes(word)) {
        intensity = 'high';
        break;
      }
    }

    if (intensity !== 'high') {
      for (const word of INTENSITY_LOW) {
        if (recentText.includes(word)) {
          intensity = 'low';
          break;
        }
      }
    }

    // Calculate confidence based on score relative to text length
    const confidence = Math.min(0.95, primary.score / 5);

    const result: MoodResult = {
      primaryMood: primary.mood,
      intensity,
      valence: primary.valence,
      confidence,
    };

    return NextResponse.json({ mood: result });
  } catch (error) {
    console.error('Error detecting mood:', error);
    return NextResponse.json({ error: 'Failed to detect mood' }, { status: 500 });
  }
}
