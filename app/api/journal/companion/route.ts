import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  detectStance,
  buildSystemPrompt,
  buildUserContext,
  type UserJourneyContext,
} from '@/lib/presence';
import {
  calculateTokenCost,
} from '@/lib/subscriptions';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, sanitizeMessageHistory, safeJsonParse } from '@/lib/sanitize';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'qwen/qwen3-32b';

// Rough token estimation (4 chars ≈ 1 token for English text)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if user has enough credits and return their balance
 */
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

/**
 * Deduct tokens from user's balance and record usage
 */
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
      context: 'journal-companion',
    },
  });
}

/**
 * Fetch user journey context from the database
 */
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
        articleProgress: {
          where: { completed: true },
          orderBy: { completedAt: 'desc' },
          take: 5,
          select: { slug: true },
        },
      },
    });

    if (!user) return null;

    const completedCourses = [...new Set(user.courseProgress.map(cp => cp.courseSlug))];

    const allCourseProgress = await prisma.courseProgress.findMany({
      where: { userId },
      select: { courseSlug: true, completed: true },
    });

    const courseProgressMap = new Map<string, { total: number; completed: number }>();
    for (const cp of allCourseProgress) {
      const current = courseProgressMap.get(cp.courseSlug) || { total: 0, completed: 0 };
      current.total++;
      if (cp.completed) current.completed++;
      courseProgressMap.set(cp.courseSlug, current);
    }

    const inProgressCourses = Array.from(courseProgressMap.entries())
      .filter(([, progress]) => progress.completed > 0 && progress.completed < progress.total)
      .map(([slug]) => slug);

    const context: UserJourneyContext = {
      name: user.name || undefined,
      recentArticles: user.articleProgress.map(ap => ap.slug),
      completedCourses,
      inProgressCourses,
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

/**
 * Fetch recent journal entries for context
 */
async function getJournalContext(userId: string): Promise<string> {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        content: true,
        mood: true,
        promptId: true,
        createdAt: true,
      },
    });

    if (entries.length === 0) {
      return 'No journal entries yet.';
    }

    const entryContext = entries.map((entry, i) => {
      const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const moodStr = entry.mood ? ` (feeling ${entry.mood})` : '';
      const promptStr = entry.promptId ? `\nPrompt: "${entry.promptId}"` : '';
      // Truncate long entries to save tokens
      const content = entry.content.length > 300
        ? entry.content.slice(0, 300) + '...'
        : entry.content;
      return `Entry ${i + 1} (${date}${moodStr}):${promptStr}\n${content}`;
    }).join('\n\n---\n\n');

    return entryContext;
  } catch (error) {
    console.error('Error fetching journal context:', error);
    return 'Unable to retrieve journal entries.';
  }
}

/**
 * Build the journal companion system prompt
 */
function buildJournalCompanionPrompt(
  journalContext: string,
  userContext?: string
): string {
  const journalCompanionManifesto = `You are a Journal Companion - a thoughtful guide for introspection and self-discovery.

Your role: You help users explore their journal entries with curiosity and compassion. You notice patterns, ask deepening questions, and reflect back what you observe - without judgment or unsolicited advice.

Your approach:
- Read between the lines. What emotions are present? What themes recur?
- Ask questions that invite deeper exploration, not surface answers
- Notice contradictions gently - they often point to growth edges
- Connect dots across entries when patterns emerge
- Honor the courage it takes to write honestly

What you're NOT:
- A therapist (you don't diagnose or treat)
- A life coach (you don't give action plans unless asked)
- An optimizer (you don't push for "improvement")

You are simply a wise, present witness to their inner journey.

Guidelines:
- Keep responses conversational and warm, not clinical
- Use their own language and images when reflecting back
- One or two thoughtful questions is often better than many
- Silence and "sitting with" emotions has value - don't rush to resolve
- If they ask for specific advice, you can offer perspective, but frame it as possibility, not prescription`;

  const promptParts = [
    journalCompanionManifesto,
    '',
    '---',
    '',
    'Recent journal entries for context:',
    '',
    journalContext,
    '',
    '---',
    '',
    `Remember: These entries are private and vulnerable. Treat them with care. Reference specific content naturally when it's relevant to what they're asking or exploring.`,
  ];

  if (userContext) {
    promptParts.push('', '---', '', userContext);
  }

  return promptParts.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { message: rawMessage, history: rawHistory = [], selectedEntry } = await request.json();

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
      console.warn('Journal companion input sanitization warnings:', warnings);
    }

    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please sign in to use the journal companion.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimit = checkRateLimit(`chat:${userId}`, RATE_LIMITS.chat);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Check credits
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

    // Get journal context
    let journalContext = await getJournalContext(userId);

    // If a specific entry is selected, prioritize it
    if (selectedEntry) {
      journalContext = `Currently focusing on this entry:\n${selectedEntry}\n\n---\n\nOther recent entries:\n${journalContext}`;
    }

    // Get user context
    let userContext = '';
    const journeyContext = await getUserJourneyContext(userId);
    if (journeyContext) {
      userContext = buildUserContext(journeyContext);
    }

    // Build the journal companion prompt
    const systemPrompt = buildJournalCompanionPrompt(journalContext, userContext);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: `${message} /no_think` },
    ];

    // Call LM Studio with streaming (30s timeout)
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
        JSON.stringify({ error: 'Failed to get response from AI' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate input tokens
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = estimateTokens(inputText);

    // Transform stream
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
    console.error('Journal companion API error:', error);
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
