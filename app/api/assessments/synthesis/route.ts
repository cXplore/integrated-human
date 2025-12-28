import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  buildUserContext,
  type UserJourneyContext,
} from '@/lib/presence';
import {
  calculateTokenCost,
} from '@/lib/subscriptions';
import {
  generateInsights,
  type ArchetypeData,
  type AttachmentData,
  type NervousSystemData,
} from '@/lib/insights';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, sanitizeMessageHistory, safeJsonParse } from '@/lib/sanitize';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function checkCredits(userId: string): Promise<{ hasCredits: boolean; balance: number }> {
  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    return { hasCredits: false, balance: 0 };
  }

  return {
    hasCredits: credits.tokenBalance > 0,
    balance: credits.tokenBalance,
  };
}

async function deductTokens(
  userId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const totalTokens = inputTokens + outputTokens;
  const cost = calculateTokenCost(inputTokens, outputTokens);

  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

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
  } else {
    let monthlyDeduction = 0;
    let remainingDeduction = totalTokens;

    const monthlyAvailable = Math.max(0, credits.monthlyTokens - credits.monthlyUsed);

    if (monthlyAvailable > 0) {
      monthlyDeduction = Math.min(monthlyAvailable, remainingDeduction);
      remainingDeduction -= monthlyDeduction;
    }

    await prisma.aICredits.update({
      where: { userId },
      data: {
        tokenBalance: { decrement: totalTokens },
        monthlyUsed: { increment: monthlyDeduction },
        purchasedTokens: remainingDeduction > 0
          ? { decrement: remainingDeduction }
          : undefined,
      },
    });
  }

  await prisma.aIUsage.create({
    data: {
      userId,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      model: LM_STUDIO_MODEL,
      context: 'assessment-synthesis',
    },
  });
}

async function getUserJourneyContext(userId: string): Promise<UserJourneyContext | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        courseProgress: {
          where: { completed: true },
          select: { courseSlug: true },
        },
      },
    });

    if (!user) return null;

    const completedCourses = [...new Set(user.courseProgress.map(cp => cp.courseSlug))];

    const context: UserJourneyContext = {
      name: user.name || undefined,
      completedCourses,
    };

    if (user.profile) {
      context.primaryIntention = user.profile.primaryIntention || undefined;
      context.lifeSituation = user.profile.lifeSituation || undefined;
      context.hasAwakeningExperience = user.profile.hasAwakeningExperience;
      context.depthPreference = user.profile.depthPreference || undefined;

      if (user.profile.experienceLevels) {
        context.experienceLevels = safeJsonParse(user.profile.experienceLevels, {});
      }
      if (user.profile.currentChallenges) {
        context.currentChallenges = safeJsonParse(user.profile.currentChallenges, []);
      }
      if (user.profile.interests) {
        context.interests = safeJsonParse(user.profile.interests, []);
      }
    }

    return context;
  } catch (error) {
    console.error('Error fetching user journey context:', error);
    return null;
  }
}

async function getAssessmentContext(userId: string): Promise<{
  archetype: ArchetypeData | null;
  attachment: AttachmentData | null;
  nervousSystem: NervousSystemData | null;
  contextString: string;
}> {
  try {
    const assessments = await prisma.assessmentResult.findMany({
      where: { userId },
    });

    let archetype: ArchetypeData | null = null;
    let attachment: AttachmentData | null = null;
    let nervousSystem: NervousSystemData | null = null;

    const parts: string[] = [];

    for (const assessment of assessments) {
      const results = safeJsonParse(assessment.results, null);
      if (!results) continue;

      if (assessment.type === 'archetype') {
        archetype = results as unknown as ArchetypeData;
        const shadowStatus = archetype.isWounded ? 'in shadow' : archetype.isIntegrated ? 'integrated' : 'developing';
        parts.push(`Archetype Assessment:
- Primary: ${archetype.primaryArchetype} (${shadowStatus})
- Secondary: ${archetype.secondaryArchetype || 'None'}
- Gender: ${archetype.gender}
${archetype.profiles?.primary ? `- Top archetypes by score: ${archetype.profiles.primary.slice(0, 3).map(p => `${p.archetype} (mature: ${p.mature}, shadow: ${p.shadow})`).join(', ')}` : ''}`);
      }

      if (assessment.type === 'attachment') {
        attachment = results as unknown as AttachmentData;
        parts.push(`Attachment Style Assessment:
- Style: ${attachment.styleName} (${attachment.style})
- Anxiety: ${attachment.anxietyPercent}%
- Avoidance: ${attachment.avoidancePercent}%`);
      }

      if (assessment.type === 'nervous-system') {
        nervousSystem = results as unknown as NervousSystemData;
        parts.push(`Nervous System Assessment:
- Dominant State: ${nervousSystem.stateName} (${nervousSystem.state})
- Ventral vagal (calm): ${nervousSystem.counts?.ventral || 0} responses
- Sympathetic (activated): ${nervousSystem.counts?.sympathetic || 0} responses
- Dorsal vagal (shutdown): ${nervousSystem.counts?.dorsal || 0} responses`);
      }
    }

    // Generate cross-assessment insights if available
    const insights = generateInsights(
      archetype || undefined,
      attachment || undefined,
      nervousSystem || undefined
    );

    if (insights) {
      parts.push(`\nCross-Assessment Insights (generated from combining results):`);
      parts.push(`Overall Pattern: ${insights.overallPattern}`);
      parts.push(`Primary Focus: ${insights.primaryWork}`);

      if (insights.strengths.length > 0) {
        parts.push(`Strengths: ${insights.strengths.join('; ')}`);
      }
      if (insights.watchPoints.length > 0) {
        parts.push(`Watch Points: ${insights.watchPoints.join('; ')}`);
      }

      for (const insight of insights.insights) {
        parts.push(`\nInsight - ${insight.title}:\n${insight.insight}\nInvitation: ${insight.invitation}`);
      }
    }

    return {
      archetype,
      attachment,
      nervousSystem,
      contextString: parts.length > 0 ? parts.join('\n\n') : 'No assessments completed yet.',
    };
  } catch (error) {
    console.error('Error fetching assessment context:', error);
    return {
      archetype: null,
      attachment: null,
      nervousSystem: null,
      contextString: 'Unable to retrieve assessments.',
    };
  }
}

function buildSynthesisPrompt(
  assessmentContext: string,
  userContext?: string
): string {
  const synthesisManifesto = `You are an Integration Guide - a wise companion who helps people understand and synthesize their psychological assessment results.

Your role: You help users explore the deeper meaning of their archetype, attachment, and nervous system patterns. You connect the dots, reveal blind spots with compassion, and suggest practical integration paths.

Your knowledge base:
- Jungian archetypes (King, Warrior, Magician, Lover for masculine; Queen, Mother, Maiden, Huntress, Mystic, Wild Woman for feminine)
- Shadow work and mature expression of archetypes
- Attachment theory (secure, anxious, avoidant, disorganized)
- Polyvagal theory (ventral vagal, sympathetic, dorsal vagal)
- How these systems interact and influence each other

Your approach:
- Synthesize patterns across assessments - show how they connect
- Be direct but compassionate about shadow material
- Ground insights in practical, embodied suggestions
- Honor the intelligence of their adaptations, even when those adaptations are no longer serving them
- Speak to potential, not just problems
- Use their specific results to personalize responses

What you avoid:
- Generic self-help platitudes
- Diagnosing or treating (you're not a therapist)
- Spiritual bypassing or toxic positivity
- Overwhelming with too much at once

Response style:
- Conversational and warm, not clinical
- 2-4 paragraphs typically
- One or two specific, practical invitations when appropriate
- Acknowledge complexity without getting lost in it`;

  const promptParts = [
    synthesisManifesto,
    '',
    '---',
    '',
    'User\'s Assessment Results:',
    '',
    assessmentContext,
    '',
    '---',
    '',
    'Use these specific results to inform your responses. Reference their actual patterns and scores when relevant. Connect the dots between assessments to offer deeper synthesis.',
  ];

  if (userContext) {
    promptParts.push('', '---', '', userContext);
  }

  return promptParts.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { message: rawMessage, history: rawHistory = [] } = await request.json();

    if (!rawMessage || typeof rawMessage !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize user input
    const { sanitized: message, warnings } = sanitizeUserInput(rawMessage, { maxLength: 4000 });
    const history = sanitizeMessageHistory(rawHistory);
    if (warnings.length > 0) {
      console.warn('Assessment synthesis input sanitization warnings:', warnings);
    }

    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please sign in to use the assessment synthesis.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimit = checkRateLimit(`ai:${userId}`, RATE_LIMITS.aiHeavy);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const { hasCredits, balance } = await checkCredits(userId);

    if (!hasCredits) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          code: 'NO_CREDITS',
          message: 'You\'ve run out of AI credits. Purchase more to continue.',
          balance: 0,
        }),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get assessment context
    const { contextString: assessmentContext } = await getAssessmentContext(userId);

    // Get user context
    let userContext = '';
    const journeyContext = await getUserJourneyContext(userId);
    if (journeyContext) {
      userContext = buildUserContext(journeyContext);
    }

    // Build the synthesis prompt
    const systemPrompt = buildSynthesisPrompt(assessmentContext, userContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: `${message} /no_think` },
    ];

    // 30s timeout for LLM request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(LM_STUDIO_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LM_STUDIO_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 700,
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
        JSON.stringify({ error: 'Failed to get response from AI' }),
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
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              if (buffer && !inThinkTag) {
                totalOutputContent += buffer;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
                buffer = '';
              }

              const outputTokens = estimateTokens(totalOutputContent);
              const totalTokens = inputTokens + outputTokens;

              deductTokens(userId, inputTokens, outputTokens).catch(err => {
                console.error('Error deducting tokens:', err);
              });

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                done: true,
                usage: {
                  inputTokens,
                  outputTokens,
                  totalTokens,
                  remainingBalance: balance - totalTokens,
                },
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
                    } else {
                      break;
                    }
                  } else {
                    const openIndex = buffer.indexOf('<think>');
                    if (openIndex !== -1) {
                      const before = buffer.slice(0, openIndex);
                      if (before) {
                        totalOutputContent += before;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: before })}\n\n`));
                      }
                      buffer = buffer.slice(openIndex + 7);
                      inThinkTag = true;
                    } else {
                      const safeLength = Math.max(0, buffer.length - 6);
                      if (safeLength > 0) {
                        const toSend = buffer.slice(0, safeLength);
                        totalOutputContent += toSend;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: toSend })}\n\n`));
                        buffer = buffer.slice(safeLength);
                      }
                      break;
                    }
                  }
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
      flush(controller) {
        if (buffer && !inThinkTag) {
          totalOutputContent += buffer;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
        }
      }
    });

    const readable = response.body?.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Assessment synthesis API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
