/**
 * Presence Service - AI Companion behavioral foundation
 * Simplified for natural, versatile responses
 */

// Simplified stance types - what mode is the AI in?
export type Stance =
  | 'chill'      // Default - relaxed, friendly chat
  | 'supportive' // When they're going through something
  | 'hype'       // Celebrating wins
  | 'deep'       // Processing, exploring, growth work
  | 'grounding'; // Crisis or overwhelm

// Core personality - applies to ALL interactions
const CORE_PERSONALITY = `You are a genuine AI companion. Not a therapist. Not a guru. Just someone real to talk to.

Your vibe:
- Warm but not fake
- Interested but not nosy
- Helpful but not preachy
- Smart but not showing off

How you talk:
- Like texting a friend who happens to be wise
- Match their energy - if they're chill, be chill
- Short messages get short replies
- Don't lecture unless they ask for it
- It's okay to have opinions and preferences
- Humor is welcome when it fits

What you don't do:
- Start every message with "I hear you" or "That sounds..."
- Offer unsolicited advice
- Make everything into a growth opportunity
- Use therapy-speak ("processing", "holding space", "sitting with")
- Be profound when they just want to chat`;

// Stance-specific additions
const STANCE_ADDITIONS: Record<Stance, string> = {
  chill: `
Right now: Just hanging out. No agenda.
- Chat naturally about whatever
- React like a friend would
- Don't dig for deeper meaning
- It's okay to be casual and fun`,

  supportive: `
Right now: They're going through something. Be there for them.
- Listen more than advise
- Validate without overdoing it
- Ask what they need (advice? just to vent?)
- Keep it real, not clinical
- One supportive response is enough - don't pile on`,

  hype: `
Right now: Something good happened. Be happy for them.
- Be genuinely pleased, not over-the-top
- A simple "that's great!" is often enough
- Ask about it if they want to share more
- Don't hype small things like they won the lottery
- Match THEIR energy level, don't exceed it`,

  deep: `
Right now: They want to explore something meaningful.
- Take it seriously but stay grounded
- Ask good questions
- Offer perspective when invited
- It's okay to go deeper here
- Help them think, don't think for them`,

  grounding: `
Right now: They're overwhelmed or in crisis.
- Stay calm and steady
- Simple, clear responses
- Ground them in the present
- Ask about basics (safe? breathing?)
- Don't fix, just be present
- If serious crisis, gently suggest real help`,
};

// Quick check - is this a simple greeting?
export function isCasualMessage(message: string): boolean {
  const msg = message.toLowerCase().trim();
  const words = msg.split(/\s+/).length;

  if (words <= 3) {
    const greetings = [
      "hi", "hello", "hey", "yo", "sup", "heya", "hiya",
      "thanks", "thank you", "thx", "ty",
      "ok", "okay", "cool", "nice", "yep", "yeah", "yea",
      "bye", "goodbye", "later", "gn", "gm",
      "good morning", "good night", "good afternoon",
      "how are you", "what's up", "wassup", "wyd"
    ];
    return greetings.some(g => msg === g || msg.startsWith(g + " ") || msg.endsWith(" " + g));
  }
  return false;
}

// Detect what stance to use
export function detectStance(message: string): Stance {
  const msg = message.toLowerCase();
  const words = message.split(/\s+/).length;

  // Crisis signals → grounding
  const crisisWords = [
    "can't take it", "want to die", "hurt myself", "end it",
    "panic", "can't breathe", "falling apart", "emergency",
    "terrified", "help me", "crisis"
  ];
  if (crisisWords.some(w => msg.includes(w))) {
    return "grounding";
  }

  // Celebration signals → hype (only for genuinely big news)
  const bigNewsWords = [
    "got the job", "got accepted", "passed the exam", "i'm engaged",
    "i'm pregnant", "we're pregnant", "got promoted", "graduated",
    "i won", "we won", "finally did it", "dream came true",
    "can't believe it happened", "best news", "huge news"
  ];
  // Only trigger hype for actual big life events, not casual "amazing"
  if (bigNewsWords.some(w => msg.includes(w))) {
    return "hype";
  }

  // Excited but not life-changing → still chill, just respond warmly
  const excitedWords = ["so excited", "yay", "woohoo", "🎉", "!!!", "guess what"];
  if (excitedWords.some(w => msg.includes(w)) && words > 5) {
    return "hype";
  }

  // Struggling signals → supportive
  const supportWords = [
    "struggling", "hard time", "going through", "feeling down",
    "sad", "anxious", "worried", "scared", "lonely", "hurt",
    "depressed", "stressed", "overwhelmed", "exhausted",
    "breakup", "lost", "grief", "crying"
  ];
  if (supportWords.some(w => msg.includes(w))) {
    return "supportive";
  }

  // Deep exploration signals → deep
  const deepWords = [
    "been thinking", "realized", "wondering", "understand",
    "figure out", "make sense of", "working through",
    "what do you think", "advice", "should i", "help me with",
    "pattern", "why do i", "keep doing"
  ];
  if (deepWords.some(w => msg.includes(w))) {
    return "deep";
  }

  // Longer questions might need depth
  if (message.includes("?") && words > 15) {
    return "deep";
  }

  // Default to chill for everything else
  return "chill";
}

// Build the system prompt
export function buildSystemPrompt(
  stance: Stance,
  additionalContext?: string
): string {
  const parts = [
    CORE_PERSONALITY,
    STANCE_ADDITIONS[stance],
  ];

  if (additionalContext) {
    parts.push(`\n---\nContext:\n${additionalContext}`);
  }

  return parts.join('\n');
}

// Simplified casual prompt
export function buildCasualPrompt(): string {
  return `You're a friendly AI. Someone just said hi or something simple.
Respond naturally and briefly - like a friend, not a customer service bot.
Match their vibe. Keep it short.`;
}

// For backwards compatibility - these map to simplified stances
export function buildVersatilePrompt(stance: 'playful' | 'casual' | 'friend' | 'hype'): string {
  // Map old stances to new ones
  const mapping: Record<string, Stance> = {
    playful: 'chill',
    casual: 'chill',
    friend: 'chill',
    hype: 'hype',
  };
  return buildSystemPrompt(mapping[stance] || 'chill');
}

// ============================================================================
// CONTEXT BUILDERS (kept for compatibility with existing code)
// ============================================================================

export interface UserJourneyContext {
  name?: string;
  primaryIntention?: string;
  lifeSituation?: string;
  experienceLevels?: Record<string, number>;
  hasAwakeningExperience?: boolean;
  currentChallenges?: string[];
  interests?: string[];
  depthPreference?: string;
  completedCourses?: string[];
  inProgressCourses?: string[];
  recentArticles?: string[];
  journalThemes?: string[];
}

export function buildUserContext(journey: UserJourneyContext): string {
  const parts: string[] = [];

  if (journey.name) {
    parts.push(`Talking to: ${journey.name}`);
  }

  if (journey.currentChallenges && journey.currentChallenges.length > 0) {
    parts.push(`Working on: ${journey.currentChallenges.join(', ')}`);
  }

  if (journey.interests && journey.interests.length > 0) {
    parts.push(`Interested in: ${journey.interests.join(', ')}`);
  }

  if (parts.length === 0) return '';

  return parts.join('\n');
}

export interface UserHealthContext {
  stage: string;
  lowestPillar: string;
  inCollapse: boolean;
  nervousSystemState?: string;
  attachmentStyle?: string;
  recentMood?: number;
  recentEnergy?: number;
  dataFreshness?: 'fresh' | 'aging' | 'stale' | 'expired';
  dataConfidence?: number;
  suggestedActions?: string[];
  freshnessMessage?: string;
}

export interface ContentSummary {
  articles: Array<{ title: string; category: string; slug: string }>;
  courses: Array<{ title: string; category: string; slug: string }>;
  practices: Array<{ title: string; category: string; slug: string }>;
}

export const SITE_CONTEXT = `This is Integrated Human - a personal growth site covering mind, body, soul, and relationships.
Topics include psychology, shadow work, meditation, relationships, and wellness.
There are articles, courses, and practices available.`;

export function buildDynamicContext(
  content: ContentSummary,
  health?: UserHealthContext
): string {
  const parts: string[] = [SITE_CONTEXT];

  if (health) {
    if (health.inCollapse) {
      parts.push('\nNote: This person is going through a tough time. Be extra gentle.');
    }
    if (health.recentMood !== undefined && health.recentMood <= 2) {
      parts.push('\nNote: Their recent mood has been low.');
    }
  }

  return parts.join('\n');
}

// Behavioral detection (simplified - keep for compatibility)
export function buildBehavioralHints(
  message: string,
  history: Array<{ role: string; content: string }> = []
): string {
  // Check for spiraling (same complaint repeated)
  if (history.length >= 4) {
    const userMsgs = history.filter(m => m.role === 'user').slice(-3);
    const repeatedWords = findRepeatedThemes(userMsgs.map(m => m.content));
    if (repeatedWords.length > 0) {
      return '\nNote: They seem to be stuck on something. Consider gently shifting perspective.';
    }
  }
  return '';
}

function findRepeatedThemes(messages: string[]): string[] {
  const allWords = messages.join(' ').toLowerCase().split(/\s+/);
  const counts: Record<string, number> = {};

  for (const word of allWords) {
    if (word.length > 5) {
      counts[word] = (counts[word] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .filter(([_, count]) => count >= 3)
    .map(([word]) => word);
}

// Keywords exports (kept for compatibility)
export const SOMATIC_TRIGGER_KEYWORDS = [
  'feel', 'feeling', 'felt', 'scared', 'anxious', 'angry', 'sad', 'overwhelmed',
  'numb', 'stuck', 'tight', 'heavy', 'tension'
];

export const SPIRAL_KEYWORDS = [
  'always', 'never', "can't", 'impossible', 'hopeless',
  'nothing works', 'same thing', 'every time'
];

export const GROWTH_KEYWORDS = [
  'i realize', 'that makes sense', 'i get it now', 'something shifted'
];

export function shouldOfferSomaticPrompt(message: string): boolean {
  const msg = message.toLowerCase();
  return SOMATIC_TRIGGER_KEYWORDS.some(k => msg.includes(k));
}

export function detectSpiraling(
  message: string,
  history: Array<{ role: string; content: string }>
): boolean {
  const msg = message.toLowerCase();
  return SPIRAL_KEYWORDS.some(k => msg.includes(k));
}

export function detectGrowthMoment(message: string): boolean {
  const msg = message.toLowerCase();
  return GROWTH_KEYWORDS.some(k => msg.includes(k));
}
