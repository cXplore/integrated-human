/**
 * Conversation Memory Management
 *
 * Handles long conversation summarization, theme extraction,
 * and maintaining context across extended chats.
 */

import { prisma } from './prisma';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

// Threshold for when to trigger summarization
const SUMMARIZATION_THRESHOLD = 20; // messages before summarization kicks in
const ACTIVE_CONTEXT_SIZE = 10; // messages to keep in active context

export interface ConversationSummary {
  summary: string;
  keyThemes: string[];
  unresolvedTopics: string[];
  emotionalArc: {
    startMood: string;
    currentMood: string;
    trajectory: 'improving' | 'stable' | 'declining' | 'fluctuating';
  };
  breakthroughs: string[];
  messageCount: number;
}

export interface ConversationMemory {
  summary: ConversationSummary | null;
  activeMessages: Array<{ role: string; content: string }>;
  needsSummarization: boolean;
}

/**
 * Get conversation memory with summary + active context
 */
export async function getConversationMemory(
  conversationId: string
): Promise<ConversationMemory> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    return {
      summary: null,
      activeMessages: [],
      needsSummarization: false,
    };
  }

  const messageCount = conversation.messages.length;
  const needsSummarization = messageCount > SUMMARIZATION_THRESHOLD && !conversation.summary;

  // Parse existing summary if present
  let summary: ConversationSummary | null = null;
  if (conversation.summary) {
    try {
      summary = {
        summary: conversation.summary,
        keyThemes: JSON.parse(conversation.keyThemes || '[]'),
        unresolvedTopics: JSON.parse(conversation.unresolvedTopics || '[]'),
        emotionalArc: JSON.parse(conversation.emotionalArc || '{}'),
        breakthroughs: [],
        messageCount: conversation.summaryUpToIndex || 0,
      };
    } catch {
      // Invalid JSON, treat as no summary
    }
  }

  // Get active messages (last N messages after the summarized portion)
  const startIndex = conversation.summaryUpToIndex || 0;
  const activeMessages = conversation.messages
    .slice(startIndex)
    .slice(-ACTIVE_CONTEXT_SIZE)
    .map(m => ({ role: m.role, content: m.content }));

  return {
    summary,
    activeMessages,
    needsSummarization,
  };
}

/**
 * Build context string from memory for AI prompt
 */
export function buildMemoryContextString(memory: ConversationMemory): string {
  if (!memory.summary) {
    return '';
  }

  const parts: string[] = ['\n## Conversation History Summary'];

  parts.push(`Earlier in this conversation: ${memory.summary.summary}`);

  if (memory.summary.keyThemes.length > 0) {
    parts.push(`Key themes explored: ${memory.summary.keyThemes.join(', ')}`);
  }

  if (memory.summary.unresolvedTopics.length > 0) {
    parts.push(`Still exploring: ${memory.summary.unresolvedTopics.join(', ')}`);
  }

  if (memory.summary.emotionalArc?.trajectory) {
    const arc = memory.summary.emotionalArc;
    parts.push(`Emotional journey: Started ${arc.startMood}, now ${arc.currentMood} (${arc.trajectory})`);
  }

  if (memory.summary.breakthroughs.length > 0) {
    parts.push(`Breakthroughs so far: ${memory.summary.breakthroughs.join('; ')}`);
  }

  parts.push('\nThe recent messages continue from this context.');

  return parts.join('\n');
}

/**
 * Summarize older messages in a conversation
 */
export async function summarizeConversation(
  conversationId: string
): Promise<ConversationSummary | null> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation || conversation.messages.length < SUMMARIZATION_THRESHOLD) {
    return null;
  }

  // Get messages to summarize (all except last ACTIVE_CONTEXT_SIZE)
  const messagesToSummarize = conversation.messages.slice(
    0,
    -ACTIVE_CONTEXT_SIZE
  );

  if (messagesToSummarize.length === 0) {
    return null;
  }

  // Format messages for summarization
  const messageText = messagesToSummarize
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const systemPrompt = `You are analyzing a conversation to create a concise summary for context continuity.

Extract:
1. A 2-3 sentence summary of what was discussed
2. Key themes (max 5 keywords/phrases)
3. Unresolved topics still being explored (max 3)
4. Emotional arc: starting mood, current mood, trajectory (improving/stable/declining/fluctuating)
5. Any breakthroughs or insights the user had (max 3)

Respond in this exact JSON format:
{
  "summary": "Brief summary of the conversation...",
  "keyThemes": ["theme1", "theme2"],
  "unresolvedTopics": ["topic still being explored"],
  "emotionalArc": {
    "startMood": "anxious",
    "currentMood": "calmer",
    "trajectory": "improving"
  },
  "breakthroughs": ["Realized that..."]
}`;

  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Summarize this conversation:\n\n${messageText}` },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Failed to summarize conversation:', response.status);
      return null;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Strip think tags if present
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from summary response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const summary: ConversationSummary = {
      summary: parsed.summary || '',
      keyThemes: parsed.keyThemes || [],
      unresolvedTopics: parsed.unresolvedTopics || [],
      emotionalArc: parsed.emotionalArc || { startMood: 'unknown', currentMood: 'unknown', trajectory: 'stable' },
      breakthroughs: parsed.breakthroughs || [],
      messageCount: messagesToSummarize.length,
    };

    // Save to database
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        summary: summary.summary,
        summaryUpToIndex: messagesToSummarize.length,
        keyThemes: JSON.stringify(summary.keyThemes),
        unresolvedTopics: JSON.stringify(summary.unresolvedTopics),
        emotionalArc: JSON.stringify(summary.emotionalArc),
      },
    });

    return summary;
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return null;
  }
}

/**
 * Update summary when conversation continues
 * Called after new messages are added to a summarized conversation
 */
export async function updateConversationSummary(
  conversationId: string
): Promise<void> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) return;

  const messagesSinceSummary = conversation.messages.length - (conversation.summaryUpToIndex || 0);

  // Re-summarize if we've accumulated enough new messages
  if (messagesSinceSummary >= SUMMARIZATION_THRESHOLD) {
    await summarizeConversation(conversationId);
  }
}

/**
 * Detect themes from a single conversation for cross-conversation analysis
 */
export async function detectConversationThemes(
  conversationId: string
): Promise<string[]> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        where: { role: 'user' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!conversation || conversation.messages.length === 0) {
    return [];
  }

  // Simple keyword-based theme detection
  const THEME_KEYWORDS: Record<string, string[]> = {
    'relationships': ['relationship', 'partner', 'friend', 'family', 'connection', 'lonely'],
    'anxiety': ['anxious', 'worry', 'fear', 'panic', 'nervous', 'stressed'],
    'self-worth': ['not good enough', 'worthless', 'failure', 'inadequate', 'imposter'],
    'boundaries': ['boundary', 'boundaries', 'saying no', 'people pleasing', 'overcommit'],
    'grief': ['loss', 'grief', 'mourning', 'death', 'passed away', 'miss them'],
    'purpose': ['purpose', 'meaning', 'direction', 'lost', 'what am i doing'],
    'shadow-work': ['shadow', 'dark side', 'parts of me', 'shame', 'hidden'],
    'healing': ['healing', 'trauma', 'recover', 'process', 'working through'],
    'growth': ['growth', 'change', 'becoming', 'evolving', 'learning'],
    'authenticity': ['authentic', 'true self', 'mask', 'pretending', 'real me'],
  };

  const userText = conversation.messages.map(m => m.content.toLowerCase()).join(' ');
  const detectedThemes: string[] = [];

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(kw => userText.includes(kw))) {
      detectedThemes.push(theme);
    }
  }

  return detectedThemes.slice(0, 5);
}

/**
 * Update keyThemes for a conversation after new messages
 */
export async function updateConversationThemes(
  conversationId: string
): Promise<string[]> {
  const themes = await detectConversationThemes(conversationId);

  if (themes.length > 0) {
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { keyThemes: JSON.stringify(themes) },
    }).catch(err => {
      console.error('Error updating conversation themes:', err);
    });
  }

  return themes;
}

/**
 * Analyze patterns across multiple conversations
 */
export async function analyzeConversationPatterns(
  userId: string,
  lookbackDays: number = 30
): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const conversations = await prisma.chatConversation.findMany({
    where: {
      userId,
      updatedAt: { gte: since },
    },
    include: {
      messages: {
        where: { role: 'user' },
        take: 20,
      },
    },
  });

  if (conversations.length < 3) {
    return; // Not enough data for pattern detection
  }

  // Aggregate themes across conversations
  const themeOccurrences: Record<string, { count: number; conversationIds: string[] }> = {};

  for (const conv of conversations) {
    const themes = await detectConversationThemes(conv.id);
    for (const theme of themes) {
      if (!themeOccurrences[theme]) {
        themeOccurrences[theme] = { count: 0, conversationIds: [] };
      }
      themeOccurrences[theme].count++;
      themeOccurrences[theme].conversationIds.push(conv.id);
    }
  }

  // Record recurring themes as insights
  for (const [theme, data] of Object.entries(themeOccurrences)) {
    if (data.count >= 3) {
      // Theme appears in 3+ conversations = recurring pattern
      await prisma.conversationInsight.upsert({
        where: {
          id: `${userId}-recurring-${theme}`, // Pseudo unique
        },
        update: {
          strength: Math.min(10, data.count),
          occurrences: data.count,
          lastSeen: new Date(),
          conversationIds: JSON.stringify(data.conversationIds.slice(-10)),
        },
        create: {
          userId,
          insightType: 'recurring-theme',
          insight: `You frequently explore "${theme}" in your conversations. This seems to be an important area for you.`,
          strength: Math.min(10, data.count),
          occurrences: data.count,
          conversationIds: JSON.stringify(data.conversationIds.slice(-10)),
        },
      }).catch(() => {
        // Ignore upsert conflicts - not critical
      });
    }
  }
}
