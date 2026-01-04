import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  buildUserContext,
  type UserJourneyContext,
} from '@/lib/presence';
import {
  generateInsights,
  type ArchetypeData,
  type AttachmentData,
  type NervousSystemData,
} from '@/lib/insights';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, sanitizeMessageHistory, safeJsonParse } from '@/lib/sanitize';
import {
  classifySynthesis,
  buildEnhancedSynthesisPrompt,
  type SynthesisClassification,
} from '@/lib/synthesis-analysis';
import {
  LM_STUDIO_URL,
  LM_STUDIO_MODEL,
  isLocalAI,
  estimateTokens,
  checkCredits,
  deductTokens,
  noCreditsResponse,
} from '@/lib/ai-credits';

// =============================================================================
// TYPE GUARDS - Validate parsed JSON matches expected types
// =============================================================================

function isArchetypeData(data: unknown): data is ArchetypeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.gender === 'string' &&
    typeof d.primaryArchetype === 'string' &&
    typeof d.isWounded === 'boolean' &&
    typeof d.isIntegrated === 'boolean'
  );
}

function isAttachmentData(data: unknown): data is AttachmentData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.style === 'string' &&
    typeof d.styleName === 'string' &&
    typeof d.anxietyPercent === 'number' &&
    typeof d.avoidancePercent === 'number'
  );
}

function isNervousSystemData(data: unknown): data is NervousSystemData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.state === 'string' &&
    typeof d.stateName === 'string' &&
    d.counts !== undefined && typeof d.counts === 'object'
  );
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
      const results = safeJsonParse<unknown>(assessment.results, null);
      if (!results) continue;

      if (assessment.type === 'archetype' && isArchetypeData(results)) {
        archetype = results;
        const shadowStatus = results.isWounded ? 'in shadow' : results.isIntegrated ? 'integrated' : 'developing';
        parts.push(`Archetype Assessment:
- Primary: ${results.primaryArchetype} (${shadowStatus})
- Secondary: ${results.secondaryArchetype || 'None'}
- Gender: ${results.gender}
${results.profiles?.primary ? `- Top archetypes by score: ${results.profiles.primary.slice(0, 3).map(p => `${p.archetype} (mature: ${p.mature}, shadow: ${p.shadow})`).join(', ')}` : ''}`);
      }

      if (assessment.type === 'attachment' && isAttachmentData(results)) {
        attachment = results;
        parts.push(`Attachment Style Assessment:
- Style: ${results.styleName} (${results.style})
- Anxiety: ${results.anxietyPercent}%
- Avoidance: ${results.avoidancePercent}%`);
      }

      if (assessment.type === 'nervous-system' && isNervousSystemData(results)) {
        nervousSystem = results;
        parts.push(`Nervous System Assessment:
- Dominant State: ${results.stateName} (${results.state})
- Ventral vagal (calm): ${results.counts?.ventral || 0} responses
- Sympathetic (activated): ${results.counts?.sympathetic || 0} responses
- Dorsal vagal (shutdown): ${results.counts?.dorsal || 0} responses`);
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

    // Check credits (skip for local AI)
    let balance = 0;
    if (!isLocalAI) {
      const credits = await checkCredits(userId);
      if (!credits.hasCredits) {
        return noCreditsResponse();
      }
      balance = credits.balance;
    }

    // Get assessment context
    const { archetype, attachment, nervousSystem, contextString: assessmentContext } = await getAssessmentContext(userId);

    // Classify the synthesis using the new analysis library
    const classification = classifySynthesis(archetype, attachment, nervousSystem);

    // Get user context
    let userContext = '';
    const journeyContext = await getUserJourneyContext(userId);
    if (journeyContext) {
      userContext = buildUserContext(journeyContext);
    }

    // Build the enhanced synthesis prompt
    const systemPrompt = buildEnhancedSynthesisPrompt(classification, assessmentContext) +
      (userContext ? `\n\n---\nUSER CONTEXT:\n${userContext}` : '');

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

              deductTokens({
                userId,
                inputTokens,
                outputTokens,
                context: 'assessment-synthesis',
              }).catch(err => {
                console.error('Error deducting tokens:', err);
              });

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                done: true,
                classification: {
                  stage: classification.overallStage,
                  approach: classification.suggestedApproach,
                  patterns: classification.patterns.slice(0, 3).map(p => ({
                    name: p.pattern,
                    significance: p.significance,
                    description: p.description,
                  })),
                  strengths: classification.strengths.slice(0, 3),
                  priorities: classification.priorities.slice(0, 2).map(p => ({
                    area: p.area,
                    urgency: p.urgency,
                  })),
                  flags: classification.flags,
                },
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
