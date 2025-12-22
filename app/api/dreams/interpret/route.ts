import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, safeJsonParse } from '@/lib/sanitize';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const TOKENS_PER_CREDIT = 1000;
const CREDIT_COST = 5; // Credits per interpretation
const TOKEN_COST = CREDIT_COST * TOKENS_PER_CREDIT;

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
          model: 'qwen/qwen3-32b',
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
