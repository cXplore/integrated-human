import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAllCourses } from '@/lib/courses';
import { getAllPractices } from '@/lib/practices';
import { buildUserContext, type UserJourneyContext } from '@/lib/presence';
import { calculateTokenCost } from '@/lib/subscriptions';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, safeJsonParse } from '@/lib/sanitize';
import { recordBulkActivities } from '@/lib/assessment/activity-tracker';
import { DIMENSION_CONTENT_MAP } from '@/lib/assessment/content-mapping';
import type { PillarId } from '@/lib/assessment/types';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'qwen/qwen3-32b';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function checkCredits(userId: string): Promise<{ hasCredits: boolean; balance: number }> {
  const credits = await prisma.aICredits.findUnique({ where: { userId } });
  if (!credits) return { hasCredits: false, balance: 0 };
  return { hasCredits: credits.tokenBalance > 0, balance: credits.tokenBalance };
}

async function deductTokens(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
  const totalTokens = inputTokens + outputTokens;
  const cost = calculateTokenCost(inputTokens, outputTokens);

  const credits = await prisma.aICredits.findUnique({ where: { userId } });

  if (credits) {
    const monthlyAvailable = Math.max(0, credits.monthlyTokens - credits.monthlyUsed);
    const monthlyDeduction = Math.min(monthlyAvailable, totalTokens);
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

  await prisma.aIUsage.create({
    data: {
      userId,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      model: LM_STUDIO_MODEL,
      context: 'where-im-stuck',
    },
  });
}

// =============================================================================
// HEALTH CONTEXT
// =============================================================================

interface HealthContext {
  hasAssessment: boolean;
  lowestDimensions: Array<{
    pillarId: string;
    dimensionId: string;
    dimensionName: string;
    score: number;
    stage: string;
  }>;
  overallStage: string;
  suggestedFocus: string[];
}

const DIMENSION_NAMES: Record<string, Record<string, string>> = {
  mind: {
    'emotional-regulation': 'Emotional Regulation',
    'cognitive-flexibility': 'Cognitive Flexibility',
    'self-awareness': 'Self-Awareness',
    'present-moment': 'Present Moment Awareness',
    'thought-patterns': 'Thought Patterns',
    'psychological-safety': 'Psychological Safety',
    'self-relationship': 'Self-Relationship',
    'meaning-purpose': 'Meaning & Purpose',
  },
  body: {
    'interoception': 'Body Awareness',
    'stress-physiology': 'Stress Management',
    'sleep-restoration': 'Sleep & Rest',
    'energy-vitality': 'Energy & Vitality',
    'movement-capacity': 'Movement',
    'nourishment': 'Nourishment',
    'embodied-presence': 'Embodied Presence',
  },
  soul: {
    'authenticity': 'Authenticity',
    'existential-grounding': 'Existential Grounding',
    'transcendence': 'Transcendence',
    'shadow-integration': 'Shadow Integration',
    'creative-expression': 'Creative Expression',
    'life-engagement': 'Life Engagement',
    'inner-wisdom': 'Inner Wisdom',
    'spiritual-practice': 'Spiritual Practice',
  },
  relationships: {
    'attachment-patterns': 'Attachment Patterns',
    'communication': 'Communication',
    'boundaries': 'Boundaries',
    'conflict-repair': 'Conflict & Repair',
    'trust-vulnerability': 'Trust & Vulnerability',
    'empathy-attunement': 'Empathy & Attunement',
    'intimacy-depth': 'Intimacy & Depth',
    'social-connection': 'Social Connection',
    'relational-patterns': 'Relational Patterns',
  },
};

async function getUserHealthContext(userId: string): Promise<HealthContext | null> {
  try {
    // Get dimension health data
    const dimensionHealth = await prisma.dimensionHealth.findMany({
      where: { userId },
      orderBy: { verifiedScore: 'asc' },
    });

    if (dimensionHealth.length === 0) {
      return {
        hasAssessment: false,
        lowestDimensions: [],
        overallStage: 'unknown',
        suggestedFocus: [],
      };
    }

    // Get lowest 5 dimensions
    const lowestDimensions = dimensionHealth.slice(0, 5).map(d => ({
      pillarId: d.pillarId,
      dimensionId: d.dimensionId,
      dimensionName: DIMENSION_NAMES[d.pillarId]?.[d.dimensionId] || d.dimensionId,
      score: d.verifiedScore,
      stage: d.stage,
    }));

    // Determine overall stage from lowest dimensions
    const stages = lowestDimensions.map(d => d.stage);
    const stageOrder = ['collapse', 'regulation', 'integration', 'embodiment', 'optimization'];
    const lowestStage = stages.reduce((lowest, current) => {
      return stageOrder.indexOf(current) < stageOrder.indexOf(lowest) ? current : lowest;
    }, 'optimization');

    // Suggest focus areas based on lowest dimensions
    const suggestedFocus = lowestDimensions.slice(0, 3).map(d => d.dimensionName);

    return {
      hasAssessment: true,
      lowestDimensions,
      overallStage: lowestStage,
      suggestedFocus,
    };
  } catch (error) {
    console.error('Error fetching health context:', error);
    return null;
  }
}

async function getUserJourneyContext(userId: string): Promise<UserJourneyContext | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        courseProgress: { where: { completed: true }, select: { courseSlug: true } },
        articleProgress: { where: { completed: true }, take: 10, select: { slug: true } },
      },
    });

    if (!user) return null;

    const context: UserJourneyContext = {
      name: user.name || undefined,
      completedCourses: [...new Set(user.courseProgress.map(cp => cp.courseSlug))],
      recentArticles: user.articleProgress.map(ap => ap.slug),
    };

    if (user.profile) {
      context.primaryIntention = user.profile.primaryIntention || undefined;
      context.lifeSituation = user.profile.lifeSituation || undefined;
      if (user.profile.currentChallenges) {
        context.currentChallenges = safeJsonParse(user.profile.currentChallenges, []);
      }
    }

    return context;
  } catch (error) {
    console.error('Error fetching user context:', error);
    return null;
  }
}

// =============================================================================
// CONTENT CATALOG WITH DIMENSION AWARENESS
// =============================================================================

function buildContentCatalog(healthContext: HealthContext | null): string {
  const courses = getAllCourses();
  const practices = getAllPractices();

  // If we have health context, prioritize content for low-scoring dimensions
  let prioritizedCourses = courses;
  let priorityNote = '';

  if (healthContext?.hasAssessment && healthContext.lowestDimensions.length > 0) {
    const lowDimensions = new Set(
      healthContext.lowestDimensions.map(d => `${d.pillarId}:${d.dimensionId}`)
    );

    // Mark courses that address low-scoring dimensions
    prioritizedCourses = courses.map(c => {
      // Check if course addresses any low dimension
      let priority = false;
      for (const [pillarId, dimensions] of Object.entries(DIMENSION_CONTENT_MAP)) {
        for (const [dimensionId, content] of Object.entries(dimensions)) {
          if (lowDimensions.has(`${pillarId}:${dimensionId}`)) {
            if (content.courses.includes(c.slug)) {
              priority = true;
              break;
            }
          }
        }
        if (priority) break;
      }
      return { ...c, priority };
    });

    // Sort priority courses first
    prioritizedCourses.sort((a, b) => {
      if ((a as any).priority && !(b as any).priority) return -1;
      if (!(a as any).priority && (b as any).priority) return 1;
      return 0;
    });

    priorityNote = `\n\nNOTE: Courses marked with [PRIORITY] address the user's lowest-scoring dimensions. Prefer these when relevant to their struggle.`;
  }

  const courseCatalog = prioritizedCourses.slice(0, 35).map(c => {
    const priorityMark = (c as any).priority ? '[PRIORITY] ' : '';
    return `- ${priorityMark}${c.metadata.title} (${c.slug}): ${c.metadata.description}${c.metadata.tags ? ` [${c.metadata.tags.join(', ')}]` : ''}`;
  }).join('\n');

  const practiceCatalog = practices.map(p =>
    `- ${p.metadata.title} (${p.slug}): ${p.metadata.description} [Helps with: ${p.metadata.helpssWith.join(', ')}]`
  ).join('\n');

  return `
AVAILABLE COURSES:
${courseCatalog}

AVAILABLE PRACTICES:
${practiceCatalog}

ARTICLE CATEGORIES (articles are available on these topics):
- Shadow work, archetypes (masculine: King, Warrior, Magician, Lover; feminine: Queen, Mother, Maiden, Huntress, Mystic, Wild Woman)
- Attachment styles (anxious, avoidant, disorganized, secure)
- Nervous system regulation (polyvagal theory, freeze/fight/flight)
- Relationships, communication, boundaries
- Emotions, grief, anger, fear
- Meaning, purpose, spirituality
- Body, embodiment, breathwork
${priorityNote}`;
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

function buildStuckPrompt(contentCatalog: string, healthContext: HealthContext | null, userContext?: string): string {
  let healthSection = '';

  if (healthContext?.hasAssessment && healthContext.lowestDimensions.length > 0) {
    const lowestList = healthContext.lowestDimensions
      .map(d => `- ${d.dimensionName} (${d.pillarId}): ${d.score}/100, stage: ${d.stage}`)
      .join('\n');

    healthSection = `
---
USER'S INTEGRATION HEALTH (from assessment):
Current developmental stage: ${healthContext.overallStage}
Lowest-scoring dimensions:
${lowestList}

Suggested focus areas: ${healthContext.suggestedFocus.join(', ')}

IMPORTANT: Use this health data to inform your recommendations. If their struggle relates to one of their low-scoring dimensions, acknowledge that connection. Recommend content that addresses both their stated struggle AND their underlying growth areas.
---
`;
  } else {
    healthSection = `
---
NOTE: This user hasn't completed their Integration Assessment yet. You might gently mention that taking the assessment could help identify their specific growth areas.
---
`;
  }

  return `You are a guide helping people find the right resources for where they're stuck in their personal growth journey.

Your role: When someone describes what they're struggling with, you:
1. Acknowledge their experience briefly (1-2 sentences)
2. If health data is available, note if their struggle connects to known growth areas
3. Offer insight into what might be happening (1-2 sentences)
4. Recommend 2-3 specific resources from the catalog below that would help
5. Explain briefly why each recommendation fits their situation

Be direct and practical. Don't be preachy or give lengthy explanations.

${healthSection}

${contentCatalog}

RESPONSE FORMAT:
Return your response in this exact format:

[Your acknowledgment and insight - 2-3 sentences max. If relevant, connect to their health data.]

RECOMMENDATIONS:

1. **[Title]** (type: course|practice|article, slug: the-slug-here)
   Why: [1 sentence explanation]

2. **[Title]** (type: course|practice|article, slug: the-slug-here)
   Why: [1 sentence explanation]

3. **[Title]** (type: course|practice|article, slug: the-slug-here)
   Why: [1 sentence explanation]

[Optional: One sentence of encouragement or invitation to start]

For articles, use descriptive slugs based on topic (e.g., "anxious-attachment-patterns", "working-with-anger").

${userContext || ''}`;
}

// =============================================================================
// DIMENSION DETECTION FOR ACTIVITY TRACKING
// =============================================================================

interface StuckDimensionInsight {
  pillarId: PillarId;
  dimensionId: string;
  reason: string;
}

const STUCK_DIMENSION_KEYWORDS: Record<string, { pillarId: PillarId; dimensionId: string }> = {
  // Mind
  'emotion': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'anxious': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'anxiety': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'overwhelm': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'pattern': { pillarId: 'mind', dimensionId: 'self-awareness' },
  'awareness': { pillarId: 'mind', dimensionId: 'self-awareness' },
  'critic': { pillarId: 'mind', dimensionId: 'thought-patterns' },
  'ruminate': { pillarId: 'mind', dimensionId: 'thought-patterns' },
  'safe': { pillarId: 'mind', dimensionId: 'psychological-safety' },
  'meaning': { pillarId: 'mind', dimensionId: 'meaning-purpose' },
  'purpose': { pillarId: 'mind', dimensionId: 'meaning-purpose' },

  // Soul
  'authentic': { pillarId: 'soul', dimensionId: 'authenticity' },
  'shadow': { pillarId: 'soul', dimensionId: 'shadow-integration' },
  'numb': { pillarId: 'soul', dimensionId: 'life-engagement' },
  'disconnected': { pillarId: 'soul', dimensionId: 'life-engagement' },

  // Relationships
  'attachment': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'unavailable': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'boundary': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'boundaries': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'conflict': { pillarId: 'relationships', dimensionId: 'conflict-repair' },
  'trust': { pillarId: 'relationships', dimensionId: 'trust-vulnerability' },

  // Body
  'stress': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'burnout': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'exhausted': { pillarId: 'body', dimensionId: 'energy-vitality' },
};

function detectStuckDimensions(stuckDescription: string): StuckDimensionInsight[] {
  const text = stuckDescription.toLowerCase();
  const detected = new Map<string, StuckDimensionInsight>();

  for (const [keyword, dimension] of Object.entries(STUCK_DIMENSION_KEYWORDS)) {
    if (text.includes(keyword)) {
      const key = `${dimension.pillarId}:${dimension.dimensionId}`;
      if (!detected.has(key)) {
        detected.set(key, {
          ...dimension,
          reason: `Stuck query about ${keyword}`,
        });
      }
    }
    if (detected.size >= 2) break;
  }

  return Array.from(detected.values());
}

async function recordStuckInsights(userId: string, stuckDescription: string): Promise<void> {
  try {
    const insights = detectStuckDimensions(stuckDescription);
    if (insights.length > 0) {
      await recordBulkActivities(
        userId,
        insights.map(insight => ({
          pillarId: insight.pillarId,
          dimensionId: insight.dimensionId,
          points: 1, // Just 1 point for asking about being stuck
          reason: insight.reason,
          activityType: 'stuck-query',
        }))
      );
    }
  } catch (error) {
    console.error('Failed to record stuck insights:', error);
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { stuckDescription: rawDescription } = await request.json();

    if (!rawDescription || typeof rawDescription !== 'string' || rawDescription.length < 10) {
      return new Response(JSON.stringify({ error: 'Please describe what you\'re stuck with (at least 10 characters)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize user input
    const { sanitized: stuckDescription, warnings } = sanitizeUserInput(rawDescription, { maxLength: 2000 });
    if (warnings.length > 0) {
      console.warn('Input sanitization warnings:', warnings);
    }

    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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
        JSON.stringify({ error: 'Insufficient credits', code: 'NO_CREDITS', balance: 0 }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get health context (new!)
    const healthContext = await getUserHealthContext(userId);

    // Build context
    const contentCatalog = buildContentCatalog(healthContext);
    let userContext = '';
    const journeyContext = await getUserJourneyContext(userId);
    if (journeyContext) {
      userContext = buildUserContext(journeyContext);
    }

    const systemPrompt = buildStuckPrompt(contentCatalog, healthContext, userContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `I'm stuck with: ${stuckDescription} /no_think` },
    ];

    // Record activity (fire and forget)
    recordStuckInsights(userId, stuckDescription).catch(console.error);

    // 30s timeout for LLM request
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
      const errorText = await response.text();
      console.error('LM Studio error:', errorText);
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
              }

              const outputTokens = estimateTokens(totalOutputContent);
              deductTokens(userId, inputTokens, outputTokens).catch(console.error);

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                done: true,
                hasHealthData: healthContext?.hasAssessment || false,
                usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, remainingBalance: balance - inputTokens - outputTokens },
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
            } catch { /* skip */ }
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

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error) {
    console.error('Stuck API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
