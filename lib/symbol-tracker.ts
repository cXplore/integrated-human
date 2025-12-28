/**
 * Symbol Tracker
 *
 * Tracks recurring symbols from dreams and journals,
 * building a personalized symbol dictionary over time.
 */

import { prisma } from './prisma';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

// Common archetypal symbols and their general meanings (as starting points)
const ARCHETYPAL_SYMBOLS: Record<string, string> = {
  water: 'emotions, the unconscious, purification, life force',
  fire: 'transformation, passion, destruction, energy',
  flying: 'freedom, transcendence, escape, aspiration',
  falling: 'loss of control, anxiety, letting go, failure fear',
  teeth: 'anxiety about appearance, powerlessness, communication issues',
  house: 'self, psyche, different aspects of personality',
  snake: 'transformation, healing, hidden fears, kundalini energy',
  death: 'endings, transformation, fear of change, new beginnings',
  baby: 'new beginnings, vulnerability, potential, inner child',
  chase: 'avoidance, anxiety, something demanding attention',
  car: 'life direction, control, journey, ambition',
  mirror: 'self-reflection, identity, truth, self-perception',
  bridge: 'transition, connection, decision point, crossing over',
  ocean: 'collective unconscious, vastness of emotions, mother archetype',
  forest: 'unconscious mind, getting lost, natural growth, mystery',
  mountain: 'obstacles, achievement, spiritual journey, aspiration',
  door: 'opportunity, transition, new phase, choice',
  key: 'solution, access, hidden knowledge, unlocking potential',
  bird: 'freedom, spirituality, perspective, messages',
  wolf: 'instinct, wildness, threat, loyalty, shadow self',
  shadow: 'repressed aspects, unknown self, integration needed',
  child: 'innocence, inner child, vulnerability, potential',
  stranger: 'unknown aspects of self, shadow, guidance',
};

/**
 * Extract symbols from dream content using AI
 */
export async function extractDreamSymbols(
  dreamContent: string
): Promise<string[]> {
  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages: [
          {
            role: 'system',
            content: `Extract key symbols from this dream. A symbol is a significant object, person, animal, place, or action that appears in the dream. Focus on elements that seem emotionally charged or repeated.

Return ONLY a JSON array of strings (lowercase), no explanation. Example: ["water", "flying", "old house", "grandmother"]

If you cannot identify clear symbols, return: []`,
          },
          {
            role: 'user',
            content: dreamContent,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Strip think tags
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Extract JSON array
    const match = content.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const symbols = JSON.parse(match[0]) as string[];
    return symbols
      .map(s => s.toLowerCase().trim())
      .filter(s => s.length > 0 && s.length < 50)
      .slice(0, 10);
  } catch (error) {
    console.error('Error extracting dream symbols:', error);
    return [];
  }
}

/**
 * Generate a personal meaning for a symbol based on context
 */
export async function generateSymbolMeaning(
  userId: string,
  symbol: string,
  dreamContext: string
): Promise<string> {
  // Check if user already has a meaning for this symbol
  const existing = await prisma.dreamSymbol.findUnique({
    where: { userId_symbol: { userId, symbol: symbol.toLowerCase() } },
  });

  if (existing) {
    return existing.personalMeaning;
  }

  // Get archetypal meaning as base
  const archetypeMeaning = ARCHETYPAL_SYMBOLS[symbol.toLowerCase()];

  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages: [
          {
            role: 'system',
            content: `Generate a brief, personal interpretation of what this dream symbol might mean for the dreamer, based on the context. Keep it open-ended and exploratory (1-2 sentences).

${archetypeMeaning ? `General archetypal meaning: ${archetypeMeaning}` : ''}

Focus on what this symbol might represent for THIS person based on the dream context. Be curious, not definitive.`,
          },
          {
            role: 'user',
            content: `Symbol: "${symbol}"\n\nDream context: ${dreamContext}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return archetypeMeaning || 'A symbol worth exploring further.';
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Strip think tags
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    return content || archetypeMeaning || 'A symbol worth exploring further.';
  } catch (error) {
    console.error('Error generating symbol meaning:', error);
    return archetypeMeaning || 'A symbol worth exploring further.';
  }
}

/**
 * Track symbols from a dream entry
 */
export async function trackDreamSymbols(
  userId: string,
  dreamId: string,
  symbols: string[],
  dreamContent: string
): Promise<void> {
  for (const symbol of symbols) {
    const normalizedSymbol = symbol.toLowerCase().trim();

    try {
      // Check if symbol already exists for user
      const existing = await prisma.dreamSymbol.findUnique({
        where: { userId_symbol: { userId, symbol: normalizedSymbol } },
      });

      if (existing) {
        // Update existing symbol
        await prisma.dreamSymbol.update({
          where: { id: existing.id },
          data: {
            occurrenceCount: { increment: 1 },
            lastSeenAt: new Date(),
            // Append context if it's new info
            context: existing.context
              ? existing.context.length < 500
                ? existing.context + '\n---\n' + dreamContent.slice(0, 200)
                : existing.context
              : dreamContent.slice(0, 300),
          },
        });
      } else {
        // Create new symbol entry
        const meaning = await generateSymbolMeaning(userId, normalizedSymbol, dreamContent);

        await prisma.dreamSymbol.create({
          data: {
            userId,
            symbol: normalizedSymbol,
            personalMeaning: meaning,
            context: dreamContent.slice(0, 300),
          },
        });
      }
    } catch (error) {
      console.error(`Error tracking symbol ${normalizedSymbol}:`, error);
    }
  }
}

/**
 * Get user's symbol context for AI prompts
 */
export async function getSymbolContext(
  userId: string
): Promise<string> {
  const symbols = await prisma.dreamSymbol.findMany({
    where: { userId },
    orderBy: [{ occurrenceCount: 'desc' }],
    take: 10,
    select: {
      symbol: true,
      personalMeaning: true,
      occurrenceCount: true,
    },
  });

  if (symbols.length === 0) return '';

  const lines = symbols.map(s =>
    `- "${s.symbol}" (appeared ${s.occurrenceCount}x): ${s.personalMeaning}`
  );

  return `\n## Personal Symbol Dictionary\nRecurring symbols in this user's dreams:\n${lines.join('\n')}`;
}

/**
 * Analyze symbol patterns across time
 */
export async function analyzeSymbolPatterns(
  userId: string
): Promise<{
  emerging: string[];
  fading: string[];
  consistent: string[];
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get all symbols
  const symbols = await prisma.dreamSymbol.findMany({
    where: { userId },
    select: {
      symbol: true,
      occurrenceCount: true,
      lastSeenAt: true,
      createdAt: true,
    },
  });

  const emerging: string[] = [];
  const fading: string[] = [];
  const consistent: string[] = [];

  for (const symbol of symbols) {
    const isRecent = symbol.lastSeenAt >= thirtyDaysAgo;
    const isNew = symbol.createdAt >= thirtyDaysAgo;
    const isOld = symbol.createdAt <= sixtyDaysAgo;
    const isRecurring = symbol.occurrenceCount >= 3;

    if (isNew && isRecurring) {
      emerging.push(symbol.symbol);
    } else if (isOld && !isRecent && isRecurring) {
      fading.push(symbol.symbol);
    } else if (isRecurring && isRecent) {
      consistent.push(symbol.symbol);
    }
  }

  return {
    emerging: emerging.slice(0, 5),
    fading: fading.slice(0, 5),
    consistent: consistent.slice(0, 5),
  };
}
