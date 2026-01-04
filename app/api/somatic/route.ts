import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, sanitizeMessageHistory } from '@/lib/sanitize';
import {
  classifySomaticState,
  generateBodyPrompts,
  buildSomaticPrompt,
  SOMATIC_APPROACHES,
  type SomaticClassification,
} from '@/lib/somatic-analysis';
import { detectDimensions, recordGrowthActivity } from '@/lib/classification-utils';
import {
  LM_STUDIO_URL,
  LM_STUDIO_MODEL,
  isLocalAI,
  estimateTokens,
  checkCredits,
  deductTokens,
  noCreditsResponse,
} from '@/lib/ai-credits';

export async function POST(request: NextRequest) {
  try {
    const { message: rawMessage, history: rawHistory = [] } = await request.json();

    if (!rawMessage || typeof rawMessage !== 'string' || rawMessage.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Please describe your body sensation (at least 5 characters)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { sanitized: message, warnings } = sanitizeUserInput(rawMessage, { maxLength: 2000 });
    const history = sanitizeMessageHistory(rawHistory);
    if (warnings.length > 0) {
      console.warn('Somatic input sanitization warnings:', warnings);
    }

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

    // Classify the somatic state
    const classification = classifySomaticState(message);

    // Generate body prompts for the response
    const bodyPrompts = generateBodyPrompts(classification);

    // Build the professional prompt
    const systemPrompt = buildSomaticPrompt(classification);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: `${message} /no_think` },
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
          max_tokens: 600,
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
                context: 'somatic-companion',
              }).catch(console.error);

              // Record dimension activity for somatic engagement
              const dimensions = detectDimensions(message, 2);
              // Always record body-awareness for somatic work
              recordGrowthActivity(
                prisma,
                userId,
                'somatic-session',
                'somatic',
                null,
                'body',
                'body-awareness',
                2,
                `Somatic exploration: ${classification.primaryState} state, ${classification.affectedRegions.slice(0, 2).join('/')} focus`
              ).catch(console.error);

              // Record nervous-system activity based on window
              if (classification.window === 'hyper' || classification.window === 'hypo') {
                recordGrowthActivity(
                  prisma,
                  userId,
                  'somatic-session',
                  'somatic',
                  null,
                  'body',
                  'nervous-system',
                  1,
                  `Nervous system awareness: ${classification.window === 'hyper' ? 'hyperarousal' : 'hypoarousal'} recognition`
                ).catch(console.error);
              }

              // Record any detected dimensions
              for (const dim of dimensions) {
                recordGrowthActivity(
                  prisma,
                  userId,
                  'somatic-session',
                  'somatic',
                  null,
                  dim.pillarId,
                  dim.dimensionId,
                  1,
                  `Somatic session touched ${dim.dimensionId}`
                ).catch(console.error);
              }

              ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({
                done: true,
                classification: {
                  state: classification.primaryState,
                  intensity: classification.intensityLevel,
                  window: classification.window,
                  approach: classification.suggestedApproach,
                  regions: classification.affectedRegions,
                  sensations: classification.dominantSensations,
                  flags: {
                    dissociationRisk: classification.flags.dissociationRisk,
                    floodingRisk: classification.flags.floodingRisk,
                    traumaIndicators: classification.flags.traumaIndicators,
                    needsProfessional: classification.flags.needsProfessional,
                  },
                },
                bodyPrompts: bodyPrompts.slice(0, 2),
                approachInfo: {
                  name: SOMATIC_APPROACHES[classification.suggestedApproach].name,
                  description: SOMATIC_APPROACHES[classification.suggestedApproach].description,
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
    console.error('Somatic API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
