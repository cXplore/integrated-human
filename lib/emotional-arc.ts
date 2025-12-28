/**
 * Emotional Arc Tracking
 *
 * Tracks the emotional trajectory within and across conversations.
 * Detects mood shifts, patterns, and provides insights.
 */

import { prisma } from './prisma';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

export type MoodCategory =
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'hopeless'
  | 'neutral'
  | 'curious'
  | 'hopeful'
  | 'calm'
  | 'joyful'
  | 'grateful'
  | 'empowered';

export type Trajectory = 'improving' | 'stable' | 'declining' | 'fluctuating';

export interface EmotionalArc {
  startMood: MoodCategory;
  currentMood: MoodCategory;
  trajectory: Trajectory;
  shifts: Array<{
    fromMood: MoodCategory;
    toMood: MoodCategory;
    trigger?: string;
    messageIndex: number;
  }>;
  dominantEmotion: MoodCategory;
  intensity: number; // 1-10
}

// Mood valence scores (negative to positive)
const MOOD_VALENCE: Record<MoodCategory, number> = {
  hopeless: -4,
  angry: -3,
  sad: -2,
  fearful: -2,
  anxious: -1,
  neutral: 0,
  curious: 1,
  calm: 2,
  hopeful: 3,
  grateful: 4,
  joyful: 4,
  empowered: 5,
};

// Keywords for quick mood detection
const MOOD_KEYWORDS: Record<MoodCategory, string[]> = {
  anxious: ['anxious', 'worried', 'nervous', 'stress', 'overwhelm', 'panic', 'tense'],
  sad: ['sad', 'depressed', 'down', 'unhappy', 'crying', 'tears', 'grief', 'mourn', 'lonely'],
  angry: ['angry', 'furious', 'rage', 'mad', 'pissed', 'frustrated', 'resentful', 'irritated'],
  fearful: ['scared', 'afraid', 'terrified', 'fear', 'frightened', 'dread'],
  hopeless: ['hopeless', 'no point', 'give up', 'worthless', 'nothing matters', 'can\'t go on'],
  neutral: ['okay', 'fine', 'alright', 'so-so', 'meh'],
  curious: ['wonder', 'curious', 'interested', 'exploring', 'thinking about'],
  hopeful: ['hope', 'maybe', 'possibly', 'optimistic', 'looking forward', 'might work'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'at ease', 'tranquil', 'centered'],
  joyful: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'wonderful', 'great'],
  grateful: ['grateful', 'thankful', 'appreciate', 'blessed', 'fortunate'],
  empowered: ['empowered', 'strong', 'capable', 'confident', 'powerful', 'ready', 'determined'],
};

/**
 * Detect mood from a single message using keyword analysis
 */
export function detectMoodFromMessage(message: string): { mood: MoodCategory; intensity: number } {
  const lowerMessage = message.toLowerCase();
  const moodScores: Partial<Record<MoodCategory, number>> = {};

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score++;
        // Boost for intensity words
        if (lowerMessage.includes(`very ${keyword}`) || lowerMessage.includes(`really ${keyword}`)) {
          score += 0.5;
        }
        if (lowerMessage.includes(`so ${keyword}`) || lowerMessage.includes(`extremely ${keyword}`)) {
          score += 1;
        }
      }
    }
    if (score > 0) {
      moodScores[mood as MoodCategory] = score;
    }
  }

  // Find dominant mood
  let maxScore = 0;
  let dominantMood: MoodCategory = 'neutral';

  for (const [mood, score] of Object.entries(moodScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantMood = mood as MoodCategory;
    }
  }

  // Calculate intensity (1-10)
  const intensity = Math.min(10, Math.max(1, Math.ceil(maxScore * 2) + 3));

  return { mood: dominantMood, intensity };
}

/**
 * Calculate trajectory from a series of moods
 */
export function calculateTrajectory(moods: MoodCategory[]): Trajectory {
  if (moods.length < 2) return 'stable';

  const valences = moods.map(m => MOOD_VALENCE[m]);
  const firstHalf = valences.slice(0, Math.ceil(valences.length / 2));
  const secondHalf = valences.slice(Math.ceil(valences.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  // Check for fluctuation
  let fluctuations = 0;
  for (let i = 1; i < valences.length; i++) {
    if (Math.abs(valences[i] - valences[i - 1]) >= 3) {
      fluctuations++;
    }
  }

  if (fluctuations >= moods.length / 3) {
    return 'fluctuating';
  }

  if (diff >= 1.5) return 'improving';
  if (diff <= -1.5) return 'declining';
  return 'stable';
}

/**
 * Analyze emotional arc for a conversation
 */
export async function analyzeEmotionalArc(
  conversationId: string
): Promise<EmotionalArc | null> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        where: { role: 'user' },
        orderBy: { createdAt: 'asc' },
        take: 30,
      },
    },
  });

  if (!conversation || conversation.messages.length < 2) {
    return null;
  }

  const moodSequence: Array<{ mood: MoodCategory; intensity: number; index: number }> = [];

  for (let i = 0; i < conversation.messages.length; i++) {
    const { mood, intensity } = detectMoodFromMessage(conversation.messages[i].content);
    moodSequence.push({ mood, intensity, index: i });
  }

  if (moodSequence.length === 0) {
    return null;
  }

  // Find mood shifts
  const shifts: EmotionalArc['shifts'] = [];
  for (let i = 1; i < moodSequence.length; i++) {
    const prev = moodSequence[i - 1];
    const curr = moodSequence[i];
    const valenceDiff = Math.abs(MOOD_VALENCE[curr.mood] - MOOD_VALENCE[prev.mood]);

    if (valenceDiff >= 2 || prev.mood !== curr.mood) {
      shifts.push({
        fromMood: prev.mood,
        toMood: curr.mood,
        messageIndex: curr.index,
      });
    }
  }

  // Find dominant emotion
  const moodCounts: Partial<Record<MoodCategory, number>> = {};
  for (const m of moodSequence) {
    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  }

  let dominantEmotion: MoodCategory = 'neutral';
  let maxCount = 0;
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = mood as MoodCategory;
    }
  }

  // Calculate average intensity
  const avgIntensity = Math.round(
    moodSequence.reduce((sum, m) => sum + m.intensity, 0) / moodSequence.length
  );

  const moods = moodSequence.map(m => m.mood);
  const trajectory = calculateTrajectory(moods);

  return {
    startMood: moodSequence[0].mood,
    currentMood: moodSequence[moodSequence.length - 1].mood,
    trajectory,
    shifts,
    dominantEmotion,
    intensity: avgIntensity,
  };
}

/**
 * Update emotional arc for a conversation after new messages
 */
export async function updateEmotionalArc(
  conversationId: string
): Promise<EmotionalArc | null> {
  const arc = await analyzeEmotionalArc(conversationId);

  if (arc) {
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        emotionalArc: JSON.stringify({
          startMood: arc.startMood,
          currentMood: arc.currentMood,
          trajectory: arc.trajectory,
        }),
      },
    }).catch(err => {
      console.error('Error updating emotional arc:', err);
    });
  }

  return arc;
}

/**
 * Get emotional arc context for AI prompt
 */
export function buildEmotionalArcContext(arc: EmotionalArc): string {
  const parts: string[] = ['\n## Emotional Context'];

  parts.push(`User started this conversation feeling ${arc.startMood} and is currently ${arc.currentMood}.`);

  if (arc.trajectory === 'improving') {
    parts.push('Their emotional state has been improving through the conversation.');
  } else if (arc.trajectory === 'declining') {
    parts.push('Their emotional state seems to be declining - consider offering more support.');
  } else if (arc.trajectory === 'fluctuating') {
    parts.push('Their emotions have been fluctuating - maintain a steady, grounding presence.');
  }

  if (arc.shifts.length > 0) {
    const recentShift = arc.shifts[arc.shifts.length - 1];
    parts.push(`Most recent shift: from ${recentShift.fromMood} to ${recentShift.toMood}.`);
  }

  return parts.join('\n');
}

/**
 * Analyze emotional patterns across multiple conversations using AI
 */
export async function analyzeEmotionalPatterns(
  userId: string,
  lookbackDays: number = 30
): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const conversations = await prisma.chatConversation.findMany({
    where: {
      userId,
      updatedAt: { gte: since },
      emotionalArc: { not: null },
    },
    select: {
      emotionalArc: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (conversations.length < 3) return;

  const arcs: Array<{
    startMood: MoodCategory;
    currentMood: MoodCategory;
    trajectory: Trajectory;
    date: Date;
  }> = [];

  for (const conv of conversations) {
    if (conv.emotionalArc) {
      try {
        const parsed = JSON.parse(conv.emotionalArc);
        arcs.push({
          startMood: parsed.startMood,
          currentMood: parsed.currentMood,
          trajectory: parsed.trajectory,
          date: conv.createdAt,
        });
      } catch {
        // Skip invalid
      }
    }
  }

  // Analyze patterns
  const startMoods = arcs.map(a => a.startMood);
  const endMoods = arcs.map(a => a.currentMood);
  const trajectories = arcs.map(a => a.trajectory);

  // Find recurring start mood
  const startMoodCounts: Partial<Record<MoodCategory, number>> = {};
  for (const m of startMoods) {
    startMoodCounts[m] = (startMoodCounts[m] || 0) + 1;
  }

  // Find dominant entry mood
  let dominantEntryMood: MoodCategory = 'neutral';
  let maxEntryCount = 0;
  for (const [mood, count] of Object.entries(startMoodCounts)) {
    if (count > maxEntryCount) {
      maxEntryCount = count;
      dominantEntryMood = mood as MoodCategory;
    }
  }

  // Track improvement rate
  const improvingCount = trajectories.filter(t => t === 'improving').length;
  const improvementRate = improvingCount / trajectories.length;

  // Record insights
  if (maxEntryCount >= 3) {
    await prisma.conversationInsight.upsert({
      where: { id: `${userId}-emotional-entry` },
      update: {
        insight: `You often start conversations feeling ${dominantEntryMood}. Recognizing this pattern can help you understand your emotional rhythms.`,
        strength: Math.min(10, maxEntryCount),
        occurrences: maxEntryCount,
        lastSeen: new Date(),
      },
      create: {
        userId,
        insightType: 'emotional-pattern',
        insight: `You often start conversations feeling ${dominantEntryMood}. Recognizing this pattern can help you understand your emotional rhythms.`,
        strength: Math.min(10, maxEntryCount),
        occurrences: maxEntryCount,
      },
    }).catch(() => {});
  }

  if (improvementRate >= 0.6) {
    await prisma.conversationInsight.upsert({
      where: { id: `${userId}-emotional-improvement` },
      update: {
        insight: `Conversations often leave you feeling better than when you started (${Math.round(improvementRate * 100)}% improvement rate). These reflections are working for you.`,
        strength: Math.round(improvementRate * 10),
        lastSeen: new Date(),
      },
      create: {
        userId,
        insightType: 'emotional-pattern',
        insight: `Conversations often leave you feeling better than when you started (${Math.round(improvementRate * 100)}% improvement rate). These reflections are working for you.`,
        strength: Math.round(improvementRate * 10),
      },
    }).catch(() => {});
  }
}
