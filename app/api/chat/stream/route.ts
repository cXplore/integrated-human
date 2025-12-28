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
  type Stance,
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
import {
  getConversationMemory,
  buildMemoryContextString,
  updateConversationSummary,
  updateConversationThemes,
} from '@/lib/conversation-memory';
import {
  updateEmotionalArc,
  detectMoodFromMessage,
} from '@/lib/emotional-arc';
import { learnFromExchange } from '@/lib/realtime-learning';
import {
  processShadowPatterns,
  getUserShadowPatterns,
  buildShadowPatternContext,
} from '@/lib/shadow-patterns';
import {
  detectCrisisSignals,
  formatCrisisResources,
  shouldModifyPrompt,
  type CrisisSignal,
} from '@/lib/crisis-detection';
import type { PillarId } from '@/lib/assessment/types';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

// Rough token estimation (4 chars ≈ 1 token for English text)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Generate a clean, readable conversation title from the first message
 * Extracts the core topic rather than just truncating
 */
function generateConversationTitle(message: string): string {
  // Clean up the message
  let title = message.trim();

  // Remove common filler phrases at the start
  const fillerPhrases = [
    /^(hi,?\s*)?/i,
    /^(hello,?\s*)?/i,
    /^(hey,?\s*)?/i,
    /^i('m| am| have been| was| feel| think|'ve been)\s+/i,
    /^can you\s+(help me\s+)?(with\s+)?/i,
    /^i('d| would) like to\s+(talk about\s+)?/i,
    /^i need (help|to talk about|advice on)\s*/i,
    /^i want to\s+(understand|talk about|explore|work on)\s*/i,
    /^(so,?\s*)?/i,
  ];

  for (const phrase of fillerPhrases) {
    title = title.replace(phrase, '');
  }

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // Find a natural break point if too long
  if (title.length > 50) {
    // Try to break at punctuation
    const punctuationBreak = title.slice(0, 55).search(/[.!?,;:\-–—]/);
    if (punctuationBreak > 15) {
      title = title.slice(0, punctuationBreak);
    } else {
      // Break at last space before limit
      const lastSpace = title.slice(0, 47).lastIndexOf(' ');
      if (lastSpace > 20) {
        title = title.slice(0, lastSpace) + '...';
      } else {
        title = title.slice(0, 47) + '...';
      }
    }
  }

  // Clean up any trailing punctuation except ...
  title = title.replace(/[,;:\s]+$/, '');

  return title || 'New conversation';
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
 * Cross-feature context - recent data from other features the AI can reference
 */
interface CrossFeatureContext {
  recentJournalEntries?: Array<{ content: string; mood?: string; createdAt: Date }>;
  recentDreams?: Array<{ title?: string; symbols: string[]; emotions: string[]; createdAt: Date }>;
  recentCheckIns?: Array<{ mood: number; energy: number; note?: string; createdAt: Date }>;
  journalPatterns?: { frequentWords?: string[]; dominantMood?: string };
  dreamThemes?: { recurringSymbols?: string[]; emotionalLandscape?: string[] };
}

/**
 * AI learning context - triggers and preferences for personalized responses
 */
interface AILearningContext {
  triggers: Array<{
    trigger: string;
    intensity: number;
    preferredResponse: string | null;
  }>;
  preferences: Array<{
    category: string;
    preference: string;
    strength: number;
  }>;
}

// Mood level to label mapping
const MOOD_LABELS: Record<number, string> = {
  1: 'struggling',
  2: 'low',
  3: 'okay',
  4: 'good',
  5: 'great',
};

/**
 * Gather context from other features for AI memory
 * This allows the AI to reference what the user has been exploring
 */
async function getCrossFeatureContext(userId: string): Promise<CrossFeatureContext | null> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch recent journal entries (last 3 from past week)
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        content: true,
        mood: true,
        createdAt: true,
      },
    });

    // Fetch recent dreams (last 3 from past week)
    const dreams = await prisma.dreamEntry.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        title: true,
        symbols: true,
        emotions: true,
        createdAt: true,
      },
    });

    // Fetch recent check-ins (last 5 from past week)
    const checkIns = await prisma.quickCheckIn.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        mood: true,
        energy: true,
        note: true,
        createdAt: true,
      },
    });

    // Build context object
    const context: CrossFeatureContext = {};

    if (journalEntries.length > 0) {
      context.recentJournalEntries = journalEntries.map(e => ({
        content: e.content.slice(0, 300), // Truncate for context
        mood: e.mood || undefined,
        createdAt: e.createdAt,
      }));

      // Extract mood patterns
      const moods = journalEntries.filter(e => e.mood).map(e => e.mood as string);
      if (moods.length > 0) {
        const moodCounts = moods.reduce((acc, m) => ({ ...acc, [m]: (acc[m] || 0) + 1 }), {} as Record<string, number>);
        context.journalPatterns = {
          dominantMood: Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0],
        };
      }
    }

    if (dreams.length > 0) {
      context.recentDreams = dreams.map(d => ({
        title: d.title || undefined,
        symbols: safeJsonParse<string[]>(d.symbols, []).slice(0, 5),
        emotions: safeJsonParse<string[]>(d.emotions, []).slice(0, 3),
        createdAt: d.createdAt,
      }));

      // Extract recurring symbols
      const allSymbols = dreams.flatMap(d => safeJsonParse<string[]>(d.symbols, []));
      const symbolCounts = allSymbols.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {} as Record<string, number>);
      const recurringSymbols = Object.entries(symbolCounts)
        .filter(([, count]) => count > 1)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([symbol]) => symbol);

      const allEmotions = dreams.flatMap(d => safeJsonParse<string[]>(d.emotions, []));
      const uniqueEmotions = [...new Set(allEmotions)].slice(0, 5);

      if (recurringSymbols.length > 0 || uniqueEmotions.length > 0) {
        context.dreamThemes = {
          recurringSymbols: recurringSymbols.length > 0 ? recurringSymbols : undefined,
          emotionalLandscape: uniqueEmotions.length > 0 ? uniqueEmotions : undefined,
        };
      }
    }

    if (checkIns.length > 0) {
      context.recentCheckIns = checkIns.map(c => ({
        mood: c.mood,
        energy: c.energy,
        note: c.note || undefined,
        createdAt: c.createdAt,
      }));
    }

    // Return null if no context found
    if (Object.keys(context).length === 0) return null;

    return context;
  } catch (error) {
    console.error('Error fetching cross-feature context:', error);
    return null;
  }
}

/**
 * Fetch AI learning context (triggers and preferences)
 */
async function getAILearningContext(userId: string): Promise<AILearningContext | null> {
  try {
    // Fetch triggers (top 10 by intensity)
    const triggers = await prisma.triggerPattern.findMany({
      where: { userId },
      orderBy: [{ intensity: 'desc' }, { occurrenceCount: 'desc' }],
      take: 10,
      select: {
        trigger: true,
        intensity: true,
        preferredResponse: true,
      },
    });

    // Fetch preferences (top 15 by confidence)
    const preferences = await prisma.chatPreference.findMany({
      where: {
        userId,
        confidence: { gte: 40 }, // Only reasonably confident preferences
      },
      orderBy: [{ confidence: 'desc' }, { strength: 'desc' }],
      take: 15,
      select: {
        category: true,
        preference: true,
        strength: true,
      },
    });

    if (triggers.length === 0 && preferences.length === 0) {
      return null;
    }

    return { triggers, preferences };
  } catch (error) {
    console.error('Error fetching AI learning context:', error);
    return null;
  }
}

/**
 * Build AI learning context string for the prompt
 */
function buildAILearningContextString(context: AILearningContext): string {
  const parts: string[] = [];

  // Add trigger awareness
  if (context.triggers.length > 0) {
    parts.push('\n## Trigger Awareness');
    parts.push('Be mindful of these sensitive topics for this user:');

    // High intensity triggers (4-5)
    const highIntensity = context.triggers.filter(t => t.intensity >= 4);
    if (highIntensity.length > 0) {
      parts.push(`HIGH SENSITIVITY: ${highIntensity.map(t => t.trigger).join(', ')} - approach with extra care, offer grounding first.`);
    }

    // Triggers with preferred responses
    const withResponses = context.triggers.filter(t => t.preferredResponse);
    for (const t of withResponses) {
      parts.push(`- When "${t.trigger}" comes up: ${t.preferredResponse}`);
    }

    // Other triggers
    const otherTriggers = context.triggers.filter(t => t.intensity < 4 && !t.preferredResponse);
    if (otherTriggers.length > 0) {
      parts.push(`Also sensitive to: ${otherTriggers.map(t => t.trigger).join(', ')}`);
    }
  }

  // Add preferences
  if (context.preferences.length > 0) {
    parts.push('\n## User Preferences');
    parts.push('Learned preferences about how this user likes to interact:');

    // Group by category
    const byCategory: Record<string, string[]> = {};
    for (const pref of context.preferences) {
      if (!byCategory[pref.category]) {
        byCategory[pref.category] = [];
      }
      byCategory[pref.category].push(pref.preference);
    }

    const categoryLabels: Record<string, string> = {
      'response-style': 'Communication',
      'tone': 'Tone',
      'depth': 'Depth',
      'approach': 'Approach',
      'pacing': 'Pacing',
      'feedback-style': 'Feedback',
      'topics': 'Topics',
    };

    for (const [category, prefs] of Object.entries(byCategory)) {
      const label = categoryLabels[category] || category;
      parts.push(`- ${label}: ${prefs.join('; ')}`);
    }
  }

  if (parts.length <= 1) return '';

  parts.push('\nAdapt your responses to honor these preferences while remaining authentic.');
  return parts.join('\n');
}

/**
 * Build cross-feature context string for the AI
 */
function buildCrossFeatureContextString(context: CrossFeatureContext): string {
  const parts: string[] = [];

  if (context.recentCheckIns && context.recentCheckIns.length > 0) {
    const latestCheckIn = context.recentCheckIns[0];
    const daysAgo = Math.floor((Date.now() - latestCheckIn.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const moodLabel = MOOD_LABELS[latestCheckIn.mood] || `${latestCheckIn.mood}/5`;
    parts.push(`Recent check-in (${daysAgo === 0 ? 'today' : daysAgo + 'd ago'}): mood "${moodLabel}", energy ${latestCheckIn.energy}/5${latestCheckIn.note ? `. Note: "${latestCheckIn.note.slice(0, 100)}"` : ''}`);
  }

  if (context.recentJournalEntries && context.recentJournalEntries.length > 0) {
    const entry = context.recentJournalEntries[0];
    const daysAgo = Math.floor((Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    parts.push(`Recent journal (${daysAgo === 0 ? 'today' : daysAgo + 'd ago'})${entry.mood ? ` [${entry.mood}]` : ''}: "${entry.content.slice(0, 150)}..."`);
  }

  if (context.journalPatterns?.dominantMood) {
    parts.push(`Journal mood trend: ${context.journalPatterns.dominantMood}`);
  }

  if (context.recentDreams && context.recentDreams.length > 0) {
    const dream = context.recentDreams[0];
    const daysAgo = Math.floor((Date.now() - dream.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const dreamInfo = dream.title || `with symbols: ${dream.symbols.slice(0, 3).join(', ')}`;
    parts.push(`Recent dream (${daysAgo === 0 ? 'today' : daysAgo + 'd ago'}): ${dreamInfo}`);
  }

  if (context.dreamThemes?.recurringSymbols && context.dreamThemes.recurringSymbols.length > 0) {
    parts.push(`Recurring dream symbols: ${context.dreamThemes.recurringSymbols.join(', ')}`);
  }

  if (parts.length === 0) return '';

  return `

## Recent Activity Context
The user has been active in other areas of the site. You can reference this if relevant to the conversation:
${parts.map(p => `- ${p}`).join('\n')}

Use this context naturally when it connects to what the user is discussing. Don't force it if not relevant.`;
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

    // Get cross-feature context for AI memory (journal, dreams, check-ins)
    const crossFeatureContext = await getCrossFeatureContext(userId);
    const crossFeatureString = crossFeatureContext
      ? buildCrossFeatureContextString(crossFeatureContext)
      : '';

    // Get AI learning context (triggers and preferences)
    const aiLearningContext = await getAILearningContext(userId);
    const aiLearningString = aiLearningContext
      ? buildAILearningContextString(aiLearningContext)
      : '';

    // Get shadow pattern context (unconscious patterns for gentle awareness)
    const shadowPatterns = await getUserShadowPatterns(userId);
    const shadowPatternString = buildShadowPatternContext(shadowPatterns);

    // Get conversation memory (summary of older messages for long conversations)
    let memoryContextString = '';
    if (activeConversationId) {
      const conversationMemory = await getConversationMemory(activeConversationId);
      memoryContextString = buildMemoryContextString(conversationMemory);

      // Trigger background summarization if needed
      if (conversationMemory.needsSummarization) {
        updateConversationSummary(activeConversationId).catch(err => {
          console.error('Error updating conversation summary:', err);
        });
      }
    }

    // Build site context with health awareness
    const siteContext = healthContext
      ? buildDynamicContext({ articles: [], courses: [], practices: [] }, healthContext)
      : SITE_CONTEXT;

    // Detect crisis signals FIRST - this takes priority over all other processing
    const crisisSignal = detectCrisisSignals(message);
    const isInCrisis = shouldModifyPrompt(crisisSignal);

    // Check if it's a simple greeting/casual message
    const isCasual = isInCrisis ? false : isCasualMessage(message);

    // Detect stance - simplified to 5 modes: chill, supportive, hype, deep, grounding
    const stance: Stance = isInCrisis ? 'grounding' : detectStance(message);

    // Build the prompt - now unified and simpler
    let systemPrompt: string;
    if (isCasual) {
      systemPrompt = buildCasualPrompt();
    } else {
      // Combine user context and site context into additional context
      const additionalContext = [userContext, siteContext].filter(Boolean).join('\n');
      systemPrompt = buildSystemPrompt(stance, additionalContext || undefined);
    }

    // Append cross-feature context if available (even for casual messages)
    if (crossFeatureString) {
      systemPrompt += crossFeatureString;
    }

    // Append AI learning context (triggers and preferences) for non-casual messages
    if (!isCasual && aiLearningString) {
      systemPrompt += aiLearningString;
    }

    // Append shadow pattern awareness for deeper insight (only for non-casual)
    if (!isCasual && shadowPatternString) {
      systemPrompt += shadowPatternString;
    }

    // Append conversation memory context (summary of older messages)
    if (memoryContextString) {
      systemPrompt += memoryContextString;
    }

    // CRITICAL: Apply crisis protocol modifications if needed
    if (isInCrisis && crisisSignal.promptModification) {
      // Prepend crisis protocol to ensure it takes priority
      systemPrompt = crisisSignal.promptModification + '\n\n' + systemPrompt;
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
                    // Generate smarter title from user's first message
                    const title = generateConversationTitle(message);
                    return prisma.chatConversation.update({
                      where: { id: activeConversationId },
                      data: { title },
                    });
                  }
                }).then(() => {
                  // Update conversation mode based on stance
                  const modeMap: Record<string, string> = {
                    chill: 'casual',
                    supportive: 'support',
                    hype: 'celebration',
                    deep: 'growth',
                    grounding: 'crisis',
                  };
                  const newMode = modeMap[stance] || 'general';
                  return prisma.chatConversation.update({
                    where: { id: activeConversationId },
                    data: { mode: newMode },
                  });
                }).then(() => {
                  // Update conversation themes for cross-chat pattern tracking
                  return updateConversationThemes(activeConversationId);
                }).then(() => {
                  // Update emotional arc tracking
                  return updateEmotionalArc(activeConversationId);
                }).then(() => {
                  // Learn triggers and preferences from this exchange
                  return learnFromExchange(userId, message, totalOutputContent);
                }).then(() => {
                  // Process shadow patterns for deeper insights
                  return processShadowPatterns(userId, message);
                }).catch(err => {
                  console.error('Error saving assistant message:', err);
                });
              }

              // Send final info including token usage and crisis resources if applicable
              const finalData: Record<string, unknown> = {
                done: true,
                stance,
                conversationId: activeConversationId,
                usage: {
                  inputTokens,
                  outputTokens,
                  totalTokens,
                  remainingBalance: balance - totalTokens,
                },
              };

              // Include crisis resources in response metadata for UI to display
              if (isInCrisis && crisisSignal.resources.length > 0) {
                finalData.crisis = {
                  severity: crisisSignal.severity,
                  resources: crisisSignal.resources,
                };
              }

              // Include current mood detection for UI display
              const { mood: currentMood, intensity: moodIntensity } = detectMoodFromMessage(message);
              if (currentMood !== 'neutral') {
                finalData.emotionalState = {
                  mood: currentMood,
                  intensity: moodIntensity,
                };
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));
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
