/**
 * Real-time Trigger & Preference Learning
 *
 * Learns user triggers and preferences from conversations in real-time.
 * Updates the TriggerPattern and ChatPreference tables based on detected signals.
 */

import { prisma } from './prisma';

// Trigger detection patterns
const TRIGGER_PATTERNS: Array<{
  pattern: RegExp;
  trigger: string;
  context: string;
  intensity: number;
}> = [
  // Relationship triggers
  { pattern: /\b(abandon|left me|walked away|rejected|ghosted)\b/i, trigger: 'abandonment', context: 'Fear of being left or abandoned', intensity: 4 },
  { pattern: /\b(reject|rejection|turned down|not good enough)\b/i, trigger: 'rejection', context: 'Sensitivity to rejection', intensity: 4 },
  { pattern: /\b(betrayed?|backstab|lied to me|deceived)\b/i, trigger: 'betrayal', context: 'Trust violation trauma', intensity: 5 },
  { pattern: /\b(control|controlling|manipulat|gasligh)\b/i, trigger: 'control/manipulation', context: 'Experience with controlling behavior', intensity: 4 },

  // Self-worth triggers
  { pattern: /\b(not (good )?enough|failure|worthless|inadequate|imposter)\b/i, trigger: 'inadequacy', context: 'Self-worth struggles', intensity: 4 },
  { pattern: /\b(criticism|criticized|judged|judging me)\b/i, trigger: 'criticism', context: 'Sensitivity to criticism', intensity: 3 },
  { pattern: /\b(shame|ashamed|embarrass|humiliat)\b/i, trigger: 'shame', context: 'Shame sensitivity', intensity: 4 },
  { pattern: /\b(disappoint|let (them|everyone|people) down)\b/i, trigger: 'disappointing others', context: 'Fear of disappointing people', intensity: 3 },

  // Trauma triggers
  { pattern: /\b(trauma|traumatic|ptsd|flashback)\b/i, trigger: 'trauma', context: 'General trauma sensitivity', intensity: 5 },
  { pattern: /\b(abuse|abused|abusive)\b/i, trigger: 'abuse history', context: 'Abuse experience', intensity: 5 },
  { pattern: /\b(loss|grief|passed away|died|death)\b/i, trigger: 'loss/grief', context: 'Grief and loss', intensity: 4 },
  { pattern: /\b(panic|panic attack|can't breathe|heart racing)\b/i, trigger: 'panic/anxiety', context: 'Anxiety/panic experiences', intensity: 4 },

  // Conflict triggers
  { pattern: /\b(conflict|argument|fight|yelling|screaming)\b/i, trigger: 'conflict', context: 'Sensitivity to conflict', intensity: 3 },
  { pattern: /\b(anger|angry|rage|furious)\b/i, trigger: 'anger', context: 'Anger-related topics', intensity: 3 },

  // Vulnerability triggers
  { pattern: /\b(vulnerable|exposed|defenseless|unsafe)\b/i, trigger: 'vulnerability', context: 'Discomfort with vulnerability', intensity: 3 },
  { pattern: /\b(out of control|helpless|powerless|trapped)\b/i, trigger: 'loss of control', context: 'Fear of losing control', intensity: 4 },
];

// Preference signals in user messages
const PREFERENCE_SIGNALS: Array<{
  pattern: RegExp;
  category: string;
  preference: string;
  strength: number;
}> = [
  // Response style preferences
  { pattern: /\b(just tell me straight|be direct|don't sugarcoat)\b/i, category: 'response-style', preference: 'prefers direct, honest feedback', strength: 4 },
  { pattern: /\b(gently|softly|carefully|ease into)\b/i, category: 'response-style', preference: 'prefers gentle approach', strength: 4 },
  { pattern: /\b(short|brief|concise|get to the point)\b/i, category: 'response-style', preference: 'prefers brief responses', strength: 4 },
  { pattern: /\b(detail|elaborate|explain more|go deeper)\b/i, category: 'response-style', preference: 'prefers detailed exploration', strength: 4 },

  // Tone preferences
  { pattern: /\b(warm|caring|supportive|compassionate)\b/i, category: 'tone', preference: 'responds to warm, compassionate tone', strength: 3 },
  { pattern: /\b(practical|solution|action|what (can|should) i do)\b/i, category: 'tone', preference: 'prefers practical, action-oriented guidance', strength: 4 },
  { pattern: /\b(metaphor|analogy|like when|it's like)\b/i, category: 'tone', preference: 'resonates with metaphors and analogies', strength: 3 },
  { pattern: /\b(ground me|grounding|stay present|here and now)\b/i, category: 'tone', preference: 'benefits from grounding techniques', strength: 4 },

  // Depth preferences
  { pattern: /\b(surface|simple|not too deep|overwhelm)\b/i, category: 'depth', preference: 'prefers surface-level exploration initially', strength: 3 },
  { pattern: /\b(root|underlying|deeper|core|childhood)\b/i, category: 'depth', preference: 'ready for deeper exploration', strength: 4 },
  { pattern: /\b(pattern|recurring|always|keep doing)\b/i, category: 'depth', preference: 'interested in pattern recognition', strength: 3 },

  // Feedback preferences
  { pattern: /\b(call me out|challenge|push me|hold me accountable)\b/i, category: 'feedback-style', preference: 'wants to be challenged', strength: 5 },
  { pattern: /\b(validate|hear me|just listen|not looking for advice)\b/i, category: 'feedback-style', preference: 'sometimes just needs to be heard', strength: 4 },
  { pattern: /\b(reflect back|mirror|what you heard)\b/i, category: 'feedback-style', preference: 'appreciates reflective responses', strength: 3 },
];

// Positive feedback signals (when user likes a response)
const POSITIVE_FEEDBACK_PATTERNS: Array<{
  pattern: RegExp;
  reinforces: string;
  category: string;
}> = [
  { pattern: /\b(that (helps|helped)|thank you|exactly|yes!|perfect)\b/i, reinforces: 'current approach is effective', category: 'response-style' },
  { pattern: /\b(never thought of it that way|good point|you're right)\b/i, reinforces: 'insights are valued', category: 'depth' },
  { pattern: /\b(i feel (seen|heard|understood)|you get me)\b/i, reinforces: 'empathetic responses work', category: 'tone' },
  { pattern: /\b(i (can|could) try that|let me think about that)\b/i, reinforces: 'suggestions are being considered', category: 'feedback-style' },
];

// Negative feedback signals (when user doesn't like a response)
const NEGATIVE_FEEDBACK_PATTERNS: Array<{
  pattern: RegExp;
  avoid: string;
  category: string;
}> = [
  { pattern: /\b(that's not (helpful|it)|you're not (getting|understanding))\b/i, avoid: 'current approach isn\'t resonating', category: 'response-style' },
  { pattern: /\b(too (much|deep|intense|overwhelming))\b/i, avoid: 'needs lighter approach sometimes', category: 'depth' },
  { pattern: /\b(don't lecture|stop telling me|i know that already)\b/i, avoid: 'don\'t be preachy', category: 'tone' },
  { pattern: /\b(you don't (understand|get it)|missing the point)\b/i, avoid: 'needs more careful listening', category: 'feedback-style' },
];

export interface LearningResult {
  triggersDetected: Array<{ trigger: string; intensity: number }>;
  preferencesDetected: Array<{ category: string; preference: string }>;
  feedbackSignals: Array<{ type: 'positive' | 'negative'; signal: string }>;
}

/**
 * Detect triggers and preferences from a user message
 */
export function detectLearningSignals(
  userMessage: string,
  aiResponse?: string
): LearningResult {
  const lowerMessage = userMessage.toLowerCase();
  const result: LearningResult = {
    triggersDetected: [],
    preferencesDetected: [],
    feedbackSignals: [],
  };

  // Detect triggers
  for (const { pattern, trigger, intensity } of TRIGGER_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      result.triggersDetected.push({ trigger, intensity });
    }
  }

  // Detect preferences
  for (const { pattern, category, preference, strength } of PREFERENCE_SIGNALS) {
    if (pattern.test(lowerMessage)) {
      result.preferencesDetected.push({ category, preference });
    }
  }

  // Detect feedback signals (both positive and negative)
  for (const { pattern, reinforces } of POSITIVE_FEEDBACK_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      result.feedbackSignals.push({ type: 'positive', signal: reinforces });
    }
  }

  for (const { pattern, avoid } of NEGATIVE_FEEDBACK_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      result.feedbackSignals.push({ type: 'negative', signal: avoid });
    }
  }

  return result;
}

/**
 * Record learned triggers and preferences to the database
 */
export async function recordLearnings(
  userId: string,
  signals: LearningResult
): Promise<void> {
  const updates: Promise<unknown>[] = [];

  // Record triggers
  for (const { trigger, intensity } of signals.triggersDetected) {
    const triggerContext = TRIGGER_PATTERNS.find(t => t.trigger === trigger)?.context;

    updates.push(
      prisma.triggerPattern.upsert({
        where: {
          userId_trigger: { userId, trigger },
        },
        update: {
          occurrenceCount: { increment: 1 },
          intensity: { increment: Math.min(5 - intensity, 1) }, // Increase intensity up to 5
          updatedAt: new Date(),
        },
        create: {
          userId,
          trigger,
          intensity,
          context: triggerContext,
        },
      }).catch(err => {
        console.error('Error upserting trigger:', err);
      })
    );
  }

  // Record preferences
  for (const { category, preference } of signals.preferencesDetected) {
    updates.push(
      prisma.chatPreference.upsert({
        where: {
          userId_category_preference: { userId, category, preference },
        },
        update: {
          strength: { increment: 1 },
          confidence: { increment: 5 },
          updatedAt: new Date(),
        },
        create: {
          userId,
          category,
          preference,
          strength: 3,
          confidence: 50,
          source: 'inferred',
        },
      }).catch(err => {
        console.error('Error upserting preference:', err);
      })
    );
  }

  // Record positive feedback - reinforce recent preferences
  for (const { signal } of signals.feedbackSignals.filter(f => f.type === 'positive')) {
    // Boost confidence in recent preferences of this category
    updates.push(
      prisma.chatPreference.updateMany({
        where: {
          userId,
          updatedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 minutes
        },
        data: {
          confidence: { increment: 10 },
        },
      }).catch(() => {})
    );
  }

  // Record negative feedback - reduce confidence in recent approaches
  for (const { signal } of signals.feedbackSignals.filter(f => f.type === 'negative')) {
    updates.push(
      prisma.chatPreference.updateMany({
        where: {
          userId,
          updatedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
        data: {
          confidence: { decrement: 5 },
        },
      }).catch(() => {})
    );
  }

  await Promise.all(updates);
}

/**
 * Main function to process learning from a conversation exchange
 */
export async function learnFromExchange(
  userId: string,
  userMessage: string,
  aiResponse?: string
): Promise<LearningResult> {
  const signals = detectLearningSignals(userMessage, aiResponse);

  if (
    signals.triggersDetected.length > 0 ||
    signals.preferencesDetected.length > 0 ||
    signals.feedbackSignals.length > 0
  ) {
    await recordLearnings(userId, signals);
  }

  return signals;
}

/**
 * Get user's learned trigger profile
 */
export async function getUserTriggerProfile(
  userId: string
): Promise<Array<{
  trigger: string;
  intensity: number;
  occurrenceCount: number;
  preferredResponse: string | null;
}>> {
  const triggers = await prisma.triggerPattern.findMany({
    where: { userId },
    orderBy: [{ intensity: 'desc' }, { occurrenceCount: 'desc' }],
    take: 15,
    select: {
      trigger: true,
      intensity: true,
      occurrenceCount: true,
      preferredResponse: true,
    },
  });

  return triggers;
}

/**
 * Get user's learned preferences
 */
export async function getUserPreferences(
  userId: string
): Promise<Array<{
  category: string;
  preference: string;
  strength: number;
  confidence: number;
}>> {
  const preferences = await prisma.chatPreference.findMany({
    where: {
      userId,
      confidence: { gte: 30 },
    },
    orderBy: [{ confidence: 'desc' }, { strength: 'desc' }],
    take: 20,
    select: {
      category: true,
      preference: true,
      strength: true,
      confidence: true,
    },
  });

  return preferences;
}
