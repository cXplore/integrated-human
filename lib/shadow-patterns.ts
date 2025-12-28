/**
 * Shadow Pattern Recognition
 *
 * Detects unconscious patterns, defense mechanisms, and shadow aspects
 * from user conversations. These are aspects of self that users may not
 * be fully aware of.
 *
 * This is a sensitive feature - insights are offered gently and only
 * when there's sufficient evidence.
 */

import { prisma } from './prisma';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';

export type ShadowPatternType =
  | 'projection'
  | 'denial'
  | 'rationalization'
  | 'displacement'
  | 'reaction-formation'
  | 'suppression'
  | 'idealization'
  | 'splitting'
  | 'avoidance'
  | 'people-pleasing'
  | 'perfectionism'
  | 'control'
  | 'self-sabotage'
  | 'victim-pattern'
  | 'rescuer-pattern';

export interface ShadowPattern {
  type: ShadowPatternType;
  indicators: string[];
  description: string;
  potentialRoot: string;
  invitationForReflection: string;
  strength: number; // 1-10
}

// Shadow pattern indicators - keywords/phrases that may indicate unconscious patterns
const SHADOW_INDICATORS: Array<{
  pattern: RegExp;
  type: ShadowPatternType;
  indicator: string;
  weight: number;
}> = [
  // Projection - attributing own feelings to others
  { pattern: /\b(they'?re? (so|always|really|just))\b.*\b(angry|jealous|controlling|insecure|needy)\b/i, type: 'projection', indicator: 'attributing feelings to others', weight: 2 },
  { pattern: /\b(everyone|people) (thinks?|says?|believes?|always)\b/i, type: 'projection', indicator: 'generalizing others\' views', weight: 1 },
  { pattern: /\b(he|she|they) makes? me (feel|think|act)\b/i, type: 'projection', indicator: 'attributing responsibility to others', weight: 1.5 },

  // Denial
  { pattern: /\b(i'?m (fine|okay|good)|it'?s (fine|okay|nothing|not a big deal))\b.*\b(but|although|even though)\b/i, type: 'denial', indicator: 'minimizing while contradicting', weight: 2 },
  { pattern: /\b(doesn'?t (bother|affect|matter to) me)\b.*\b(i (just|mean|think))\b/i, type: 'denial', indicator: 'dismissing while elaborating', weight: 1.5 },
  { pattern: /\b(i'?m (not|never) (angry|jealous|scared|hurt))\b.*\b(i (just|only))\b/i, type: 'denial', indicator: 'negating emotions while explaining', weight: 2 },

  // Rationalization
  { pattern: /\b(makes (sense|perfect sense)|logical|reasonable) (because|since|that)\b/i, type: 'rationalization', indicator: 'over-intellectualizing emotions', weight: 1 },
  { pattern: /\b(i had (to|no choice)|there was no other (way|option))\b/i, type: 'rationalization', indicator: 'removing agency in decisions', weight: 1.5 },
  { pattern: /\b(anyone would|who wouldn'?t|it'?s (normal|natural) to)\b/i, type: 'rationalization', indicator: 'normalizing to avoid responsibility', weight: 1.5 },

  // Avoidance
  { pattern: /\b(let'?s (not|change|talk about something else))\b/i, type: 'avoidance', indicator: 'topic shifting', weight: 2 },
  { pattern: /\b(i don'?t (want|like) to (think|talk|go there) about)\b/i, type: 'avoidance', indicator: 'explicit avoidance', weight: 2.5 },
  { pattern: /\b(too (painful|hard|difficult|much) to (talk|think|deal with))\b/i, type: 'avoidance', indicator: 'stating topic is too difficult', weight: 1.5 },

  // People-pleasing
  { pattern: /\b(what (will|would) (they|people|everyone) think)\b/i, type: 'people-pleasing', indicator: 'excessive concern with others\' opinions', weight: 2 },
  { pattern: /\b(i (just|always) want (them|everyone|people) to (be happy|like me))\b/i, type: 'people-pleasing', indicator: 'prioritizing others\' happiness', weight: 2 },
  { pattern: /\b(i can'?t say no|hard (for me )?to say no)\b/i, type: 'people-pleasing', indicator: 'difficulty with boundaries', weight: 2.5 },
  { pattern: /\b(i (don'?t want to|hate to) (bother|burden|disappoint))\b/i, type: 'people-pleasing', indicator: 'fear of being a burden', weight: 2 },

  // Perfectionism
  { pattern: /\b((has|have) to be perfect|not good enough|should (be|have|do) (better|more))\b/i, type: 'perfectionism', indicator: 'impossible standards', weight: 2 },
  { pattern: /\b(i (always|never) (mess up|fail|make mistakes))\b/i, type: 'perfectionism', indicator: 'all-or-nothing thinking', weight: 1.5 },
  { pattern: /\b(if i (can'?t|don'?t) do it (perfectly|right), (why|what'?s the point))\b/i, type: 'perfectionism', indicator: 'perfectionism paralysis', weight: 2.5 },

  // Control
  { pattern: /\b(i need to (control|manage|handle|fix) (everything|this|it all))\b/i, type: 'control', indicator: 'need for control', weight: 2 },
  { pattern: /\b(if (only )?i (had|could have) (controlled|managed|prevented))\b/i, type: 'control', indicator: 'retrospective control wishes', weight: 1.5 },
  { pattern: /\b(can'?t (stand|handle|deal with) (uncertainty|not knowing|chaos))\b/i, type: 'control', indicator: 'intolerance of uncertainty', weight: 2 },

  // Self-sabotage
  { pattern: /\b(i (always|keep) (mess(ing)? up|ruin(ing)?|destroy(ing)?))\b/i, type: 'self-sabotage', indicator: 'pattern of self-defeat', weight: 2.5 },
  { pattern: /\b(every time (i get close|things are going well), (i|something))\b/i, type: 'self-sabotage', indicator: 'success avoidance pattern', weight: 2 },
  { pattern: /\b(i don'?t deserve|not worthy of|shouldn'?t have)\b/i, type: 'self-sabotage', indicator: 'unworthiness beliefs', weight: 2 },

  // Victim pattern
  { pattern: /\b((this|it|everything) always happens to me)\b/i, type: 'victim-pattern', indicator: 'external locus of control', weight: 2 },
  { pattern: /\b(i (have|had) no (choice|control|power|say))\b/i, type: 'victim-pattern', indicator: 'learned helplessness', weight: 1.5 },
  { pattern: /\b(why (does this|do bad things) (always )?happen to me)\b/i, type: 'victim-pattern', indicator: 'personalization of events', weight: 2 },

  // Rescuer pattern
  { pattern: /\b(i (need|have) to (save|fix|help|rescue) (them|him|her|everyone))\b/i, type: 'rescuer-pattern', indicator: 'compulsive helping', weight: 2 },
  { pattern: /\b(they (need|can'?t do it without) me)\b/i, type: 'rescuer-pattern', indicator: 'indispensability belief', weight: 2 },
  { pattern: /\b(if i don'?t (help|do it|step in), (no one|who) will)\b/i, type: 'rescuer-pattern', indicator: 'over-responsibility', weight: 2 },

  // Splitting (black and white thinking)
  { pattern: /\b(always|never|everyone|no one|completely|totally)\b/i, type: 'splitting', indicator: 'absolute language', weight: 0.5 },
  { pattern: /\b((he|she|they|it)'?s (either|all) (good|bad|right|wrong))\b/i, type: 'splitting', indicator: 'polarized view', weight: 2 },
];

// Pattern descriptions for insights
const PATTERN_INFO: Record<ShadowPatternType, {
  description: string;
  potentialRoot: string;
  invitation: string;
}> = {
  'projection': {
    description: 'Attributing your own feelings or qualities to others',
    potentialRoot: 'Often develops when certain emotions feel unsafe to own',
    invitation: 'When you notice strong feelings about others\' qualities, could these reflect something in yourself?',
  },
  'denial': {
    description: 'Minimizing or dismissing feelings that feel threatening to acknowledge',
    potentialRoot: 'Usually learned when expressing certain emotions wasn\'t safe',
    invitation: 'What might happen if you gave yourself permission to feel what you\'re minimizing?',
  },
  'rationalization': {
    description: 'Using logic to avoid emotional truths',
    potentialRoot: 'Often develops in environments where emotions were dismissed or intellectualized',
    invitation: 'Beneath the logical explanation, what emotion might be waiting to be felt?',
  },
  'avoidance': {
    description: 'Steering away from topics or feelings that feel threatening',
    potentialRoot: 'Develops as protection when facing certain truths felt overwhelming',
    invitation: 'What would it mean to approach what you\'re avoiding, very gently?',
  },
  'people-pleasing': {
    description: 'Prioritizing others\' needs and approval over your own',
    potentialRoot: 'Often develops when love or safety was conditional on meeting others\' expectations',
    invitation: 'What do you need that you\'ve been putting aside for others?',
  },
  'perfectionism': {
    description: 'Setting impossibly high standards as protection against criticism or failure',
    potentialRoot: 'Often develops when love felt conditional on performance',
    invitation: 'What would "good enough" feel like, and what fear arises when you consider it?',
  },
  'control': {
    description: 'Needing to manage situations and outcomes to feel safe',
    potentialRoot: 'Often develops from early experiences of chaos or unpredictability',
    invitation: 'What would it feel like to let something be outside your control, just for a moment?',
  },
  'self-sabotage': {
    description: 'Unconsciously undermining your own success or happiness',
    potentialRoot: 'Often develops when success felt dangerous or brought unwanted attention',
    invitation: 'What might you be protecting yourself from by not succeeding?',
  },
  'victim-pattern': {
    description: 'Seeing yourself as powerless in situations where you have more agency than you realize',
    potentialRoot: 'Often develops when your power was truly limited or when agency was punished',
    invitation: 'In this situation, what small choice might you actually have?',
  },
  'rescuer-pattern': {
    description: 'Compulsively helping others, often at your own expense',
    potentialRoot: 'Often develops when your worth was tied to being useful or needed',
    invitation: 'What happens inside you when you imagine letting someone struggle without stepping in?',
  },
  'displacement': {
    description: 'Redirecting emotions from their true target to a safer one',
    potentialRoot: 'Develops when expressing feelings toward certain people wasn\'t safe',
    invitation: 'Who or what might these feelings really be about?',
  },
  'reaction-formation': {
    description: 'Expressing the opposite of what you truly feel',
    potentialRoot: 'Develops when certain feelings were unacceptable',
    invitation: 'What would happen if you allowed the opposite feeling to exist?',
  },
  'suppression': {
    description: 'Consciously pushing away unwanted thoughts or feelings',
    potentialRoot: 'Develops as a coping strategy for overwhelming experiences',
    invitation: 'What might happen if you let these thoughts have a little space?',
  },
  'idealization': {
    description: 'Seeing someone or something as all-good, avoiding their complexity',
    potentialRoot: 'Often develops as a way to maintain needed attachments',
    invitation: 'What complexity might you be avoiding seeing?',
  },
  'splitting': {
    description: 'Seeing things in black-and-white terms without nuance',
    potentialRoot: 'Often develops when the world felt unpredictable and categories felt safer',
    invitation: 'What shade of gray might exist between these extremes?',
  },
};

/**
 * Detect shadow patterns in a message
 */
export function detectShadowPatterns(message: string): ShadowPattern[] {
  const lowerMessage = message.toLowerCase();
  const patternScores: Map<ShadowPatternType, { score: number; indicators: string[] }> = new Map();

  // Check all indicators
  for (const { pattern, type, indicator, weight } of SHADOW_INDICATORS) {
    if (pattern.test(lowerMessage)) {
      const existing = patternScores.get(type) || { score: 0, indicators: [] };
      existing.score += weight;
      if (!existing.indicators.includes(indicator)) {
        existing.indicators.push(indicator);
      }
      patternScores.set(type, existing);
    }
  }

  // Convert to shadow patterns (only include those with sufficient evidence)
  const patterns: ShadowPattern[] = [];

  for (const [type, data] of patternScores.entries()) {
    if (data.score >= 2 && data.indicators.length >= 1) {
      const info = PATTERN_INFO[type];
      patterns.push({
        type,
        indicators: data.indicators,
        description: info.description,
        potentialRoot: info.potentialRoot,
        invitationForReflection: info.invitation,
        strength: Math.min(10, Math.round(data.score * 2)),
      });
    }
  }

  // Sort by strength
  patterns.sort((a, b) => b.strength - a.strength);

  return patterns.slice(0, 3); // Return top 3 at most
}

/**
 * Analyze patterns across multiple messages in a conversation
 */
export async function analyzeConversationShadowPatterns(
  conversationId: string
): Promise<ShadowPattern[]> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        where: { role: 'user' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!conversation || conversation.messages.length < 3) {
    return [];
  }

  // Combine all user messages
  const combinedText = conversation.messages.map(m => m.content).join(' ');

  return detectShadowPatterns(combinedText);
}

/**
 * Record shadow pattern insights for a user
 */
export async function recordShadowInsight(
  userId: string,
  pattern: ShadowPattern
): Promise<void> {
  const insightId = `${userId}-shadow-${pattern.type}`;

  await prisma.conversationInsight.upsert({
    where: { id: insightId },
    update: {
      strength: pattern.strength,
      lastSeen: new Date(),
      occurrences: { increment: 1 },
    },
    create: {
      id: insightId,
      userId,
      insightType: 'shadow-pattern',
      insight: `Pattern noticed: ${pattern.description}. ${pattern.invitationForReflection}`,
      evidence: pattern.indicators.join('; '),
      strength: pattern.strength,
    },
  }).catch(err => {
    console.error('Error recording shadow insight:', err);
  });
}

/**
 * Get shadow patterns for a user (across all conversations)
 */
export async function getUserShadowPatterns(
  userId: string
): Promise<Array<{
  type: string;
  insight: string;
  strength: number;
  occurrences: number;
  lastSeen: Date;
}>> {
  const insights = await prisma.conversationInsight.findMany({
    where: {
      userId,
      insightType: 'shadow-pattern',
    },
    orderBy: [{ strength: 'desc' }, { occurrences: 'desc' }],
    take: 10,
  });

  return insights.map(i => ({
    type: i.id.replace(`${userId}-shadow-`, ''),
    insight: i.insight,
    strength: i.strength,
    occurrences: i.occurrences,
    lastSeen: i.lastSeen,
  }));
}

/**
 * Build shadow pattern context for AI prompt
 * Only included when patterns are strong and recurring
 */
export function buildShadowPatternContext(
  patterns: Array<{ type: string; strength: number; occurrences: number }>
): string {
  const significantPatterns = patterns.filter(p => p.strength >= 5 && p.occurrences >= 3);

  if (significantPatterns.length === 0) {
    return '';
  }

  const parts: string[] = ['\n## Gentle Awareness (for your consideration, not direct mention)'];
  parts.push('This user may benefit from gentle exploration of:');

  for (const p of significantPatterns.slice(0, 2)) {
    const info = PATTERN_INFO[p.type as ShadowPatternType];
    if (info) {
      parts.push(`- ${info.description}`);
    }
  }

  parts.push('\nApproach with curiosity, not interpretation. Let insights emerge from their own reflection.');

  return parts.join('\n');
}

/**
 * Analyze and record shadow patterns after a conversation exchange
 */
export async function processShadowPatterns(
  userId: string,
  userMessage: string
): Promise<ShadowPattern[]> {
  const patterns = detectShadowPatterns(userMessage);

  // Only record significant patterns (strength >= 4)
  for (const pattern of patterns.filter(p => p.strength >= 4)) {
    await recordShadowInsight(userId, pattern);
  }

  return patterns;
}
