import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Preference indicators to look for in user messages
const PREFERENCE_INDICATORS: Record<string, { keywords: string[]; preference: string; category: string }[]> = {
  // Response style preferences
  'response-style': [
    {
      keywords: ['get to the point', 'be direct', 'just tell me', 'stop being so', 'less words', 'too long'],
      preference: 'prefers concise responses',
      category: 'response-style',
    },
    {
      keywords: ['tell me more', 'expand on', 'go deeper', 'elaborate', 'explain more', 'what do you mean'],
      preference: 'appreciates detailed explanations',
      category: 'response-style',
    },
    {
      keywords: ['give me steps', 'practical', 'actionable', 'what should i do', 'how do i'],
      preference: 'values practical guidance',
      category: 'response-style',
    },
    {
      keywords: ['just listen', 'i need to vent', 'not looking for advice', "don't fix", 'just hear me'],
      preference: 'sometimes needs listening without solutions',
      category: 'response-style',
    },
  ],
  // Tone preferences
  'tone': [
    {
      keywords: ['too gentle', 'be honest', 'tell me straight', 'direct feedback', "don't sugarcoat"],
      preference: 'appreciates direct honesty',
      category: 'tone',
    },
    {
      keywords: ['that felt harsh', 'be gentler', 'softer', 'that hurt', 'too blunt'],
      preference: 'responds better to gentle approach',
      category: 'tone',
    },
    {
      keywords: ['love the metaphor', 'that image helps', 'like that analogy', 'visualize'],
      preference: 'resonates with metaphors and imagery',
      category: 'tone',
    },
    {
      keywords: ['humor helps', 'made me laugh', 'light touch', 'playful'],
      preference: 'appreciates lightness and humor',
      category: 'tone',
    },
  ],
  // Depth preferences
  'depth': [
    {
      keywords: ['too deep', 'overwhelming', 'too much', 'simpler', 'basic'],
      preference: 'prefers gradual depth',
      category: 'depth',
    },
    {
      keywords: ['go deeper', 'dig in', 'root cause', 'underlying', 'beneath the surface', 'real issue'],
      preference: 'ready for deep exploration',
      category: 'depth',
    },
    {
      keywords: ['stay with this', 'not ready to move on', "let's stay here", 'more time with this'],
      preference: 'needs time to process before moving on',
      category: 'depth',
    },
  ],
  // Approach preferences
  'approach': [
    {
      keywords: ['somatic', 'body', 'feel it in my', 'physically', 'sensation', 'breath'],
      preference: 'body-aware and somatic oriented',
      category: 'approach',
    },
    {
      keywords: ['logically', 'makes sense', 'rational', 'understand why', 'analyze'],
      preference: 'values cognitive understanding',
      category: 'approach',
    },
    {
      keywords: ['spiritual', 'soul', 'meaning', 'purpose', 'universe', 'connected to something'],
      preference: 'spiritually oriented',
      category: 'approach',
    },
    {
      keywords: ['my therapist', 'in therapy', 'psychologist', 'counselor'],
      preference: 'has therapy background',
      category: 'approach',
    },
  ],
  // Pacing preferences
  'pacing': [
    {
      keywords: ['slow down', 'too fast', 'one thing at a time', 'overwhelmed', 'pace'],
      preference: 'needs slower pacing',
      category: 'pacing',
    },
    {
      keywords: ['keep going', 'more', "what's next", 'ready for more', "let's keep moving"],
      preference: 'comfortable with faster pacing',
      category: 'pacing',
    },
  ],
  // Feedback preferences
  'feedback-style': [
    {
      keywords: ['challenge me', 'push me', 'hold me accountable', "don't let me off"],
      preference: 'wants to be challenged',
      category: 'feedback-style',
    },
    {
      keywords: ['validate', 'am i on track', 'doing okay', 'tell me if', 'feedback'],
      preference: 'values validation and feedback',
      category: 'feedback-style',
    },
    {
      keywords: ['question', 'curious', 'wonder', 'what if', 'explore'],
      preference: 'likes exploratory questions',
      category: 'feedback-style',
    },
  ],
};

interface LearnedPreference {
  category: string;
  preference: string;
  matchedKeywords: string[];
  isNew: boolean;
}

/**
 * POST /api/chat/learn-preferences
 * Analyze messages to learn user preferences
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    const learned: LearnedPreference[] = [];

    // Get existing preferences
    const existingPreferences = await prisma.chatPreference.findMany({
      where: { userId: session.user.id },
    });
    const existingSet = new Set(existingPreferences.map(p => `${p.category}:${p.preference}`));

    // Check for preference indicators
    for (const indicators of Object.values(PREFERENCE_INDICATORS)) {
      for (const indicator of indicators) {
        const matchedKeywords = indicator.keywords.filter(kw =>
          lowerMessage.includes(kw.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
          const key = `${indicator.category}:${indicator.preference}`;
          const isNew = !existingSet.has(key);

          learned.push({
            category: indicator.category,
            preference: indicator.preference,
            matchedKeywords,
            isNew,
          });

          // Save or update the preference
          await prisma.chatPreference.upsert({
            where: {
              userId_category_preference: {
                userId: session.user.id,
                category: indicator.category,
                preference: indicator.preference,
              },
            },
            update: {
              confidence: { increment: 10 },
              context: `Detected from: "${message.slice(0, 100)}..."`,
            },
            create: {
              userId: session.user.id,
              category: indicator.category,
              preference: indicator.preference,
              strength: 3,
              context: `First detected from: "${message.slice(0, 100)}..."`,
              source: 'inferred',
              confidence: 60,
            },
          });
        }
      }
    }

    // Generate AI guidance based on learned preferences
    const allPreferences = await prisma.chatPreference.findMany({
      where: { userId: session.user.id },
      orderBy: [{ confidence: 'desc' }, { strength: 'desc' }],
    });

    const guidance = generatePreferenceGuidance(allPreferences);

    return NextResponse.json({
      learned,
      newPreferences: learned.filter(l => l.isNew),
      guidance,
      totalPreferences: allPreferences.length,
    });
  } catch (error) {
    console.error('Error learning preferences:', error);
    return NextResponse.json({ error: 'Failed to learn preferences' }, { status: 500 });
  }
}

/**
 * GET /api/chat/learn-preferences
 * Get compiled preference guidance for AI
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preferences = await prisma.chatPreference.findMany({
      where: {
        userId: session.user.id,
        confidence: { gte: 40 }, // Only include reasonably confident preferences
      },
      orderBy: [{ confidence: 'desc' }, { strength: 'desc' }],
    });

    const guidance = generatePreferenceGuidance(preferences);

    // Group by category
    const grouped = preferences.reduce((acc, pref) => {
      if (!acc[pref.category]) {
        acc[pref.category] = [];
      }
      acc[pref.category].push({
        preference: pref.preference,
        strength: pref.strength,
        confidence: pref.confidence,
      });
      return acc;
    }, {} as Record<string, Array<{ preference: string; strength: number; confidence: number }>>);

    return NextResponse.json({
      preferences,
      grouped,
      guidance,
      count: preferences.length,
    });
  } catch (error) {
    console.error('Error fetching preference guidance:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

interface Preference {
  category: string;
  preference: string;
  strength: number;
  confidence: number;
}

function generatePreferenceGuidance(preferences: Preference[]): string {
  if (preferences.length === 0) {
    return '';
  }

  const parts: string[] = ['USER PREFERENCES:'];

  // Group by category
  const byCategory: Record<string, string[]> = {};
  for (const pref of preferences) {
    if (pref.confidence >= 40) {
      // Only include reasonably confident preferences
      if (!byCategory[pref.category]) {
        byCategory[pref.category] = [];
      }
      byCategory[pref.category].push(pref.preference);
    }
  }

  // Format by category
  const categoryLabels: Record<string, string> = {
    'response-style': 'Communication style',
    'tone': 'Tone',
    'depth': 'Depth',
    'approach': 'Approach',
    'pacing': 'Pacing',
    'feedback-style': 'Feedback',
    'topics': 'Topics',
  };

  for (const [category, prefs] of Object.entries(byCategory)) {
    const label = categoryLabels[category] || category;
    parts.push(`${label}: ${prefs.join('; ')}.`);
  }

  // High-strength preferences get special mention
  const strong = preferences.filter(p => p.strength >= 4 && p.confidence >= 60);
  if (strong.length > 0) {
    parts.push(`Strong preferences: ${strong.map(p => p.preference).join(', ')}.`);
  }

  return parts.join(' ');
}
