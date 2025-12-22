import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAllCourses } from '@/lib/courses';
import { getAllPractices } from '@/lib/practices';
import { getAllPosts } from '@/lib/posts';
import { buildUserContext, type UserJourneyContext } from '@/lib/presence';
import { calculateTokenCost } from '@/lib/subscriptions';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, safeJsonParse } from '@/lib/sanitize';

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

function buildContentCatalog(): string {
  const courses = getAllCourses();
  const practices = getAllPractices();
  // Posts would be too many to include, so we'll let AI generate general article topics

  const courseCatalog = courses.slice(0, 30).map(c => ({
    type: 'course',
    slug: c.slug,
    title: c.metadata.title,
    description: c.metadata.description,
    category: c.metadata.category,
    tags: c.metadata.tags,
  }));

  const practiceCatalog = practices.map(p => ({
    type: 'practice',
    slug: p.slug,
    title: p.metadata.title,
    description: p.metadata.description,
    category: p.metadata.category,
    helpssWith: p.metadata.helpssWith,
  }));

  return `
AVAILABLE COURSES:
${courseCatalog.map(c => `- ${c.title} (${c.slug}): ${c.description}${c.tags ? ` [${c.tags.join(', ')}]` : ''}`).join('\n')}

AVAILABLE PRACTICES:
${practiceCatalog.map(p => `- ${p.title} (${p.slug}): ${p.description} [Helps with: ${p.helpssWith.join(', ')}]`).join('\n')}

ARTICLE CATEGORIES (articles are available on these topics):
- Shadow work, archetypes (masculine: King, Warrior, Magician, Lover; feminine: Queen, Mother, Maiden, Huntress, Mystic, Wild Woman)
- Attachment styles (anxious, avoidant, disorganized, secure)
- Nervous system regulation (polyvagal theory, freeze/fight/flight)
- Relationships, communication, boundaries
- Emotions, grief, anger, fear
- Meaning, purpose, spirituality
- Body, embodiment, breathwork
`;
}

function buildStuckPrompt(contentCatalog: string, userContext?: string): string {
  return `You are a guide helping people find the right resources for where they're stuck in their personal growth journey.

Your role: When someone describes what they're struggling with, you:
1. Acknowledge their experience briefly (1-2 sentences)
2. Offer insight into what might be happening (1-2 sentences)
3. Recommend 2-3 specific resources from the catalog below that would help
4. Explain briefly why each recommendation fits their situation

Be direct and practical. Don't be preachy or give lengthy explanations.

${contentCatalog}

RESPONSE FORMAT:
Return your response in this exact format:

[Your acknowledgment and insight - 2-3 sentences max]

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

    // Build context
    const contentCatalog = buildContentCatalog();
    let userContext = '';
    const journeyContext = await getUserJourneyContext(userId);
    if (journeyContext) {
      userContext = buildUserContext(journeyContext);
    }

    const systemPrompt = buildStuckPrompt(contentCatalog, userContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `I'm stuck with: ${stuckDescription} /no_think` },
    ];

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
