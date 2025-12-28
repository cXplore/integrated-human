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
import { recordBulkActivities } from '@/lib/assessment/activity-tracker';
import type { PillarId } from '@/lib/assessment/types';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

// Rough token estimation (4 chars ≈ 1 token for English text)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// =============================================================================
// DIMENSION DETECTION FOR ACTIVITY TRACKING
// =============================================================================

interface DimensionInsight {
  pillarId: PillarId;
  dimensionId: string;
  reason: string;
}

// Keywords that map to specific dimensions
const DIMENSION_KEYWORDS: Record<string, { pillarId: PillarId; dimensionId: string }> = {
  // Mind
  'emotion': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'emotional': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'regulate': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'overwhelm': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'anxious': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'anxiety': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'calm': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'perspective': { pillarId: 'mind', dimensionId: 'cognitive-flexibility' },
  'reframe': { pillarId: 'mind', dimensionId: 'cognitive-flexibility' },
  'mindset': { pillarId: 'mind', dimensionId: 'cognitive-flexibility' },
  'pattern': { pillarId: 'mind', dimensionId: 'self-awareness' },
  'notice': { pillarId: 'mind', dimensionId: 'self-awareness' },
  'aware': { pillarId: 'mind', dimensionId: 'self-awareness' },
  'awareness': { pillarId: 'mind', dimensionId: 'self-awareness' },
  'present': { pillarId: 'mind', dimensionId: 'present-moment' },
  'mindful': { pillarId: 'mind', dimensionId: 'present-moment' },
  'thought': { pillarId: 'mind', dimensionId: 'thought-patterns' },
  'inner critic': { pillarId: 'mind', dimensionId: 'thought-patterns' },
  'ruminate': { pillarId: 'mind', dimensionId: 'thought-patterns' },
  'rumination': { pillarId: 'mind', dimensionId: 'thought-patterns' },
  'safe': { pillarId: 'mind', dimensionId: 'psychological-safety' },
  'safety': { pillarId: 'mind', dimensionId: 'psychological-safety' },
  'nervous system': { pillarId: 'mind', dimensionId: 'psychological-safety' },
  'self-compassion': { pillarId: 'mind', dimensionId: 'self-relationship' },
  'self-care': { pillarId: 'mind', dimensionId: 'self-relationship' },
  'meaning': { pillarId: 'mind', dimensionId: 'meaning-purpose' },
  'purpose': { pillarId: 'mind', dimensionId: 'meaning-purpose' },
  'values': { pillarId: 'mind', dimensionId: 'meaning-purpose' },

  // Body
  'body': { pillarId: 'body', dimensionId: 'interoception' },
  'sensation': { pillarId: 'body', dimensionId: 'interoception' },
  'feel in my body': { pillarId: 'body', dimensionId: 'interoception' },
  'stress': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'tension': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'burnout': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'sleep': { pillarId: 'body', dimensionId: 'sleep-restoration' },
  'tired': { pillarId: 'body', dimensionId: 'sleep-restoration' },
  'rest': { pillarId: 'body', dimensionId: 'sleep-restoration' },
  'energy': { pillarId: 'body', dimensionId: 'energy-vitality' },
  'vitality': { pillarId: 'body', dimensionId: 'energy-vitality' },
  'exhausted': { pillarId: 'body', dimensionId: 'energy-vitality' },
  'movement': { pillarId: 'body', dimensionId: 'movement-capacity' },
  'exercise': { pillarId: 'body', dimensionId: 'movement-capacity' },
  'eating': { pillarId: 'body', dimensionId: 'nourishment' },
  'food': { pillarId: 'body', dimensionId: 'nourishment' },
  'embodied': { pillarId: 'body', dimensionId: 'embodied-presence' },
  'grounded': { pillarId: 'body', dimensionId: 'embodied-presence' },

  // Soul
  'authentic': { pillarId: 'soul', dimensionId: 'authenticity' },
  'true self': { pillarId: 'soul', dimensionId: 'authenticity' },
  'mask': { pillarId: 'soul', dimensionId: 'authenticity' },
  'existential': { pillarId: 'soul', dimensionId: 'existential-grounding' },
  'death': { pillarId: 'soul', dimensionId: 'existential-grounding' },
  'mortality': { pillarId: 'soul', dimensionId: 'existential-grounding' },
  'transcend': { pillarId: 'soul', dimensionId: 'transcendence' },
  'awe': { pillarId: 'soul', dimensionId: 'transcendence' },
  'spiritual': { pillarId: 'soul', dimensionId: 'transcendence' },
  'shadow': { pillarId: 'soul', dimensionId: 'shadow-integration' },
  'dark side': { pillarId: 'soul', dimensionId: 'shadow-integration' },
  'creative': { pillarId: 'soul', dimensionId: 'creative-expression' },
  'creativity': { pillarId: 'soul', dimensionId: 'creative-expression' },
  'express': { pillarId: 'soul', dimensionId: 'creative-expression' },
  'alive': { pillarId: 'soul', dimensionId: 'life-engagement' },
  'engaged': { pillarId: 'soul', dimensionId: 'life-engagement' },
  'numb': { pillarId: 'soul', dimensionId: 'life-engagement' },
  'intuition': { pillarId: 'soul', dimensionId: 'inner-wisdom' },
  'wisdom': { pillarId: 'soul', dimensionId: 'inner-wisdom' },
  'gut feeling': { pillarId: 'soul', dimensionId: 'inner-wisdom' },
  'meditation': { pillarId: 'soul', dimensionId: 'spiritual-practice' },
  'practice': { pillarId: 'soul', dimensionId: 'spiritual-practice' },

  // Relationships
  'attachment': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'secure': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'anxious attachment': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'avoidant': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'communicate': { pillarId: 'relationships', dimensionId: 'communication' },
  'communication': { pillarId: 'relationships', dimensionId: 'communication' },
  'express needs': { pillarId: 'relationships', dimensionId: 'communication' },
  'boundary': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'boundaries': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'say no': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'conflict': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'repair': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'forgive': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'forgiveness': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'trust': { pillarId: 'relationships', dimensionId: 'trust-vulnerability' },
  'vulnerable': { pillarId: 'relationships', dimensionId: 'trust-vulnerability' },
  'vulnerability': { pillarId: 'relationships', dimensionId: 'trust-vulnerability' },
  'empathy': { pillarId: 'relationships', dimensionId: 'empathy-attunement' },
  'attune': { pillarId: 'relationships', dimensionId: 'empathy-attunement' },
  'understand them': { pillarId: 'relationships', dimensionId: 'empathy-attunement' },
  'intimacy': { pillarId: 'relationships', dimensionId: 'intimacy-depth' },
  'close': { pillarId: 'relationships', dimensionId: 'intimacy-depth' },
  'connection': { pillarId: 'relationships', dimensionId: 'social-connection' },
  'lonely': { pillarId: 'relationships', dimensionId: 'social-connection' },
  'loneliness': { pillarId: 'relationships', dimensionId: 'social-connection' },
  'relationship pattern': { pillarId: 'relationships', dimensionId: 'relational-patterns' },
  'family of origin': { pillarId: 'relationships', dimensionId: 'relational-patterns' },
};

/**
 * Detect dimensions being explored in a conversation
 * Returns up to 2 most relevant dimensions
 */
function detectDimensionInsights(
  userMessage: string,
  aiResponse: string
): DimensionInsight[] {
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase();
  const detected = new Map<string, DimensionInsight>();

  // Sort keywords by length (longer first) to match phrases before individual words
  const sortedKeywords = Object.entries(DIMENSION_KEYWORDS)
    .sort(([a], [b]) => b.length - a.length);

  for (const [keyword, dimension] of sortedKeywords) {
    if (combinedText.includes(keyword)) {
      const key = `${dimension.pillarId}:${dimension.dimensionId}`;
      if (!detected.has(key)) {
        detected.set(key, {
          ...dimension,
          reason: `Journal reflection on ${keyword}`,
        });
      }
    }

    // Limit to 2 dimensions per conversation turn
    if (detected.size >= 2) break;
  }

  return Array.from(detected.values());
}

/**
 * Record detected insights as activities (fire and forget)
 */
async function recordJournalInsights(
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  try {
    const insights = detectDimensionInsights(userMessage, aiResponse);

    if (insights.length > 0) {
      await recordBulkActivities(
        userId,
        insights.map((insight) => ({
          pillarId: insight.pillarId,
          dimensionId: insight.dimensionId,
          points: 2, // AI insights give 2 points
          reason: insight.reason,
          activityType: 'ai-insight',
        }))
      );
    }
  } catch (error) {
    // Don't let activity tracking errors affect the user experience
    console.error('Failed to record journal insights:', error);
  }
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

              // Record dimension insights for activity tracking (fire and forget)
              recordJournalInsights(userId, message, totalOutputContent).catch(err => {
                console.error('Error recording journal insights:', err);
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
