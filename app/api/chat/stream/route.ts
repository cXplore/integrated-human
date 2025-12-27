import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  detectStance,
  isCasualMessage,
  buildCasualPrompt,
  buildSystemPrompt,
  buildUserContext,
  buildDynamicContext,
  SITE_CONTEXT,
  type UserJourneyContext,
  type UserHealthContext,
} from '@/lib/presence';
import {
  gatherHealthData,
  calculateDataFreshness,
  type FreshnessLevel,
} from '@/lib/integration-health';
import {
  calculateTokenCost,
  INPUT_TOKEN_COST,
  OUTPUT_TOKEN_COST,
} from '@/lib/subscriptions';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, sanitizeMessageHistory, safeJsonParse } from '@/lib/sanitize';
import { recordBulkActivities } from '@/lib/assessment/activity-tracker';
import type { PillarId } from '@/lib/assessment/types';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'qwen/qwen3-32b';

// Rough token estimation (4 chars ≈ 1 token for English text)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// =============================================================================
// DIMENSION DETECTION FOR CHAT ACTIVITY TRACKING
// =============================================================================

interface ChatDimensionInsight {
  pillarId: PillarId;
  dimensionId: string;
  reason: string;
}

// Keywords that map to specific dimensions (shared mapping for chat contexts)
const CHAT_DIMENSION_KEYWORDS: Record<string, { pillarId: PillarId; dimensionId: string }> = {
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
  'stress': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'tension': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'burnout': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'sleep': { pillarId: 'body', dimensionId: 'sleep-restoration' },
  'tired': { pillarId: 'body', dimensionId: 'sleep-restoration' },
  'rest': { pillarId: 'body', dimensionId: 'sleep-restoration' },
  'energy': { pillarId: 'body', dimensionId: 'energy-vitality' },
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
  'transcend': { pillarId: 'soul', dimensionId: 'transcendence' },
  'awe': { pillarId: 'soul', dimensionId: 'transcendence' },
  'spiritual': { pillarId: 'soul', dimensionId: 'transcendence' },
  'shadow': { pillarId: 'soul', dimensionId: 'shadow-integration' },
  'dark side': { pillarId: 'soul', dimensionId: 'shadow-integration' },
  'creative': { pillarId: 'soul', dimensionId: 'creative-expression' },
  'creativity': { pillarId: 'soul', dimensionId: 'creative-expression' },
  'alive': { pillarId: 'soul', dimensionId: 'life-engagement' },
  'engaged': { pillarId: 'soul', dimensionId: 'life-engagement' },
  'numb': { pillarId: 'soul', dimensionId: 'life-engagement' },
  'intuition': { pillarId: 'soul', dimensionId: 'inner-wisdom' },
  'wisdom': { pillarId: 'soul', dimensionId: 'inner-wisdom' },
  'meditation': { pillarId: 'soul', dimensionId: 'spiritual-practice' },
  'practice': { pillarId: 'soul', dimensionId: 'spiritual-practice' },

  // Relationships
  'attachment': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'secure': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'avoidant': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'communicate': { pillarId: 'relationships', dimensionId: 'communication' },
  'communication': { pillarId: 'relationships', dimensionId: 'communication' },
  'boundary': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'boundaries': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'conflict': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'repair': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'forgive': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'trust': { pillarId: 'relationships', dimensionId: 'trust-vulnerability' },
  'vulnerable': { pillarId: 'relationships', dimensionId: 'trust-vulnerability' },
  'vulnerability': { pillarId: 'relationships', dimensionId: 'trust-vulnerability' },
  'empathy': { pillarId: 'relationships', dimensionId: 'empathy-attunement' },
  'intimacy': { pillarId: 'relationships', dimensionId: 'intimacy-depth' },
  'connection': { pillarId: 'relationships', dimensionId: 'social-connection' },
  'lonely': { pillarId: 'relationships', dimensionId: 'social-connection' },
  'relationship pattern': { pillarId: 'relationships', dimensionId: 'relational-patterns' },
};

/**
 * Detect dimensions being explored in a chat conversation
 * Returns up to 2 most relevant dimensions
 */
function detectChatDimensions(
  userMessage: string,
  aiResponse: string
): ChatDimensionInsight[] {
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase();
  const detected = new Map<string, ChatDimensionInsight>();

  // Sort keywords by length (longer first) to match phrases before individual words
  const sortedKeywords = Object.entries(CHAT_DIMENSION_KEYWORDS)
    .sort(([a], [b]) => b.length - a.length);

  for (const [keyword, dimension] of sortedKeywords) {
    if (combinedText.includes(keyword)) {
      const key = `${dimension.pillarId}:${dimension.dimensionId}`;
      if (!detected.has(key)) {
        detected.set(key, {
          ...dimension,
          reason: `Chat reflection on ${keyword}`,
        });
      }
    }

    // Limit to 2 dimensions per conversation turn
    if (detected.size >= 2) break;
  }

  return Array.from(detected.values());
}

/**
 * Record chat insights as activities (fire and forget)
 */
async function recordChatInsights(
  userId: string,
  userMessage: string,
  aiResponse: string,
  context?: string
): Promise<void> {
  try {
    const insights = detectChatDimensions(userMessage, aiResponse);

    if (insights.length > 0) {
      await recordBulkActivities(
        userId,
        insights.map((insight) => ({
          pillarId: insight.pillarId,
          dimensionId: insight.dimensionId,
          points: 2, // Chat insights give 2 points
          reason: insight.reason,
          activityType: context === 'content-companion' ? 'content-insight' : 'ai-insight',
        }))
      );
    }
  } catch (error) {
    console.error('Failed to record chat insights:', error);
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
  context?: string
): Promise<void> {
  const totalTokens = inputTokens + outputTokens;
  const cost = calculateTokenCost(inputTokens, outputTokens);

  // Get current credits to determine deduction order
  const credits = await prisma.aICredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    // Create credits record if doesn't exist (shouldn't happen, but safety)
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
    // Deduct from monthly tokens first, then purchased
    let monthlyDeduction = 0;
    let remainingDeduction = totalTokens;

    // How much monthly tokens are available (monthlyTokens - monthlyUsed)?
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
        // If we need to dip into purchased tokens
        purchasedTokens: remainingDeduction > 0
          ? { decrement: remainingDeduction }
          : undefined,
      },
    });
  }

  // Record usage for analytics
  await prisma.aIUsage.create({
    data: {
      userId,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      model: LM_STUDIO_MODEL,
      context: context || 'chat',
    },
  });
}

/**
 * Fetch user journey context from the database
 */
async function getUserJourneyContext(userId: string): Promise<UserJourneyContext | null> {
  try {
    // Fetch user with profile and progress data
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

    // Get unique completed courses
    const completedCourses = [...new Set(user.courseProgress.map(cp => cp.courseSlug))];

    // Get in-progress courses (have some progress but not complete)
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

    // Add profile data if exists
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
 * Fetch user health context from the Integration Health system
 * Includes freshness/staleness data to prevent anchoring users to outdated states
 */
async function getUserHealthContext(userId: string): Promise<UserHealthContext | null> {
  try {
    // Get latest integration health
    const health = await prisma.integrationHealth.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!health) return null;

    // Calculate data freshness
    const healthData = await gatherHealthData(userId);
    const freshness = calculateDataFreshness(healthData);

    // Find lowest pillar
    const scores = {
      mind: health.mindScore,
      body: health.bodyScore,
      soul: health.soulScore,
      relationships: health.relationshipsScore,
    };
    const lowestPillar = Object.entries(scores)
      .sort(([, a], [, b]) => a - b)[0][0];

    // Determine overall stage (use most common or lowest)
    const stages = [health.mindStage, health.bodyStage, health.soulStage, health.relationshipsStage];
    const inCollapse = stages.includes('collapse');

    // Get recent check-ins for mood/energy
    const recentCheckIn = await prisma.quickCheckIn.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get assessment results for attachment/nervous system
    const assessments = await prisma.assessmentResult.findMany({
      where: { userId, type: { in: ['attachment', 'nervous-system'] } },
    });

    let nervousSystemState: string | undefined;
    let attachmentStyle: string | undefined;

    for (const a of assessments) {
      const results = safeJsonParse<{ primary?: string; style?: string }>(a.results, {});
      if (a.type === 'nervous-system' && results.primary) {
        nervousSystemState = results.primary;
      }
      if (a.type === 'attachment' && results.style) {
        attachmentStyle = results.style;
      }
    }

    // Build freshness message for the AI
    const freshnessMessages: string[] = [];
    if (freshness.details.checkIns.level !== 'fresh') {
      freshnessMessages.push(freshness.details.checkIns.message);
    }
    if (freshness.details.activity.level !== 'fresh') {
      freshnessMessages.push(freshness.details.activity.message);
    }

    return {
      stage: health.mindStage, // Use mind as representative
      lowestPillar,
      inCollapse,
      nervousSystemState,
      attachmentStyle,
      recentMood: recentCheckIn?.mood,
      recentEnergy: recentCheckIn?.energy,
      // Freshness data
      dataFreshness: freshness.overall as 'fresh' | 'aging' | 'stale' | 'expired',
      dataConfidence: freshness.overallConfidence,
      suggestedActions: freshness.suggestedActions,
      freshnessMessage: freshnessMessages.length > 0 ? freshnessMessages.join('. ') : undefined,
    };
  } catch (error) {
    console.error('Error fetching user health context:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message: rawMessage, history: rawHistory = [], context: chatContext, conversationId } = await request.json();

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
      console.warn('Input sanitization warnings:', warnings);
    }

    // Get user session - REQUIRED for credit-based chat
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please sign in to use the AI companion.',
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

    // Check if user has credits
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
          status: 402, // Payment Required
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle conversation persistence if conversationId provided
    let activeConversationId = conversationId;
    if (chatContext === 'standalone-chat') {
      // For standalone chat, ensure we have a conversation
      if (!activeConversationId) {
        // Create or get active conversation
        const existing = await prisma.chatConversation.findFirst({
          where: { userId, isActive: true },
        });

        if (existing) {
          activeConversationId = existing.id;
        } else {
          const newConv = await prisma.chatConversation.create({
            data: { userId, isActive: true, mode: 'general' },
          });
          activeConversationId = newConv.id;
        }
      }

      // Save user message to database
      await prisma.chatMessage.create({
        data: {
          conversationId: activeConversationId,
          role: 'user',
          content: message,
        },
      });

      // Update conversation timestamp
      await prisma.chatConversation.update({
        where: { id: activeConversationId },
        data: { updatedAt: new Date() },
      });
    }

    // Get user context for personalization
    let userContext = '';
    const journeyContext = await getUserJourneyContext(userId);
    if (journeyContext) {
      userContext = buildUserContext(journeyContext);
    }

    // Get health context for deeper personalization
    const healthContext = await getUserHealthContext(userId);

    // Build site context with health awareness
    const siteContext = healthContext
      ? buildDynamicContext({ articles: [], courses: [], practices: [] }, healthContext)
      : SITE_CONTEXT;

    // Detect stance and build appropriate prompt
    const isCasual = isCasualMessage(message);
    const stance = isCasual ? 'companion' : detectStance(message);
    const systemPrompt = isCasual
      ? buildCasualPrompt()
      : buildSystemPrompt(stance, siteContext, userContext);

    // Build messages array for the LLM
    // Add /no_think to user message to disable qwen's thinking mode for faster responses
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
          max_tokens: 500,
          stream: true,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'AI request timed out', details: 'Please try again' }),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LM Studio error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to get response from AI',
          details: response.status === 404 ? 'LM Studio not running or no model loaded' : errorText,
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate input tokens (system prompt + history + user message)
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = estimateTokens(inputText);

    // Create a transform stream that filters out <think> tags and tracks output
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = '';
    let inThinkTag = false;
    let totalOutputContent = ''; // Track all output for token counting

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Send any remaining buffer (shouldn't happen if tags are balanced)
              if (buffer && !inThinkTag) {
                totalOutputContent += buffer;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
                buffer = '';
              }

              // Calculate output tokens and deduct credits
              const outputTokens = estimateTokens(totalOutputContent);
              const totalTokens = inputTokens + outputTokens;

              // Deduct tokens in background (don't block response)
              deductTokens(userId, inputTokens, outputTokens, chatContext).catch(err => {
                console.error('Error deducting tokens:', err);
              });

              // Record dimension insights for activity tracking (fire and forget)
              // Skip casual messages as they don't represent growth work
              if (!isCasual && totalOutputContent) {
                recordChatInsights(userId, message, totalOutputContent, chatContext).catch(err => {
                  console.error('Error recording chat insights:', err);
                });
              }

              // Save assistant message to database if in standalone chat
              if (chatContext === 'standalone-chat' && activeConversationId && totalOutputContent) {
                prisma.chatMessage.create({
                  data: {
                    conversationId: activeConversationId,
                    role: 'assistant',
                    content: totalOutputContent,
                    inputTokens,
                    outputTokens,
                  },
                }).then(() => {
                  // Auto-generate title from first exchange if not set
                  return prisma.chatConversation.findUnique({
                    where: { id: activeConversationId },
                    select: { title: true },
                  });
                }).then(conv => {
                  if (conv && !conv.title && message) {
                    // Generate simple title from user's first message
                    const title = message.length > 50 ? message.slice(0, 47) + '...' : message;
                    return prisma.chatConversation.update({
                      where: { id: activeConversationId },
                      data: { title },
                    });
                  }
                }).catch(err => {
                  console.error('Error saving assistant message:', err);
                });
              }

              // Send final info including token usage
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                done: true,
                stance,
                conversationId: activeConversationId,
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
                // Add to buffer and process
                buffer += content;

                // Process buffer to filter out <think>...</think> tags
                while (true) {
                  if (inThinkTag) {
                    // Look for closing </think>
                    const closeIndex = buffer.indexOf('</think>');
                    if (closeIndex !== -1) {
                      // Found closing tag, skip everything up to and including it
                      buffer = buffer.slice(closeIndex + 8);
                      inThinkTag = false;
                    } else {
                      // Still inside think tag, don't output anything
                      break;
                    }
                  } else {
                    // Look for opening <think>
                    const openIndex = buffer.indexOf('<think>');
                    if (openIndex !== -1) {
                      // Output everything before the think tag
                      const before = buffer.slice(0, openIndex);
                      if (before) {
                        totalOutputContent += before;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: before })}\n\n`));
                      }
                      buffer = buffer.slice(openIndex + 7);
                      inThinkTag = true;
                    } else {
                      // Check if we might be in the middle of a <think> tag
                      // Keep last 6 chars in buffer in case "<think" is split across chunks
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
        // Send any remaining buffer that's not in a think tag
        if (buffer && !inThinkTag) {
          totalOutputContent += buffer;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
        }
      }
    });

    // Pipe the response through our transform
    const readable = response.body?.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat stream API error:', error);
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
