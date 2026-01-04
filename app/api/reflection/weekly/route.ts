import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import {
  generateWeeklyReflection,
  buildWeeklyReflectionPrompt,
  type WeeklyReflection,
} from '@/lib/weekly-reflection';
import {
  LM_STUDIO_URL,
  LM_STUDIO_MODEL,
  isLocalAI,
  estimateTokens,
  checkCredits,
  deductTokens,
  noCreditsResponse,
} from '@/lib/ai-credits';

/**
 * GET /api/reflection/weekly
 * Get weekly reflection data without AI synthesis (just the structured data)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.id;

    // Generate reflection data
    const reflection = await generateWeeklyReflection(userId);

    return new Response(JSON.stringify(reflection), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Weekly reflection data error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate reflection data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/reflection/weekly
 * Get AI-synthesized weekly reflection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.id;

    // Rate limit
    const rateLimit = checkRateLimit(`ai:${userId}`, RATE_LIMITS.aiHeavy);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Credits check
    if (!isLocalAI) {
      const credits = await checkCredits(userId);
      if (!credits.hasCredits) {
        return noCreditsResponse();
      }
    }

    // Generate reflection data
    const reflection = await generateWeeklyReflection(userId);

    // Check if there's enough data for a meaningful reflection
    const hasData =
      reflection.journals.entryCount > 0 ||
      reflection.dreams.dreamCount > 0 ||
      reflection.progress.lessonsCompleted > 0;

    if (!hasData) {
      return new Response(JSON.stringify({
        reflection,
        synthesis: null,
        message: 'Not enough activity this week for an AI synthesis. Try journaling, recording dreams, or completing lessons to unlock your weekly reflection.',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build the prompt
    const systemPrompt = buildWeeklyReflectionPrompt(reflection);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Please create my weekly reflection. /no_think' },
    ];

    // 30s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(LM_STUDIO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LM_STUDIO_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 800,
          stream: true,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'AI request timed out' }),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error('LM Studio error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = estimateTokens(inputText);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = '';
    let inThinkTag = false;
    let totalOutputContent = '';

    const transformStream = new TransformStream({
      async transform(chunk, ctrl) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              if (buffer && !inThinkTag) {
                totalOutputContent += buffer;
                ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
              }

              const outputTokens = estimateTokens(totalOutputContent);
              deductTokens({
                userId,
                inputTokens,
                outputTokens,
                context: 'weekly-reflection',
              }).catch(console.error);

              ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({
                done: true,
                reflection: {
                  period: reflection.period,
                  summary: {
                    journalCount: reflection.journals.entryCount,
                    dreamCount: reflection.dreams.dreamCount,
                    lessonsCompleted: reflection.progress.lessonsCompleted,
                    emotionalArc: reflection.journals.emotionalArc,
                    healthTrend: reflection.health.overallTrend,
                  },
                  patterns: reflection.patterns.slice(0, 2),
                  celebrations: reflection.celebrations.slice(0, 3),
                  invitations: reflection.invitations.slice(0, 2),
                },
                usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
              })}\n\n`));
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                buffer += content;

                while (true) {
                  if (inThinkTag) {
                    const closeIndex = buffer.indexOf('</think>');
                    if (closeIndex !== -1) {
                      buffer = buffer.slice(closeIndex + 8);
                      inThinkTag = false;
                    } else break;
                  } else {
                    const openIndex = buffer.indexOf('<think>');
                    if (openIndex !== -1) {
                      const before = buffer.slice(0, openIndex);
                      if (before) {
                        totalOutputContent += before;
                        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ content: before })}\n\n`));
                      }
                      buffer = buffer.slice(openIndex + 7);
                      inThinkTag = true;
                    } else {
                      const safeLength = Math.max(0, buffer.length - 6);
                      if (safeLength > 0) {
                        const toSend = buffer.slice(0, safeLength);
                        totalOutputContent += toSend;
                        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ content: toSend })}\n\n`));
                        buffer = buffer.slice(safeLength);
                      }
                      break;
                    }
                  }
                }
              }
            } catch { /* skip */ }
          }
        }
      },
      flush(ctrl) {
        if (buffer && !inThinkTag) {
          totalOutputContent += buffer;
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error) {
    console.error('Weekly reflection API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
