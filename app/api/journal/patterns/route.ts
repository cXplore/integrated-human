import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

// LM Studio endpoint
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const TOKENS_PER_CREDIT = 1000;
const CREDIT_COST = 5;
const TOKEN_COST = CREDIT_COST * TOKENS_PER_CREDIT;

interface MoodCount {
  mood: string;
  count: number;
  percentage: number;
}

interface EntryData {
  content: string;
  mood: string | null;
  createdAt: string;
}

interface RequestBody {
  moodDistribution: MoodCount[];
  recentEntries?: EntryData[];
  frequentWords?: Array<{ word: string; count: number }>;
  totalEntries: number;
  writingStreak: number;
  dominantMood: string | null;
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
 * POST /api/journal/patterns
 * Get AI-generated pattern suggestions based on journal entries
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json() as RequestBody;
    const { moodDistribution, recentEntries, frequentWords, totalEntries, writingStreak, dominantMood } = body;

    if (!recentEntries || recentEntries.length < 3) {
      return new Response('At least 3 journal entries required', { status: 400 });
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

    // Build context about the journal entries
    const entrySummaries = recentEntries.slice(0, 8).map((e, i) => {
      const date = new Date(e.createdAt).toLocaleDateString();
      return `Entry ${i + 1} (${date})${e.mood ? ` [Mood: ${e.mood}]` : ''}:
${e.content.slice(0, 400)}${e.content.length > 400 ? '...' : ''}`;
    }).join('\n\n---\n\n');

    const moodSummary = moodDistribution.length > 0
      ? `Emotional landscape: ${moodDistribution.slice(0, 5).map(m => `${m.mood} (${m.percentage}%)`).join(', ')}`
      : 'No mood data recorded';

    const wordSummary = frequentWords && frequentWords.length > 0
      ? `Recurring themes/words: ${frequentWords.slice(0, 10).map(w => w.word).join(', ')}`
      : '';

    const systemPrompt = `You are a compassionate and insightful journal companion with training in depth psychology and personal growth. Your role is to help the journaler see patterns in their writing that they might not notice themselves.

When analyzing journal patterns, you:
1. **Identify Themes**: Notice recurring topics, concerns, or interests
2. **Track Emotional Patterns**: Note shifts in mood and emotional tone
3. **Spot Growth Edges**: Areas where the person seems to be working on something
4. **Notice Avoidances**: Topics that might be hinted at but not fully explored
5. **Celebrate Progress**: Acknowledge any signs of insight or development

Your tone is:
- Warm and supportive, like a wise friend
- Curious and wondering rather than diagnostic
- Encouraging without being patronizing
- Honest but gentle about areas for exploration

Structure your response:
1. **What I Notice** (2-3 key patterns)
2. **Questions to Consider** (2-3 reflection prompts)
3. **An Invitation** (one gentle suggestion for their journaling practice)

Length: 200-350 words. Keep it focused and actionable.`;

    const userPrompt = `Here's a summary of someone's journal entries to analyze:

**Overview:**
- Total entries: ${totalEntries}
- Writing streak: ${writingStreak} day${writingStreak !== 1 ? 's' : ''}
- Dominant mood: ${dominantMood || 'varied'}
- ${moodSummary}
${wordSummary ? `- ${wordSummary}` : ''}

**Recent Entries:**

${entrySummaries}

Please share your observations about patterns, themes, and opportunities for growth in this journaling practice.`;

    // Call LM Studio
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
          max_tokens: 800,
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
              context: 'journal-patterns',
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
    console.error('Error analyzing journal patterns:', error);
    return new Response('Failed to analyze patterns', { status: 500 });
  }
}
