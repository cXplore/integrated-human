import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput } from '@/lib/sanitize';

// LM Studio endpoint
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const TOKENS_PER_CREDIT = 1000;
const CREDIT_COST = 10; // More expensive since analyzing multiple dreams
const TOKEN_COST = CREDIT_COST * TOKENS_PER_CREDIT;

interface DreamData {
  date: string;
  title: string | null;
  content: string;
  symbols: string[];
  emotions: string[];
  lucid: boolean;
  recurring: boolean;
}

async function checkCredits(userId: string): Promise<{ hasCredits: boolean; balance: number }> {
  const credits = await prisma.aICredits.findUnique({ where: { userId } });
  if (!credits) return { hasCredits: false, balance: 0 };
  return { hasCredits: credits.tokenBalance >= TOKEN_COST, balance: credits.tokenBalance };
}

async function deductTokens(userId: string, totalTokens: number): Promise<void> {
  const credits = await prisma.aICredits.findUnique({ where: { userId } });

  if (!credits) {
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
 * POST /api/dreams/analyze-series
 * Analyze patterns across multiple dreams
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { dreams, timeRange } = body as { dreams: DreamData[]; timeRange: string };

    if (!dreams || dreams.length < 2) {
      return new Response('At least 2 dreams required for series analysis', { status: 400 });
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

    // Collect all symbols and emotions
    const allSymbols = new Map<string, number>();
    const allEmotions = new Map<string, number>();
    let lucidCount = 0;
    let recurringCount = 0;

    dreams.forEach(d => {
      d.symbols?.forEach(s => allSymbols.set(s, (allSymbols.get(s) || 0) + 1));
      d.emotions?.forEach(e => allEmotions.set(e, (allEmotions.get(e) || 0) + 1));
      if (d.lucid) lucidCount++;
      if (d.recurring) recurringCount++;
    });

    const topSymbols = [...allSymbols.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topEmotions = [...allEmotions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Build dream summaries (truncate to avoid token limits)
    const dreamSummaries = dreams.slice(0, 15).map((d, i) => {
      const content = sanitizeUserInput(d.content, { maxLength: 500 }).sanitized;
      return `Dream ${i + 1} (${d.date}):
Title: ${d.title || 'Untitled'}
Content: ${content}
Symbols: ${d.symbols?.join(', ') || 'none'}
Emotions: ${d.emotions?.join(', ') || 'none'}
${d.lucid ? '[Lucid]' : ''} ${d.recurring ? '[Recurring]' : ''}`;
    }).join('\n\n---\n\n');

    const systemPrompt = `You are a depth psychologist and dream analyst specializing in pattern recognition across dream series. Your approach draws from Jungian psychology, archetypal psychology, and contemporary dream research.

When analyzing a dream series, you look for:
1. **Recurring Themes & Symbols**: What appears repeatedly and how it evolves
2. **Emotional Patterns**: The emotional arc across the dream series
3. **Character Development**: Recurring figures and how they change
4. **Setting Progressions**: How dream environments shift over time
5. **Shadow Material**: What's being avoided or confronted
6. **Integration Progress**: Signs of psychological integration or growth
7. **Compensatory Patterns**: How dreams may be balancing waking life

Your analysis should be:
- Insightful but not definitive (the dreamer is the authority)
- Grounded in psychological principles without being overly technical
- Warm and supportive while being honest about difficult material
- Practical, offering reflection prompts for continued exploration

Length: 400-600 words`;

    const userPrompt = `Please analyze this dream series from the past ${timeRange === 'all' ? 'period' : timeRange}:

**Overview:**
- Total dreams: ${dreams.length}
- Time span: ${dreams[dreams.length - 1]?.date} to ${dreams[0]?.date}
- Lucid dreams: ${lucidCount}
- Recurring dreams: ${recurringCount}
- Most frequent symbols: ${topSymbols.map(([s, c]) => `${s} (${c}x)`).join(', ') || 'none tracked'}
- Emotional tone: ${topEmotions.map(([e, c]) => `${e} (${c}x)`).join(', ') || 'varied'}

**Dream Content:**

${dreamSummaries}

Please provide:
1. An overall theme or narrative arc you notice
2. Key recurring symbols and their possible evolution
3. Emotional patterns and what they might indicate
4. Any shadow material or areas inviting exploration
5. 2-3 questions for the dreamer to reflect on`;

    // Call LM Studio (45s timeout for larger request)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

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
          max_tokens: 1500,
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
                    totalOutputTokens += Math.ceil(content.length / 4);
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

          // Log usage
          await prisma.aIUsage.create({
            data: {
              userId,
              inputTokens,
              outputTokens: totalOutputTokens,
              totalTokens,
              cost: totalTokens * 0.000001,
              model: 'qwen3-32b',
              context: 'dream-series-analysis',
            },
          });

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
    console.error('Error analyzing dreams:', error);
    return new Response('Failed to analyze dreams', { status: 500 });
  }
}
