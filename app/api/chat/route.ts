import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  detectStance,
  isCasualMessage,
  buildCasualPrompt,
  buildSystemPrompt,
  buildDynamicContext,
  type ContentSummary,
  type UserHealthContext,
} from '@/lib/presence';
import { calculateTokenCost } from '@/lib/subscriptions';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeUserInput, sanitizeMessageHistory } from '@/lib/sanitize';
import { getAllPosts } from '@/lib/posts';
import { getAllCourses } from '@/lib/courses';
import { getAllPractices } from '@/lib/practices';
import { getOrCreateHealth, type Pillar } from '@/lib/integration-health';
import { safeJsonParse } from '@/lib/sanitize';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

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
  outputTokens: number
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
      context: 'chat',
    },
  });
}

/**
 * Gather content context for the AI
 */
function getContentContext(): ContentSummary {
  const posts = getAllPosts();
  const courses = getAllCourses();
  const practices = getAllPractices();

  return {
    articles: posts.map(p => ({
      title: p.metadata.title,
      category: p.metadata.categories[0] || 'General',
      slug: p.slug,
    })),
    courses: courses.map(c => ({
      title: c.metadata.title,
      category: c.metadata.category,
      slug: c.slug,
    })),
    practices: practices.map(p => ({
      title: p.metadata.title,
      category: p.metadata.category,
      slug: p.slug,
    })),
  };
}

/**
 * Gather user health context for personalization
 */
async function getUserHealthContext(userId: string): Promise<UserHealthContext | undefined> {
  try {
    const [health, assessments, quickCheckIns] = await Promise.all([
      getOrCreateHealth(userId).catch(() => null),
      prisma.assessmentResult.findMany({
        where: { userId },
        select: { type: true, results: true },
      }),
      prisma.quickCheckIn.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { mood: true, energy: true },
      }),
    ]);

    if (!health) return undefined;

    // Find lowest pillar
    const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
    let lowestPillar: Pillar = 'mind';
    let lowestScore = 100;
    let inCollapse = false;

    for (const pillar of pillars) {
      if (health.pillars[pillar].score < lowestScore) {
        lowestScore = health.pillars[pillar].score;
        lowestPillar = pillar;
      }
      if (health.pillars[pillar].stage === 'collapse') {
        inCollapse = true;
      }
    }

    // Parse assessment data
    let nervousSystemState: string | undefined;
    let attachmentStyle: string | undefined;

    for (const assessment of assessments) {
      const results = safeJsonParse<{ state?: string; style?: string }>(assessment.results, {});
      if (assessment.type === 'nervous-system' && results.state) {
        nervousSystemState = results.state;
      }
      if (assessment.type === 'attachment' && results.style) {
        attachmentStyle = results.style;
      }
    }

    // Calculate recent mood/energy averages
    let recentMood: number | undefined;
    let recentEnergy: number | undefined;
    if (quickCheckIns.length > 0) {
      const avgMood = quickCheckIns.reduce((sum, c) => sum + c.mood, 0) / quickCheckIns.length;
      const avgEnergy = quickCheckIns.reduce((sum, c) => sum + c.energy, 0) / quickCheckIns.length;
      recentMood = Math.round(avgMood);
      recentEnergy = Math.round(avgEnergy);
    }

    return {
      stage: health.overall.stage,
      lowestPillar,
      inCollapse,
      nervousSystemState,
      attachmentStyle,
      recentMood,
      recentEnergy,
    };
  } catch (error) {
    console.error('Error gathering health context:', error);
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limit by user
    const rateLimit = checkRateLimit(`chat:${userId}`, RATE_LIMITS.chat);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Check credits before proceeding
    const { hasCredits, balance } = await checkCredits(userId);
    if (!hasCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          code: 'NO_CREDITS',
          message: 'You\'ve run out of AI credits. Purchase more to continue.',
          balance: 0,
        },
        { status: 402 }
      );
    }

    const body = await request.json();
    const { message: rawMessage, history: rawHistory = [] } = body;

    if (!rawMessage || typeof rawMessage !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Sanitize user input
    const { sanitized: message, warnings } = sanitizeUserInput(rawMessage, { maxLength: 4000 });
    const history = sanitizeMessageHistory(rawHistory);
    if (warnings.length > 0) {
      console.warn('Chat input sanitization warnings:', warnings);
    }

    // Detect stance and build appropriate prompt
    const isCasual = isCasualMessage(message);
    const stance = isCasual ? 'chill' : detectStance(message);

    // Build dynamic context with content and health info (only for non-casual messages)
    let systemPrompt: string;
    if (isCasual) {
      systemPrompt = buildCasualPrompt();
    } else {
      // Get content context (cached in memory, fast)
      const contentContext = getContentContext();

      // Get user health context (async, uses DB)
      const healthContext = await getUserHealthContext(userId);

      // Build dynamic context string
      const dynamicContext = buildDynamicContext(contentContext, healthContext);

      systemPrompt = buildSystemPrompt(stance, dynamicContext);
    }

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

    // Calculate input tokens for billing
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = estimateTokens(inputText);

    // Call LM Studio with 30s timeout
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
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'AI request timed out' },
          { status: 504 }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error('LM Studio error:', response.status);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '';
    // Strip any think tags from reasoning models
    aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Calculate output tokens and deduct credits
    const outputTokens = estimateTokens(aiResponse);
    const totalTokens = inputTokens + outputTokens;

    // Deduct tokens (don't block response on this)
    deductTokens(userId, inputTokens, outputTokens).catch(err => {
      console.error('Error deducting tokens:', err);
    });

    return NextResponse.json({
      response: aiResponse,
      stance,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        remainingBalance: balance - totalTokens,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
