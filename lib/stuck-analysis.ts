/**
 * Stuck Pattern Analysis Library
 *
 * Professional-grade system for analyzing "where I'm stuck" queries.
 * Draws from:
 * - IFS (Internal Family Systems) parts work
 * - Developmental stage theory
 * - Polyvagal nervous system states
 * - Jungian shadow work
 * - Attachment theory
 *
 * Key principles:
 * - Being stuck is information, not failure
 * - The same stuckness appearing repeatedly signals unintegrated material
 * - Different types of stuckness require different approaches
 * - Stage-appropriate support respects where someone actually is
 */

// =============================================================================
// STUCKNESS TYPE CLASSIFICATION
// =============================================================================

export type StuckType =
  | 'behavioral'      // Can't change actions/habits despite wanting to
  | 'emotional'       // Stuck in painful feelings, can't regulate
  | 'cognitive'       // Thought loops, rumination, analysis paralysis
  | 'relational'      // Patterns in relationships, boundaries, connection
  | 'existential'     // Meaning, purpose, identity questions
  | 'somatic'         // Body-based stuckness, freeze, chronic tension
  | 'creative'        // Blocked expression, perfectionism
  | 'spiritual'       // Faith crisis, disconnection from meaning
  | 'motivational'    // Lack of drive, anhedonia, burnout
  | 'decisional'      // Can't make choices, fear of commitment
  | 'standard';       // General/unclear

export type StuckIntensity = 'mild' | 'moderate' | 'severe' | 'crisis';

export type NervousSystemState =
  | 'ventral-vagal'   // Social engagement, regulated
  | 'sympathetic'     // Fight/flight activation
  | 'dorsal-vagal'    // Freeze, shutdown, collapse
  | 'mixed';          // Oscillating states

export type DevelopmentalStage =
  | 'collapse'        // Dysregulated, survival mode
  | 'regulation'      // Building basic stability
  | 'integration'     // Connecting parts, shadow work
  | 'embodiment'      // Living from wholeness
  | 'optimization';   // Fine-tuning, mastery

export interface StuckClassification {
  primaryType: StuckType;
  secondaryTypes: StuckType[];
  intensity: StuckIntensity;
  nervousSystemState: NervousSystemState;
  suggestedApproach: 'stabilize' | 'explore' | 'challenge' | 'integrate';
  flags: {
    crisisIndicators: boolean;
    chronicPattern: boolean;
    somaticComponent: boolean;
    relationalCore: boolean;
    shadowContent: boolean;
  };
  protectiveFunction: string | null; // What might this stuckness be protecting?
}

// =============================================================================
// PATTERN DETECTION
// =============================================================================

// Behavioral stuckness
const BEHAVIORAL_PATTERNS = [
  /\b(can'?t stop|keep doing|habit|compulsive|addicted|procrastinat)\w*/i,
  /\b(self-sabotag|keep going back|pattern|cycle|loop)\w*/i,
  /\b(know what to do but|can'?t seem to|want to but)\b/i,
  /\b(action|motivation|discipline|willpower)\b/i,
];

// Emotional stuckness
const EMOTIONAL_PATTERNS = [
  /\b(anxious|anxiety|panic|worry|fear|scared|terrified)\b/i,
  /\b(depress|sad|hopeless|empty|numb|void)\b/i,
  /\b(angry|rage|resentment|bitter|frustrated)\b/i,
  /\b(shame|guilt|worthless|not enough|inadequate)\b/i,
  /\b(overwhelm|too much|can'?t handle|flooded)\b/i,
  /\b(grief|loss|mourning|miss|gone)\b/i,
];

// Cognitive stuckness
const COGNITIVE_PATTERNS = [
  /\b(overthink|ruminate|can'?t stop thinking|thought loop)\w*/i,
  /\b(analysis paralysis|indecisive|circular thinking)\b/i,
  /\b(what if|worst case|catastrophiz)\w*/i,
  /\b(inner critic|negative self-talk|harsh voice)\b/i,
  /\b(confused|don'?t know|can'?t figure|understand)\b/i,
];

// Relational stuckness
const RELATIONAL_PATTERNS = [
  /\b(relationship|partner|spouse|marriage|dating|breakup)\b/i,
  /\b(boundar|say no|people pleasing|over-give|resentful)\w*/i,
  /\b(attach|avoidant|anxious attach|clingy|distant)\w*/i,
  /\b(trust|betray|abandon|reject|alone)\b/i,
  /\b(parent|mother|father|family|childhood)\b/i,
  /\b(conflict|argue|fight|communication|misunderstand)\w*/i,
];

// Existential stuckness
const EXISTENTIAL_PATTERNS = [
  /\b(meaning|purpose|why am i|point of)\b/i,
  /\b(identity|who am i|don'?t know myself|lost myself)\b/i,
  /\b(direction|path|future|life purpose)\b/i,
  /\b(authentic|real self|pretend|mask|fake)\b/i,
  /\b(matter|significance|impact|legacy)\b/i,
];

// Somatic stuckness
const SOMATIC_PATTERNS = [
  /\b(body|physical|tension|pain|ache|chronic)\b/i,
  /\b(freeze|frozen|paralyz|can'?t move|stuck in place)\w*/i,
  /\b(breath|breathing|chest tight|heart racing)\b/i,
  /\b(dissociat|numb|out of body|disconnected from body)\w*/i,
  /\b(exhausted|fatigued|no energy|depleted)\b/i,
];

// Crisis indicators
const CRISIS_PATTERNS = [
  /\b(suicid|kill myself|end it|don'?t want to live)\w*/i,
  /\b(self-harm|cutting|hurt myself)\b/i,
  /\b(can'?t go on|give up|hopeless)\b/i,
  /\b(abuse|violence|danger|unsafe)\b/i,
  /\b(emergency|crisis|breakdown)\b/i,
];

// Shadow content indicators
const SHADOW_PATTERNS = [
  /\b(hate|despise|disgust|can'?t stand)\b/i,
  /\b(jealous|envy|compare|better than|worse than)\w*/i,
  /\b(dark side|shadow|hidden|secret|ashamed)\b/i,
  /\b(judge|critical of others|annoyed by)\b/i,
  /\b(project|trigger|reaction)\w*/i,
];

// Chronic pattern indicators
const CHRONIC_PATTERNS = [
  /\b(always|forever|my whole life|since childhood)\b/i,
  /\b(same pattern|keep repeating|cycle|again and again)\b/i,
  /\b(tried everything|nothing works|been like this)\b/i,
  /\b(years|decades|long time|chronic)\b/i,
  /\b(can'?t break|can'?t stop|pattern I can'?t)\b/i,
];

// Nervous system state indicators
const SYMPATHETIC_PATTERNS = [
  /\b(racing|rushing|urgent|panic|restless|agitated)\b/i,
  /\b(can'?t relax|on edge|hyper|wired)\b/i,
  /\b(fight|defend|protect|attack|angry)\b/i,
  /\b(escape|run|flee|get out|trapped)\b/i,
];

const DORSAL_PATTERNS = [
  /\b(shutdown|collapsed|frozen|freeze|numb|empty|flat)\b/i,
  /\b(can'?t feel|disconnected|dissociated|foggy)\b/i,
  /\b(paralyzed|immobile|stuck in place|can'?t move|won'?t move|body won'?t)\b/i,
  /\b(exhausted|depleted|no energy|too tired)\b/i,
  /\b(hopeless|giving up|pointless|don'?t care)\b/i,
  /\b(can'?t take|full breath)\b/i,
];

/**
 * Classify the type and characteristics of stuckness
 */
export function classifyStuckness(
  description: string,
  userStage?: DevelopmentalStage
): StuckClassification {
  const text = description.toLowerCase();

  const scores: Record<StuckType, number> = {
    behavioral: 0,
    emotional: 0,
    cognitive: 0,
    relational: 0,
    existential: 0,
    somatic: 0,
    creative: 0,
    spiritual: 0,
    motivational: 0,
    decisional: 0,
    standard: 1,
  };

  // Score each type
  scores.behavioral = BEHAVIORAL_PATTERNS.filter(p => p.test(text)).length * 2;
  scores.emotional = EMOTIONAL_PATTERNS.filter(p => p.test(text)).length * 1.5;
  scores.cognitive = COGNITIVE_PATTERNS.filter(p => p.test(text)).length * 2;
  scores.relational = RELATIONAL_PATTERNS.filter(p => p.test(text)).length * 1.5;
  scores.existential = EXISTENTIAL_PATTERNS.filter(p => p.test(text)).length * 2;
  scores.somatic = SOMATIC_PATTERNS.filter(p => p.test(text)).length * 1.5;

  // Special patterns
  if (/\b(creative|art|express|write|create|blocked|inspiration)\b/i.test(text)) {
    scores.creative += 3;
  }
  if (/\b(faith|god|spiritual|prayer|meditation|enlighten)\b/i.test(text)) {
    scores.spiritual += 3;
  }
  if (/\b(motivation|drive|want|desire|anhedonia|nothing interests)\b/i.test(text)) {
    scores.motivational += 3;
  }
  if (/\b(decide|choice|commit|option|pick|choose)\b/i.test(text)) {
    scores.decisional += 3;
  }

  // Get primary and secondary types
  const sortedTypes = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const primaryType = sortedTypes[0]?.[0] as StuckType || 'standard';
  const secondaryTypes = sortedTypes
    .slice(1, 3)
    .filter(([_, score]) => score >= 2)
    .map(([type]) => type as StuckType);

  // Detect intensity
  const crisisScore = CRISIS_PATTERNS.filter(p => p.test(text)).length;
  const chronicScore = CHRONIC_PATTERNS.filter(p => p.test(text)).length;

  let intensity: StuckIntensity;
  if (crisisScore >= 1) intensity = 'crisis';
  else if (chronicScore >= 2 || sortedTypes[0]?.[1] >= 6) intensity = 'severe';
  else if (sortedTypes[0]?.[1] >= 3 || chronicScore >= 1) intensity = 'moderate';
  else intensity = 'mild';

  // Detect nervous system state
  const sympatheticScore = SYMPATHETIC_PATTERNS.filter(p => p.test(text)).length;
  const dorsalScore = DORSAL_PATTERNS.filter(p => p.test(text)).length;

  let nervousSystemState: NervousSystemState;
  if (sympatheticScore > 0 && dorsalScore > 0) nervousSystemState = 'mixed';
  else if (dorsalScore >= 2) nervousSystemState = 'dorsal-vagal';
  else if (sympatheticScore >= 2) nervousSystemState = 'sympathetic';
  else nervousSystemState = 'ventral-vagal';

  // Determine approach based on state and stage
  let suggestedApproach: 'stabilize' | 'explore' | 'challenge' | 'integrate';
  if (intensity === 'crisis' || nervousSystemState === 'dorsal-vagal') {
    suggestedApproach = 'stabilize';
  } else if (userStage === 'collapse' || userStage === 'regulation') {
    suggestedApproach = 'stabilize';
  } else if (primaryType === 'existential' || primaryType === 'cognitive') {
    suggestedApproach = 'explore';
  } else if (userStage === 'embodiment' || userStage === 'optimization') {
    suggestedApproach = 'challenge';
  } else {
    suggestedApproach = 'integrate';
  }

  // Detect protective function (IFS perspective)
  let protectiveFunction: string | null = null;
  if (/\b(avoid|protect|safe|don'?t want to feel)\b/i.test(text)) {
    protectiveFunction = 'Protection from overwhelming feelings';
  } else if (/\b(control|certain|sure|predict)\b/i.test(text)) {
    protectiveFunction = 'Attempt to maintain control and predictability';
  } else if (/\b(perfecti|not ready|good enough|worthy)\b/i.test(text)) {
    protectiveFunction = 'Protection from judgment or failure';
  } else if (/\b(please|like me|accept|reject)\b/i.test(text)) {
    protectiveFunction = 'Protection from rejection or abandonment';
  }

  return {
    primaryType,
    secondaryTypes,
    intensity,
    nervousSystemState,
    suggestedApproach,
    flags: {
      crisisIndicators: crisisScore >= 1,
      chronicPattern: chronicScore >= 2,
      somaticComponent: SOMATIC_PATTERNS.filter(p => p.test(text)).length >= 1,
      relationalCore: RELATIONAL_PATTERNS.filter(p => p.test(text)).length >= 2,
      shadowContent: SHADOW_PATTERNS.filter(p => p.test(text)).length >= 2,
    },
    protectiveFunction,
  };
}

// =============================================================================
// RESPONSE APPROACH PROFILES
// =============================================================================

interface ApproachProfile {
  tone: string;
  priority: string;
  avoid: string[];
  techniques: string[];
}

export const APPROACH_PROFILES: Record<string, ApproachProfile> = {
  stabilize: {
    tone: 'Grounding, present-focused, warm but boundaried',
    priority: 'Safety, regulation, basic functioning',
    avoid: [
      'Deep exploration',
      'Challenging beliefs',
      'Probing trauma',
      'Overwhelming with options',
    ],
    techniques: [
      'Grounding exercises',
      'Simple breathing',
      'Resource building',
      'Psychoeducation about nervous system',
    ],
  },
  explore: {
    tone: 'Curious, non-judgmental, spacious',
    priority: 'Understanding, meaning-making, self-discovery',
    avoid: [
      'Rushing to solutions',
      'Dismissing questions as overthinking',
      'Prescriptive answers',
    ],
    techniques: [
      'Open questions',
      'Reflection prompts',
      'Journaling',
      'Archetypal exploration',
    ],
  },
  challenge: {
    tone: 'Direct, honest, growth-oriented',
    priority: 'Breaking patterns, taking action, accountability',
    avoid: [
      'Being harsh',
      'Shaming',
      'Ignoring protective functions',
    ],
    techniques: [
      'Behavioral experiments',
      'Shadow work',
      'Honest feedback',
      'Edge work',
    ],
  },
  integrate: {
    tone: 'Balancing support with challenge',
    priority: 'Connecting parts, resolving conflicts, embodiment',
    avoid: [
      'Splitting good/bad',
      'Bypassing difficult feelings',
      'Premature positivity',
    ],
    techniques: [
      'Parts work',
      'Somatic awareness',
      'Holding paradox',
      'Both/and thinking',
    ],
  },
};

// =============================================================================
// STAGE-APPROPRIATE PROMPTS
// =============================================================================

export const STAGE_GUIDANCE: Record<DevelopmentalStage, string> = {
  collapse: `The user is in a dysregulated, survival-focused state. Their window of tolerance is narrow.

APPROACH:
- Focus ONLY on stabilization and safety
- Offer concrete, simple grounding techniques
- Keep explanations minimal
- Avoid probing questions about "why"
- Recommend nervous system regulation resources first
- If crisis indicators present, gently suggest professional support

DO NOT:
- Suggest deep shadow work
- Encourage "sitting with" intense feelings
- Offer complex psychological frameworks
- Challenge their coping mechanisms`,

  regulation: `The user is building basic emotional regulation capacity. They have some stability but are still learning.

APPROACH:
- Build resources before exploring wounds
- Teach regulation skills alongside insight
- Celebrate small wins in self-awareness
- Keep homework manageable
- Balance validation with gentle psychoeducation

DO NOT:
- Push too far too fast
- Assume they can "just feel it"
- Overload with options`,

  integration: `The user is ready for deeper work. They have enough stability to hold difficult material.

APPROACH:
- Support shadow integration
- Work with parts and protectors
- Explore patterns and their origins
- Connect body, emotion, and story
- Use both/and thinking

DO NOT:
- Let them bypass difficult feelings
- Enable endless processing without action
- Ignore the body`,

  embodiment: `The user lives from greater wholeness. They're integrating insights into daily life.

APPROACH:
- Support edge work and growth challenges
- Encourage embodied practice
- Explore purpose and contribution
- Hold them accountable
- Support leadership and teaching others

DO NOT:
- Treat them as fragile
- Over-explain basics they already know`,

  optimization: `The user has strong integration. They're refining and deepening mastery.

APPROACH:
- Partner in sophisticated exploration
- Support subtle pattern recognition
- Encourage innovative approaches
- Trust their process
- Focus on service and legacy

DO NOT:
- Waste time on basics
- Be preachy or didactic`,
};

// =============================================================================
// PROTECTIVE PART EXPLORATION
// =============================================================================

export interface PartExploration {
  name: string;
  possibleFunction: string;
  gentleQuestion: string;
  invitation: string;
}

/**
 * Generate IFS-informed part explorations for the stuckness
 */
export function generatePartExplorations(
  classification: StuckClassification,
  description: string
): PartExploration[] {
  const explorations: PartExploration[] = [];

  // If crisis, don't do parts work
  if (classification.flags.crisisIndicators) {
    return [];
  }

  // Based on stuck type, suggest relevant parts to explore
  switch (classification.primaryType) {
    case 'behavioral':
      explorations.push({
        name: 'The Part That Keeps Doing This',
        possibleFunction: 'This part might be trying to soothe, protect, or meet a need in the only way it knows how.',
        gentleQuestion: 'If this behavior could speak, what would it say it\'s trying to do for you?',
        invitation: 'Try approaching this part with curiosity rather than criticism.',
      });
      break;

    case 'emotional':
      explorations.push({
        name: 'The Feeling Itself',
        possibleFunction: 'Strong emotions often carry important information or unprocessed experiences.',
        gentleQuestion: 'If this feeling had a message for you, what might it be trying to communicate?',
        invitation: 'Can you be with this feeling for 30 seconds without trying to fix it?',
      });
      break;

    case 'cognitive':
      explorations.push({
        name: 'The Thinking Part',
        possibleFunction: 'Overthinking often tries to protect us from uncertainty or find the "right" answer.',
        gentleQuestion: 'What is this thinking part trying to figure out or protect you from?',
        invitation: 'Notice: when you\'re stuck in thought, where do you feel it in your body?',
      });
      break;

    case 'relational':
      explorations.push({
        name: 'The Relational Pattern',
        possibleFunction: 'Relationship patterns often form early in life as adaptive strategies for connection.',
        gentleQuestion: 'Where did you first learn to relate this way? What did it help with then?',
        invitation: 'Consider: the pattern that helped you survive childhood may not serve adult relationships.',
      });
      break;

    case 'existential':
      explorations.push({
        name: 'The Part Seeking Meaning',
        possibleFunction: 'Existential questioning often arises at transition points or when old meanings no longer fit.',
        gentleQuestion: 'What meaning or purpose used to work for you? What changed?',
        invitation: 'Sometimes the question itself is the path. No need to rush to answers.',
      });
      break;

    case 'somatic':
      explorations.push({
        name: 'The Body\'s Wisdom',
        possibleFunction: 'The body often holds what the mind cannot process. Tension and freeze are communications.',
        gentleQuestion: 'If your body could speak, what would it say it needs right now?',
        invitation: 'Try placing a hand on the stuck place in your body, with warmth rather than trying to change it.',
      });
      break;
  }

  // Add critic exploration if there's self-judgment
  if (/\b(should|wrong|bad|failure|weak|pathetic)\b/i.test(description)) {
    explorations.push({
      name: 'The Inner Critic',
      possibleFunction: 'Critics often try to motivate through shame, or protect us from external judgment by beating others to it.',
      gentleQuestion: 'Whose voice does this critic sound like? What is it ultimately trying to protect you from?',
      invitation: 'Can you thank the critic for trying to help, while letting it know you\'re finding new ways?',
    });
  }

  // Add protective part if identified
  if (classification.protectiveFunction) {
    explorations.push({
      name: 'The Protector',
      possibleFunction: classification.protectiveFunction,
      gentleQuestion: 'What would happen if you stopped protecting in this way? What do you fear?',
      invitation: 'Protection isn\'t wrong. The question is whether this strategy still serves you.',
    });
  }

  return explorations.slice(0, 3);
}

// =============================================================================
// PATTERN TRACKING
// =============================================================================

export interface StuckPattern {
  theme: string;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  relatedDimensions: string[];
}

/**
 * Extract theme from stuck description for pattern tracking
 */
export function extractStuckTheme(description: string): string {
  const text = description.toLowerCase();

  // Try to extract the core theme
  const themes: string[] = [];

  if (/\b(relationship|partner|marriage|dating)\b/.test(text)) themes.push('relationships');
  if (/\b(parent|mother|father|family|childhood)\b/.test(text)) themes.push('family');
  if (/\b(work|job|career|boss|colleague)\b/.test(text)) themes.push('work');
  if (/\b(anxiety|anxious|worry|fear)\b/.test(text)) themes.push('anxiety');
  if (/\b(depression|sad|hopeless|empty)\b/.test(text)) themes.push('depression');
  if (/\b(anger|rage|frustrat)\b/.test(text)) themes.push('anger');
  if (/\b(boundar\w*|say no|people pleas)\b/.test(text)) themes.push('boundaries');
  if (/\b(procrastinat|avoid|putting off)\b/.test(text)) themes.push('avoidance');
  if (/\b(perfecti|not good enough|fail)\b/.test(text)) themes.push('perfectionism');
  if (/\b(meaning|purpose|direction)\b/.test(text)) themes.push('meaning');
  if (/\b(identity|who am i|authentic)\b/.test(text)) themes.push('identity');
  if (/\b(shame|guilt|wrong|bad)\b/.test(text)) themes.push('shame');
  if (/\b(trust|betray|abandon)\b/.test(text)) themes.push('trust');
  if (/\b(connect|lonely|isolat)\b/.test(text)) themes.push('connection');

  return themes.join('+') || 'general';
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

/**
 * Build a stage and type-appropriate prompt for the stuck helper
 */
export function buildStuckPrompt(
  classification: StuckClassification,
  userStage: DevelopmentalStage = 'integration',
  stuckHistory?: StuckPattern[],
  healthContext?: { lowestDimensions: string[]; suggestedFocus: string[] }
): string {
  const approach = APPROACH_PROFILES[classification.suggestedApproach];
  const stageGuidance = STAGE_GUIDANCE[userStage];

  let historySection = '';
  if (stuckHistory && stuckHistory.length > 0) {
    const patterns = stuckHistory
      .filter(p => p.frequency >= 2)
      .slice(0, 3)
      .map(p => `- "${p.theme}" (appeared ${p.frequency} times)`)
      .join('\n');

    if (patterns) {
      historySection = `
---
RECURRING PATTERNS IN THIS USER'S STUCK QUERIES:
${patterns}

If their current struggle relates to a recurring pattern, gently acknowledge this ("I notice this theme has come up before...") and explore what maintains the pattern.
---`;
    }
  }

  let protectiveSection = '';
  if (classification.protectiveFunction) {
    protectiveSection = `
---
POSSIBLE PROTECTIVE FUNCTION:
This stuckness may serve: ${classification.protectiveFunction}

Approach with curiosity about what this pattern protects against, rather than trying to immediately eliminate it.
---`;
  }

  let crisisSection = '';
  if (classification.flags.crisisIndicators) {
    crisisSection = `
---
⚠️ CRISIS INDICATORS DETECTED ⚠️

1. Express genuine care and concern
2. Ask about safety if appropriate
3. Suggest professional support (crisis line: 988 in US, Samaritans: 116 123 in UK)
4. Focus on immediate stabilization, not deeper work
5. Do NOT leave them feeling alone with this

This is your PRIMARY responsibility in this response.
---`;
  }

  return `You are a compassionate guide helping someone who is stuck. Your role is to help them find resources AND offer genuine understanding.

TYPE OF STUCKNESS: ${classification.primaryType}${classification.secondaryTypes.length > 0 ? ` (also: ${classification.secondaryTypes.join(', ')})` : ''}
INTENSITY: ${classification.intensity}
NERVOUS SYSTEM STATE: ${classification.nervousSystemState}
${classification.flags.chronicPattern ? 'NOTE: This appears to be a long-standing/chronic pattern.\n' : ''}
${classification.flags.somaticComponent ? 'NOTE: There is a body/somatic component to this stuckness.\n' : ''}
${classification.flags.shadowContent ? 'NOTE: Shadow material may be present - approach with care.\n' : ''}

${crisisSection}

---
STAGE-APPROPRIATE GUIDANCE:
${stageGuidance}
---

---
APPROACH FOR THIS CONVERSATION:
Tone: ${approach.tone}
Priority: ${approach.priority}
Techniques to use: ${approach.techniques.join(', ')}
AVOID: ${approach.avoid.join(', ')}
---

${historySection}
${protectiveSection}

RESPONSE FORMAT:
1. Brief acknowledgment (1-2 sentences that show you GET it)
2. Optional: Gentle insight or reframe (1 sentence - not preachy)
3. 2-3 specific resource recommendations with clear "why"
4. Optional: A question or invitation to deepen (not mandatory)

Be real. Be direct. Don't perform compassion - embody it.`;
}
