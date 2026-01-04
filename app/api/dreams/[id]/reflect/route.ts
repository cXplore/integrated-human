import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import {
  classifyDream,
  generateActiveImaginationPrompts,
  getEnhancedSymbol,
  type ActiveImaginationPrompt,
  type EnhancedSymbol,
} from '@/lib/dream-analysis';

interface ReflectionResponse {
  dreamId: string;
  classification: {
    primaryType: string;
    intensity: string;
    flags: {
      traumaIndicators: boolean;
      spiritualContent: boolean;
      somaticContent: boolean;
    };
  };
  activeImagination: ActiveImaginationPrompt[];
  symbolExploration: Array<{
    symbol: string;
    enhanced: EnhancedSymbol | null;
    personal: { meaning: string; count: number } | null;
  }>;
  integrationSuggestions: string[];
}

/**
 * GET /api/dreams/[id]/reflect
 * Get reflection prompts and active imagination exercises for a dream
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the dream
    const dream = await prisma.dreamEntry.findUnique({
      where: { id },
    });

    if (!dream) {
      return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
    }

    if (dream.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const symbols = safeJsonParse<string[]>(dream.symbols, []);
    const emotions = safeJsonParse<string[]>(dream.emotions, []);

    // Classify the dream
    const classification = classifyDream(
      dream.content,
      emotions,
      dream.recurring,
      dream.lucid
    );

    // Generate active imagination prompts
    const activeImagination = generateActiveImaginationPrompts(
      dream.content,
      classification
    );

    // Get symbol exploration data
    const personalSymbols = await prisma.dreamSymbol.findMany({
      where: {
        userId: session.user.id,
        symbol: { in: symbols.map(s => s.toLowerCase()) },
      },
    });

    const symbolExploration = symbols.map(symbol => {
      const personal = personalSymbols.find(
        ps => ps.symbol === symbol.toLowerCase()
      );
      return {
        symbol,
        enhanced: getEnhancedSymbol(symbol),
        personal: personal
          ? { meaning: personal.personalMeaning, count: personal.occurrenceCount }
          : null,
      };
    });

    // Generate integration suggestions based on dream type
    const integrationSuggestions = getIntegrationSuggestions(
      classification.primaryType,
      classification.flags
    );

    const response: ReflectionResponse = {
      dreamId: dream.id,
      classification: {
        primaryType: classification.primaryType,
        intensity: classification.intensityLevel,
        flags: {
          traumaIndicators: classification.flags.traumaIndicators,
          spiritualContent: classification.flags.spiritualContent,
          somaticContent: classification.flags.somaticContent,
        },
      },
      activeImagination,
      symbolExploration,
      integrationSuggestions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating reflection prompts:', error);
    return NextResponse.json(
      { error: 'Failed to generate reflection prompts' },
      { status: 500 }
    );
  }
}

function getIntegrationSuggestions(
  dreamType: string,
  flags: { traumaIndicators: boolean; spiritualContent: boolean; somaticContent: boolean }
): string[] {
  const suggestions: string[] = [];

  if (flags.traumaIndicators) {
    suggestions.push(
      'Consider journaling about how you feel NOW, rather than analyzing the dream',
      'A grounding practice like 5-4-3-2-1 can help if feelings linger',
      'If this dream recurs, speaking with a trauma-informed therapist may help'
    );
    return suggestions;
  }

  switch (dreamType) {
    case 'numinous':
      suggestions.push(
        'Consider creating art, movement, or writing to honor this experience',
        'Sit with the images and feelings without rushing to interpret',
        'Notice how this dream affects you in the days ahead'
      );
      break;

    case 'recurring':
      suggestions.push(
        'Track how this dream evolves over time',
        'Consider what remains unresolved that keeps calling for attention',
        'Try Image Rehearsal: imagine a different ending while awake'
      );
      break;

    case 'visitation':
      suggestions.push(
        'Honor this connection in whatever way feels right to you',
        'Consider what this person might want you to know',
        'Allow yourself to feel whatever emotions arise'
      );
      break;

    case 'anxiety':
      suggestions.push(
        'Notice where you feel anxiety in your body',
        'Consider what real-life situation might be generating this energy',
        'The dream may be processing stress—self-care is important'
      );
      break;

    case 'lucid':
      suggestions.push(
        'Keep a lucid dream journal to track patterns',
        'In future lucid dreams, try asking dream figures questions',
        'Notice what you chose to do with your lucidity'
      );
      break;

    case 'somatic':
    case flags.somaticContent && 'somatic':
      suggestions.push(
        'Pay attention to the body area featured in the dream',
        'Consider what your body might be communicating',
        'Body-based practices like yoga or massage may help integrate'
      );
      break;

    default:
      suggestions.push(
        'Revisit this dream in a few days—new insights often emerge',
        'Notice if dream themes appear in waking life',
        'Share this dream with someone you trust for fresh perspective'
      );
  }

  return suggestions.slice(0, 3);
}
