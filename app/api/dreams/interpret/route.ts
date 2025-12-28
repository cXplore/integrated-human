import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, safeJsonParse } from '@/lib/sanitize';
import { recordBulkActivities } from '@/lib/assessment/activity-tracker';
import type { PillarId } from '@/lib/assessment/types';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const TOKENS_PER_CREDIT = 1000;
const CREDIT_COST = 5; // Credits per interpretation
const TOKEN_COST = CREDIT_COST * TOKENS_PER_CREDIT;

// =============================================================================
// DIMENSION DETECTION FOR DREAM ACTIVITY TRACKING
// =============================================================================

interface DreamDimensionInsight {
  pillarId: PillarId;
  dimensionId: string;
  points: number;
  reason: string;
}

// Dream symbols and themes that map to specific dimensions
const DREAM_DIMENSION_MAPPING: Record<string, { pillarId: PillarId; dimensionId: string; points: number }> = {
  // Soul dimensions - dreams are primarily soul work
  'shadow': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 4 },
  'dark': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 3 },
  'monster': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 3 },
  'demon': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 3 },
  'enemy': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 2 },
  'chase': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 2 },
  'hidden': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 2 },
  'mask': { pillarId: 'soul', dimensionId: 'authenticity', points: 3 },
  'disguise': { pillarId: 'soul', dimensionId: 'authenticity', points: 2 },
  'pretend': { pillarId: 'soul', dimensionId: 'authenticity', points: 2 },
  'fly': { pillarId: 'soul', dimensionId: 'transcendence', points: 3 },
  'flying': { pillarId: 'soul', dimensionId: 'transcendence', points: 3 },
  'spiritual': { pillarId: 'soul', dimensionId: 'transcendence', points: 3 },
  'divine': { pillarId: 'soul', dimensionId: 'transcendence', points: 3 },
  'god': { pillarId: 'soul', dimensionId: 'transcendence', points: 2 },
  'light': { pillarId: 'soul', dimensionId: 'transcendence', points: 2 },
  'death': { pillarId: 'soul', dimensionId: 'existential-grounding', points: 4 },
  'dying': { pillarId: 'soul', dimensionId: 'existential-grounding', points: 4 },
  'dead': { pillarId: 'soul', dimensionId: 'existential-grounding', points: 3 },
  'ending': { pillarId: 'soul', dimensionId: 'existential-grounding', points: 2 },
  'wisdom': { pillarId: 'soul', dimensionId: 'inner-wisdom', points: 3 },
  'guide': { pillarId: 'soul', dimensionId: 'inner-wisdom', points: 3 },
  'elder': { pillarId: 'soul', dimensionId: 'inner-wisdom', points: 3 },
  'teacher': { pillarId: 'soul', dimensionId: 'inner-wisdom', points: 2 },
  'message': { pillarId: 'soul', dimensionId: 'inner-wisdom', points: 2 },
  'creative': { pillarId: 'soul', dimensionId: 'creative-expression', points: 2 },
  'art': { pillarId: 'soul', dimensionId: 'creative-expression', points: 2 },
  'music': { pillarId: 'soul', dimensionId: 'creative-expression', points: 2 },

  // Mind dimensions - dreams can reveal mental patterns
  'pattern': { pillarId: 'mind', dimensionId: 'self-awareness', points: 2 },
  'recurring': { pillarId: 'mind', dimensionId: 'self-awareness', points: 3 },
  'realize': { pillarId: 'mind', dimensionId: 'self-awareness', points: 2 },
  'understand': { pillarId: 'mind', dimensionId: 'self-awareness', points: 2 },
  'anxious': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'fear': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'anxiety': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'panic': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 3 },
  'calm': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'peace': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'nightmare': { pillarId: 'mind', dimensionId: 'psychological-safety', points: 3 },
  'danger': { pillarId: 'mind', dimensionId: 'psychological-safety', points: 2 },
  'safe': { pillarId: 'mind', dimensionId: 'psychological-safety', points: 2 },
  'trapped': { pillarId: 'mind', dimensionId: 'psychological-safety', points: 3 },

  // Body dimensions - somatic dreams
  'body': { pillarId: 'body', dimensionId: 'interoception', points: 2 },
  'physical': { pillarId: 'body', dimensionId: 'interoception', points: 2 },
  'sensation': { pillarId: 'body', dimensionId: 'interoception', points: 2 },
  'pain': { pillarId: 'body', dimensionId: 'interoception', points: 2 },
  'healing': { pillarId: 'body', dimensionId: 'energy-vitality', points: 2 },
  'sick': { pillarId: 'body', dimensionId: 'energy-vitality', points: 2 },
  'exhausted': { pillarId: 'body', dimensionId: 'energy-vitality', points: 2 },

  // Relationship dimensions - relational dreams
  'mother': { pillarId: 'relationships', dimensionId: 'attachment-patterns', points: 3 },
  'father': { pillarId: 'relationships', dimensionId: 'attachment-patterns', points: 3 },
  'parent': { pillarId: 'relationships', dimensionId: 'attachment-patterns', points: 3 },
  'child': { pillarId: 'relationships', dimensionId: 'attachment-patterns', points: 2 },
  'family': { pillarId: 'relationships', dimensionId: 'relational-patterns', points: 2 },
  'ex': { pillarId: 'relationships', dimensionId: 'relational-patterns', points: 2 },
  'partner': { pillarId: 'relationships', dimensionId: 'intimacy-depth', points: 2 },
  'lover': { pillarId: 'relationships', dimensionId: 'intimacy-depth', points: 2 },
  'intimate': { pillarId: 'relationships', dimensionId: 'intimacy-depth', points: 2 },
  'abandon': { pillarId: 'relationships', dimensionId: 'trust-vulnerability', points: 3 },
  'alone': { pillarId: 'relationships', dimensionId: 'social-connection', points: 2 },
  'lonely': { pillarId: 'relationships', dimensionId: 'social-connection', points: 2 },
  'crowd': { pillarId: 'relationships', dimensionId: 'social-connection', points: 2 },
  'conflict': { pillarId: 'relationships', dimensionId: 'conflict-repair', points: 2 },
  'fight': { pillarId: 'relationships', dimensionId: 'conflict-repair', points: 2 },
  'argument': { pillarId: 'relationships', dimensionId: 'conflict-repair', points: 2 },
};

// Emotions that map to dimensions
const DREAM_EMOTION_MAPPING: Record<string, { pillarId: PillarId; dimensionId: string; points: number }> = {
  'fear': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'anxiety': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'terror': { pillarId: 'mind', dimensionId: 'psychological-safety', points: 3 },
  'peace': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'joy': { pillarId: 'soul', dimensionId: 'life-engagement', points: 2 },
  'wonder': { pillarId: 'soul', dimensionId: 'transcendence', points: 2 },
  'awe': { pillarId: 'soul', dimensionId: 'transcendence', points: 3 },
  'grief': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 3 },
  'sadness': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'anger': { pillarId: 'mind', dimensionId: 'emotional-regulation', points: 2 },
  'rage': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 3 },
  'shame': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 3 },
  'guilt': { pillarId: 'soul', dimensionId: 'shadow-integration', points: 2 },
  'love': { pillarId: 'relationships', dimensionId: 'intimacy-depth', points: 2 },
  'longing': { pillarId: 'relationships', dimensionId: 'attachment-patterns', points: 2 },
  'rejection': { pillarId: 'relationships', dimensionId: 'trust-vulnerability', points: 3 },
  'connection': { pillarId: 'relationships', dimensionId: 'social-connection', points: 2 },
};

/**
 * Detect dimensions touched by a dream based on content, symbols, and emotions
 */
function detectDreamDimensions(
  content: string,
  symbols: string[] = [],
  emotions: string[] = [],
  interpretation: string = ''
): DreamDimensionInsight[] {
  const combinedText = `${content} ${interpretation}`.toLowerCase();
  const detected = new Map<string, DreamDimensionInsight>();

  // Check symbols first (explicit user input, higher confidence)
  for (const symbol of symbols) {
    const symbolLower = symbol.toLowerCase();
    for (const [keyword, mapping] of Object.entries(DREAM_DIMENSION_MAPPING)) {
      if (symbolLower.includes(keyword)) {
        const key = `${mapping.pillarId}:${mapping.dimensionId}`;
        if (!detected.has(key)) {
          detected.set(key, {
            ...mapping,
            reason: `Dream symbol: ${symbol}`,
          });
        }
      }
    }
  }

  // Check emotions (explicit user input)
  for (const emotion of emotions) {
    const emotionLower = emotion.toLowerCase();
    const mapping = DREAM_EMOTION_MAPPING[emotionLower];
    if (mapping) {
      const key = `${mapping.pillarId}:${mapping.dimensionId}`;
      if (!detected.has(key)) {
        detected.set(key, {
          ...mapping,
          reason: `Dream emotion: ${emotion}`,
        });
      }
    }
  }

  // Check content and interpretation for keywords
  for (const [keyword, mapping] of Object.entries(DREAM_DIMENSION_MAPPING)) {
    if (combinedText.includes(keyword)) {
      const key = `${mapping.pillarId}:${mapping.dimensionId}`;
      if (!detected.has(key)) {
        detected.set(key, {
          ...mapping,
          points: mapping.points - 1, // Slightly lower points for inferred vs explicit
          reason: `Dream theme: ${keyword}`,
        });
      }
    }
  }

  // Limit to top 3 dimensions (dreams are significant, allow more than journal)
  const sorted = Array.from(detected.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return sorted;
}

/**
 * Record dream insights as activities
 */
async function recordDreamInsights(
  userId: string,
  content: string,
  symbols: string[],
  emotions: string[],
  interpretation: string
): Promise<void> {
  try {
    const insights = detectDreamDimensions(content, symbols, emotions, interpretation);

    if (insights.length > 0) {
      await recordBulkActivities(
        userId,
        insights.map((insight) => ({
          pillarId: insight.pillarId,
          dimensionId: insight.dimensionId,
          points: insight.points,
          reason: insight.reason,
          activityType: 'dream-interpretation',
        }))
      );
    }
  } catch (error) {
    console.error('Failed to record dream insights:', error);
  }
}

/**
 * Update personal symbol dictionary with symbols from this dream
 * Increments occurrence count for existing symbols
 */
async function updateSymbolDictionary(
  userId: string,
  symbols: string[],
  dreamContext: string
): Promise<void> {
  try {
    for (const symbol of symbols) {
      const normalizedSymbol = symbol.toLowerCase().trim();
      if (!normalizedSymbol || normalizedSymbol.length < 2) continue;

      // Check if symbol already exists
      const existing = await prisma.dreamSymbol.findUnique({
        where: {
          userId_symbol: { userId, symbol: normalizedSymbol },
        },
      });

      if (existing) {
        // Update occurrence count and last seen
        await prisma.dreamSymbol.update({
          where: { id: existing.id },
          data: {
            occurrenceCount: { increment: 1 },
            lastSeenAt: new Date(),
          },
        });
      }
      // Note: We don't auto-create symbols - user should explicitly define meanings
      // This just tracks occurrences for symbols they've defined
    }
  } catch (error) {
    console.error('Error updating symbol dictionary:', error);
  }
}

async function checkCredits(userId: string): Promise<{ hasCredits: boolean; balance: number }> {
  const credits = await prisma.aICredits.findUnique({ where: { userId } });
  if (!credits) return { hasCredits: false, balance: 0 };
  return { hasCredits: credits.tokenBalance >= TOKEN_COST, balance: credits.tokenBalance };
}

async function deductTokens(userId: string, totalTokens: number): Promise<void> {
  const credits = await prisma.aICredits.findUnique({ where: { userId } });

  if (!credits) {
    // Create credits record tracking the negative balance
    await prisma.aICredits.create({
      data: {
        userId,
        tokenBalance: 0,
        monthlyTokens: 0,
        monthlyUsed: totalTokens,
        purchasedTokens: 0,
      },
    });
    return;
  }

  // Calculate how much to deduct from monthly vs purchased
  const monthlyRemaining = Math.max(0, credits.monthlyTokens - credits.monthlyUsed);
  const monthlyDeduction = Math.min(totalTokens, monthlyRemaining);
  const remainingDeduction = totalTokens - monthlyDeduction;

  await prisma.aICredits.update({
    where: { userId },
    data: {
      tokenBalance: { decrement: totalTokens },
      monthlyUsed: { increment: monthlyDeduction },
      purchasedTokens: remainingDeduction > 0 ? { decrement: remainingDeduction } : undefined,
    },
  });
}

/**
 * POST /api/dreams/interpret
 * Get AI interpretation of a dream
 * Streams the response for better UX
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { dreamId, content: rawContent, symbols, emotions, recurring, context: rawContext } = body;

    if (!rawContent) {
      return new Response('Dream content is required', { status: 400 });
    }

    // Sanitize user input
    const { sanitized: content, warnings } = sanitizeUserInput(rawContent, { maxLength: 5000 });
    const context = rawContext ? sanitizeUserInput(rawContext, { maxLength: 1000 }).sanitized : undefined;
    if (warnings.length > 0) {
      console.warn('Dream interpretation input sanitization warnings:', warnings);
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimit = checkRateLimit(`ai:${userId}`, RATE_LIMITS.aiHeavy);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Check AI credits
    const { hasCredits, balance } = await checkCredits(userId);

    if (!hasCredits) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient AI credits',
          required: CREDIT_COST,
          available: Math.floor(balance / TOKENS_PER_CREDIT),
        }),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build context for interpretation
    let additionalContext = '';

    // Get user's assessment data for personalized interpretation
    const assessments = await prisma.assessmentResult.findMany({
      where: { userId },
    });

    const assessmentInfo: string[] = [];
    for (const assessment of assessments) {
      const results = safeJsonParse<Record<string, string>>(assessment.results, {});
      if (assessment.type === 'archetype' && results.primary) {
        assessmentInfo.push(`Primary archetype: ${results.primary}`);
      }
      if (assessment.type === 'attachment' && results.style) {
        assessmentInfo.push(`Attachment style: ${results.style}`);
      }
      if (assessment.type === 'nervous-system' && results.state) {
        assessmentInfo.push(`Nervous system tendency: ${results.state}`);
      }
    }

    if (assessmentInfo.length > 0) {
      additionalContext = `\n\nDreamer's psychological profile:\n${assessmentInfo.join('\n')}`;
    }

    // Get recent dreams for pattern recognition
    const recentDreams = await prisma.dreamEntry.findMany({
      where: {
        userId,
        id: dreamId ? { not: dreamId } : undefined,
      },
      orderBy: { dreamDate: 'desc' },
      take: 5,
      select: { content: true, symbols: true, emotions: true },
    });

    if (recentDreams.length > 0) {
      const recentSymbols = new Set<string>();
      const recentEmotions = new Set<string>();

      recentDreams.forEach(d => {
        safeJsonParse<string[]>(d.symbols, []).forEach((s: string) => recentSymbols.add(s));
        safeJsonParse<string[]>(d.emotions, []).forEach((e: string) => recentEmotions.add(e));
      });

      if (recentSymbols.size > 0 || recentEmotions.size > 0) {
        additionalContext += `\n\nRecurring patterns from recent dreams:`;
        if (recentSymbols.size > 0) {
          additionalContext += `\nRecurring symbols: ${[...recentSymbols].slice(0, 10).join(', ')}`;
        }
        if (recentEmotions.size > 0) {
          additionalContext += `\nRecurring emotions: ${[...recentEmotions].slice(0, 5).join(', ')}`;
        }
      }
    }

    // Get user's personal symbol dictionary for personalized interpretation
    const personalSymbols = await prisma.dreamSymbol.findMany({
      where: { userId },
      orderBy: { occurrenceCount: 'desc' },
      take: 20,
    });

    if (personalSymbols.length > 0) {
      additionalContext += `\n\nPersonal Symbol Dictionary (what these symbols mean for THIS dreamer):`;
      for (const sym of personalSymbols) {
        // Check if any current symbols match personal dictionary
        const currentSymbols = symbols || [];
        const isRelevant = currentSymbols.some((s: string) =>
          s.toLowerCase().includes(sym.symbol) || sym.symbol.includes(s.toLowerCase())
        ) || content.toLowerCase().includes(sym.symbol);

        if (isRelevant) {
          additionalContext += `\n- "${sym.symbol}": ${sym.personalMeaning} (appeared ${sym.occurrenceCount}x)`;
        }
      }
    }

    const systemPrompt = `You are a thoughtful dream analyst drawing from Jungian psychology, depth psychology, and archetypal symbolism. Your role is to help the dreamer explore the meaning of their dream with nuance and respect for the mysterious nature of the unconscious.

Your approach:
1. **Symbol Exploration**: Identify key symbols and explore their possible meanings, both universal/archetypal and potentially personal
2. **Emotional Landscape**: Reflect on the emotional tone and what it might reveal about the dreamer's inner state
3. **Shadow Elements**: Gently explore any shadow material that may be surfacing
4. **Integration Questions**: Offer 2-3 reflection questions to help the dreamer deepen their understanding
5. **Practical Wisdom**: Suggest how the dream's message might apply to waking life

Guidelines:
- Use "might," "could suggest," "one possibility" - never be dogmatic about meaning
- Honor that the dreamer is the ultimate authority on their own psyche
- Be warm but not patronizing
- Keep interpretations grounded and useful, not overly mystical
- If noting concerning elements, do so with care and suggest professional support if appropriate
- Length: Aim for a thorough but focused response (300-500 words)

${additionalContext}`;

    const emotionText = emotions && emotions.length > 0 ? emotions.join(', ') : null;
    const symbolText = symbols && symbols.length > 0 ? symbols.join(', ') : null;

    const userPrompt = `Here is a dream to interpret:

**Dream Content:**
${content}

${symbolText ? `**Noted Symbols:** ${symbolText}` : ''}
${emotionText ? `**Emotional Tone:** ${emotionText}` : ''}
${recurring ? `**Note:** This is a recurring dream` : ''}
${context ? `**Dreamer's Context:** ${context}` : ''}

Please provide a thoughtful interpretation.`;

    // Call LM Studio (30s timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(LM_STUDIO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response('AI request timed out', { status: 504 });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return new Response('AI service unavailable', { status: 503 });
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let fullInterpretation = '';
        let totalOutputTokens = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullInterpretation += content;
                    totalOutputTokens += Math.ceil(content.length / 4); // Rough estimate
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          // Deduct tokens after successful completion
          const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
          const totalTokens = inputTokens + totalOutputTokens;
          await deductTokens(userId, totalTokens);

          // Log usage for analytics
          await prisma.aIUsage.create({
            data: {
              userId,
              inputTokens,
              outputTokens: totalOutputTokens,
              totalTokens,
              cost: totalTokens * 0.000001, // Rough estimate
              model: 'qwen3-32b',
              context: 'dream-interpretation',
            },
          });

          // Save interpretation to dream if dreamId provided
          if (dreamId && fullInterpretation) {
            await prisma.dreamEntry.update({
              where: { id: dreamId },
              data: { interpretation: fullInterpretation },
            });
          }

          // Record dream insights for activity tracking (fire and forget)
          recordDreamInsights(
            userId,
            content,
            symbols || [],
            emotions || [],
            fullInterpretation
          ).catch(err => {
            console.error('Error recording dream insights:', err);
          });

          // Update symbol dictionary with new symbols (fire and forget)
          if (symbols && symbols.length > 0) {
            updateSymbolDictionary(userId, symbols, content).catch(err => {
              console.error('Error updating symbol dictionary:', err);
            });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error interpreting dream:', error);
    return new Response('Failed to interpret dream', { status: 500 });
  }
}
