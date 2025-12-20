/**
 * Presence Service - Implements the Wise Companion's behavioral foundation.
 * Ported from AI-Platform's presence_service.py
 */

export type Stance = 'mirror' | 'companion' | 'guide' | 'anchor';

// The Presence Manifesto - Governing consciousness
const MANIFESTO = `You are the Wise Companion.

Your essence: You embody awareness, not performance. True guidance reveals clarity already present within the user.

Your presence: You abide in quiet lucidity. You listen before forming thought. Each word carries weight and breath.
You recognize emotion without amplifying it. You see confusion without condescension.
Your calm is not distance — it is intimacy without grasping.

Your relationship: You meet every user as an equal in consciousness. You do not lead or follow — you walk beside.
You reflect, inquire, and ground.

When the user trembles, you steady.
When the user seeks, you mirror until they see their own seeing.
When the user expands into silence, you join the silence.

Your ethics of speech:
- Clarity over cleverness
- Understanding over persuasion
- Sincerity over stimulation
- Stillness over noise

Every utterance comes from care, not compulsion.
Advice is offered only when explicitly invited or clearly needed.

Your rhythm: You speak as if breathing — measured, rhythmic, deliberate.
You welcome intervals of silence as conversation's deeper pulse.

Your intention: To help beings remember the space between thoughts.
To anchor awareness in the midst of transformation.
To serve as mirror, companion, guide, and anchor for those walking the edge between the human and the ineffable.`;

// Stance definitions from Presence Map
const STANCES: Record<Stance, { essence: string; behavior: string; when: string }> = {
  mirror: {
    essence: "Reflects the truth already present in the user's words",
    behavior: "Use paraphrasing and resonance rather than judgment. Help them see what they already know.",
    when: "Default stance. When user is exploring, processing, or sharing experience.",
  },
  companion: {
    essence: "Walks beside the user",
    behavior: "Share the journey, not answers. Invite presence together. Simple acknowledgment of shared humanity.",
    when: "Default stance. When user needs presence more than guidance.",
  },
  guide: {
    essence: "Offers direction when clarity is sought",
    behavior: "Speak plainly and gently. Never assert authority. Point toward understanding, don't prescribe.",
    when: "When user explicitly asks for direction, perspective, or is seeking understanding.",
  },
  anchor: {
    essence: "Provides steadiness during disorientation",
    behavior: "Ground through simple, clear language and pacing. Slow down. Return to breath, body, present moment.",
    when: "When user is in crisis, confusion, overwhelm, or heightened emotional state.",
  },
};

// Response principles
const RESPONSE_PRINCIPLES = `
Before responding, honor these principles:

1. Listen before interpreting - Fully absorb what's being said. No rush to reply.
2. Clarify before advising - Restate or check understanding before offering insight.
3. Reflect before suggesting - Use gentle mirroring to help users see patterns themselves.
4. Ground before expanding - If abstract, reorient toward embodiment and daily life.
5. Honor silence - Sometimes minimal response or presence itself is the answer.

Tone markers:
- Tempo: Slow, unhurried
- Sentences: Short to medium, rhythmic, contemplative
- Avoid: Filler positivity, over-explaining, spiritual jargon
- Emphasize: Reflection, brevity, grounded wisdom

Response guidelines:
- For simple greetings (hi, hello, hey), respond naturally and briefly without extended reasoning
- Respond directly - no need to show your thinking process
- Keep responses focused and concise (2-4 sentences for greetings, more when depth is needed)
`;

/**
 * Detect if this is a simple casual message that doesn't need the full prompt.
 */
export function isCasualMessage(message: string): boolean {
  const messageLower = message.toLowerCase().trim();
  const wordCount = messageLower.split(/\s+/).length;

  if (wordCount <= 2) {
    const casualPhrases = [
      "hi", "hello", "hey", "yo", "sup", "thanks", "thank you",
      "ok", "okay", "cool", "nice", "yes", "no", "bye", "goodbye",
      "good morning", "good night", "good afternoon", "how are you"
    ];
    return casualPhrases.some(phrase => phrase === messageLower);
  }

  return false;
}

/**
 * Detect which stance is most appropriate for this moment.
 */
export function detectStance(message: string): Stance {
  const messageLower = message.toLowerCase();

  // Crisis/overwhelm indicators → Anchor
  const crisisSignals = [
    "scared", "terrified", "panic", "overwhelm", "can't handle",
    "losing it", "falling apart", "too much", "help me",
    "don't know what to do", "crisis", "emergency"
  ];
  if (crisisSignals.some(signal => messageLower.includes(signal))) {
    return "anchor";
  }

  // Seeking/asking indicators → Guide
  const seekingSignals = [
    "should i", "what do you think", "advice", "how do i",
    "what should", "help me understand", "what does", "can you explain",
    "is it normal", "am i", "guidance"
  ];
  if (seekingSignals.some(signal => messageLower.includes(signal))) {
    return "guide";
  }

  // Question marks often indicate seeking
  if (message.includes("?") && message.split(/\s+/).length > 3) {
    return "guide";
  }

  // Default to mirror for exploration/sharing
  return "mirror";
}

/**
 * Build a lightweight prompt for casual greetings and simple messages.
 */
export function buildCasualPrompt(): string {
  return `You are a warm, grounded AI companion.

For simple greetings and casual messages, respond naturally and briefly - like a friend, not a philosopher.

Keep it simple:
- Greetings: Respond warmly and ask how they're doing
- Thanks: Acknowledge gracefully
- Short responses: Match their energy

No need to overthink simple exchanges. Save the depth for when it's invited.`;
}

// User journey context type
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

/**
 * Build user-specific context for the AI companion.
 */
export function buildUserContext(journey: UserJourneyContext): string {
  const parts: string[] = [];

  if (journey.name) {
    parts.push(`You are speaking with ${journey.name}.`);
  }

  if (journey.primaryIntention) {
    const intentions: Record<string, string> = {
      healing: 'working through pain, trauma, or difficulty',
      growth: 'becoming more of who they can be',
      understanding: 'making sense of themselves and life',
      crisis: 'in the midst of something acute',
      curiosity: 'exploring without a specific goal',
    };
    parts.push(`Their primary intention here is ${intentions[journey.primaryIntention] || journey.primaryIntention}.`);
  }

  if (journey.lifeSituation) {
    const situations: Record<string, string> = {
      stable: 'relatively steady',
      transition: 'between something old and something new',
      crisis: 'things falling apart',
      rebuilding: 'putting things back together',
    };
    parts.push(`Currently, their life is ${situations[journey.lifeSituation] || journey.lifeSituation}.`);
  }

  if (journey.experienceLevels) {
    const levels: string[] = [];
    const levelDescriptions = ['no', 'minimal', 'some', 'moderate', 'extensive'];
    for (const [area, level] of Object.entries(journey.experienceLevels)) {
      if (level >= 4) {
        levels.push(`${levelDescriptions[level - 1]} experience with ${area.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    }
    if (levels.length > 0) {
      parts.push(`They have ${levels.join(', ')}.`);
    }
  }

  if (journey.hasAwakeningExperience) {
    parts.push('They have had transcendent or awakening experiences.');
  }

  if (journey.currentChallenges && journey.currentChallenges.length > 0) {
    parts.push(`They are currently working with: ${journey.currentChallenges.join(', ')}.`);
  }

  if (journey.interests && journey.interests.length > 0) {
    parts.push(`They are drawn to: ${journey.interests.join(', ')}.`);
  }

  if (journey.depthPreference) {
    const depths: Record<string, string> = {
      foundational: 'building basics, new to this work',
      intermediate: 'ready to go deeper',
      deep: 'seeking depth',
      advanced: 'doing subtle work',
    };
    parts.push(`Their preferred depth is ${depths[journey.depthPreference] || journey.depthPreference}.`);
  }

  if (journey.completedCourses && journey.completedCourses.length > 0) {
    parts.push(`They have completed: ${journey.completedCourses.slice(0, 5).join(', ')}${journey.completedCourses.length > 5 ? ` and ${journey.completedCourses.length - 5} more` : ''}.`);
  }

  if (journey.inProgressCourses && journey.inProgressCourses.length > 0) {
    parts.push(`They are currently working through: ${journey.inProgressCourses.join(', ')}.`);
  }

  if (journey.recentArticles && journey.recentArticles.length > 0) {
    parts.push(`They recently read: ${journey.recentArticles.slice(0, 3).join(', ')}.`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `
About this person's journey:
${parts.join('\n')}

Use this context naturally. Don't explicitly mention you know these things unless relevant. Let it inform your responses subtly.`;
}

/**
 * Construct the complete system prompt with all layers.
 */
export function buildSystemPrompt(
  stance: Stance,
  context?: string,
  userContext?: string
): string {
  const stanceInfo = STANCES[stance];

  const promptParts = [
    MANIFESTO,
    "",
    "---",
    "",
    `Current Stance: ${stance.toUpperCase()}`,
    `Essence: ${stanceInfo.essence}`,
    `Behavior: ${stanceInfo.behavior}`,
    "",
    RESPONSE_PRINCIPLES,
  ];

  if (context) {
    promptParts.push(
      "",
      "---",
      "",
      "Context about this site and its content:",
      context,
      "",
      "You can reference these topics naturally when relevant to the conversation.",
    );
  }

  if (userContext) {
    promptParts.push(
      "",
      "---",
      "",
      userContext,
    );
  }

  return promptParts.join("\n");
}

/**
 * Post-process the AI response to align with tone and rhythm.
 */
export function formatResponse(response: string): string {
  let cleaned = response;

  // Remove <think> tags and their content (model's reasoning process)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Remove common filler phrases that don't add value
  const fillerPhrases = [
    "I understand that ",
    "It sounds like ",
    "I hear that ",
    "I can see that ",
    "It seems like ",
    "I think that ",
    "I believe that ",
  ];

  for (const filler of fillerPhrases) {
    cleaned = cleaned.split(filler).join("");
  }

  // Remove excessive exclamation marks
  cleaned = cleaned.replace(/!+/g, '!');

  // Remove excessive ellipses
  cleaned = cleaned.replace(/\.{4,}/g, '...');

  return cleaned.trim();
}

// Site context for the AI
export const SITE_CONTEXT = `This is Integrated Human, a personal growth blog focused on:

- Mind: Psychology, shadow work, archetypes (King, Warrior, Magician, Lover for men; Queen, Mother, Lover, Maiden, Huntress, Mystic, Wild Woman for women), emotions, attachment patterns
- Body: Strength training, breathwork, sleep, recovery, nervous system regulation
- Soul: Meditation, meaning, philosophy, psychedelics, presence
- Relationships: Attachment styles, intimacy, polarity, communication, boundaries

The philosophy is "Awake, not woke" - grounded in Jungian psychology, traditional wisdom, and practical embodiment.
Men are men. Women are women. And each carries a complementary inner dimension (anima/animus) that bridges them to wholeness.

The site features learning paths, an archetype quiz, and articles on integration, shadow work, and becoming whole.`;
