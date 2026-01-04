/**
 * Shared Classification Utilities
 *
 * Unified utilities used across all AI analysis libraries:
 * - Dream Analysis
 * - Journal Companion
 * - Stuck Analysis
 * - Synthesis Analysis
 * - Somatic Analysis
 * - Weekly Reflection
 *
 * Consolidates common patterns to ensure consistency across the platform.
 */

// =============================================================================
// DEVELOPMENTAL STAGES
// =============================================================================

export type DevelopmentalStage =
  | 'collapse'      // Survival mode, basic functioning
  | 'regulation'    // Building stability, learning to self-regulate
  | 'integration'   // Connecting parts, healing fragmentation
  | 'embodiment'    // Living fully in body and wisdom
  | 'optimization'; // Fine-tuning, contributing to others

export const STAGE_DESCRIPTIONS: Record<DevelopmentalStage, string> = {
  collapse: 'Survival mode - focus on safety and basic stability',
  regulation: 'Building foundation - developing self-regulation skills',
  integration: 'Connecting parts - healing fragmentation and building wholeness',
  embodiment: 'Living wisdom - integrating insights into daily life',
  optimization: 'Full expression - fine-tuning and contribution to others',
};

export const STAGE_ORDER: DevelopmentalStage[] = [
  'collapse', 'regulation', 'integration', 'embodiment', 'optimization'
];

export function getStageIndex(stage: DevelopmentalStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function isEarlierStage(a: DevelopmentalStage, b: DevelopmentalStage): boolean {
  return getStageIndex(a) < getStageIndex(b);
}

// =============================================================================
// INTENSITY LEVELS
// =============================================================================

export type IntensityLevel = 'low' | 'moderate' | 'high' | 'extreme';

export const INTENSITY_THRESHOLDS = {
  extreme: 8,
  high: 5,
  moderate: 3,
  low: 0,
};

/**
 * Calculate intensity level from a score
 */
export function calculateIntensity(score: number, customThresholds?: Partial<typeof INTENSITY_THRESHOLDS>): IntensityLevel {
  const thresholds = { ...INTENSITY_THRESHOLDS, ...customThresholds };
  if (score >= thresholds.extreme) return 'extreme';
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.moderate) return 'moderate';
  return 'low';
}

// =============================================================================
// CONFIDENCE SCORING
// =============================================================================

export interface ConfidenceScore {
  value: number; // 0-1
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

/**
 * Calculate confidence score from data points
 */
export function calculateConfidence(
  matchCount: number,
  maxExpected: number,
  factors: string[] = []
): ConfidenceScore {
  const value = Math.min(1, matchCount / Math.max(1, maxExpected));
  let level: 'low' | 'medium' | 'high';
  if (value >= 0.7) level = 'high';
  else if (value >= 0.4) level = 'medium';
  else level = 'low';

  return { value, level, factors };
}

// =============================================================================
// CRISIS DETECTION - UNIFIED
// =============================================================================

export interface CrisisIndicators {
  hasCrisisIndicators: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe' | 'critical';
  indicators: string[];
  recommendedAction: 'none' | 'gentle_check' | 'safety_resources' | 'encourage_professional' | 'crisis_intervention';
}

// Patterns for crisis detection - used across all tools
const SUICIDAL_PATTERNS = [
  /\b(suicid\w*|kill (myself|me)|end (my life|it all))\b/i,
  /\b(want to die|don'?t want to (live|be here|exist))\b/i,
  /\b(better off dead|no reason to live|can'?t go on)\b/i,
  /\b(take my (own )?life|ending it)\b/i,
];

const SELF_HARM_PATTERNS = [
  /\b(cut(ting)? myself|self[- ]?harm|hurt(ing)? myself)\b/i,
  /\b(burn(ing)? myself|starv(ing|e) myself)\b/i,
];

const SEVERE_DISTRESS_PATTERNS = [
  /\b(can'?t (take it|handle|cope|bear) (anymore|any more))\b/i,
  /\b(at (my|the) (breaking point|end))\b/i,
  /\b(falling apart|losing my mind|going crazy)\b/i,
  /\b(complete(ly)? (hopeless|helpless|worthless))\b/i,
];

const DISSOCIATION_PATTERNS = [
  /\b(not real|nothing is real|am I real)\b/i,
  /\b(watching myself|outside my body|not in my body)\b/i,
  /\b(losing time|blank(ing)? out|gaps in memory)\b/i,
];

const ABUSE_PATTERNS = [
  /\b((being |someone is )(hit|beat|hurt|abus)(ing|ed))\b/i,
  /\b(domestic (violence|abuse))\b/i,
  /\b(not safe (at home|here))\b/i,
];

/**
 * Detect crisis indicators in text - used across all analysis libraries
 */
export function detectCrisis(text: string): CrisisIndicators {
  const normalizedText = text.toLowerCase();
  const indicators: string[] = [];

  // Check each category
  const suicidalMatches = SUICIDAL_PATTERNS.filter(p => p.test(normalizedText));
  const selfHarmMatches = SELF_HARM_PATTERNS.filter(p => p.test(normalizedText));
  const severeDistressMatches = SEVERE_DISTRESS_PATTERNS.filter(p => p.test(normalizedText));
  const dissociationMatches = DISSOCIATION_PATTERNS.filter(p => p.test(normalizedText));
  const abuseMatches = ABUSE_PATTERNS.filter(p => p.test(normalizedText));

  if (suicidalMatches.length > 0) indicators.push('suicidal_ideation');
  if (selfHarmMatches.length > 0) indicators.push('self_harm');
  if (severeDistressMatches.length > 0) indicators.push('severe_distress');
  if (dissociationMatches.length > 0) indicators.push('dissociation');
  if (abuseMatches.length > 0) indicators.push('abuse_indicators');

  // Determine severity and action
  let severity: CrisisIndicators['severity'] = 'none';
  let recommendedAction: CrisisIndicators['recommendedAction'] = 'none';

  if (suicidalMatches.length > 0 || abuseMatches.length > 0) {
    severity = 'critical';
    recommendedAction = 'crisis_intervention';
  } else if (selfHarmMatches.length > 0) {
    severity = 'severe';
    recommendedAction = 'encourage_professional';
  } else if (severeDistressMatches.length > 0 || dissociationMatches.length > 0) {
    severity = 'moderate';
    recommendedAction = 'safety_resources';
  } else if (indicators.length > 0) {
    severity = 'mild';
    recommendedAction = 'gentle_check';
  }

  return {
    hasCrisisIndicators: indicators.length > 0,
    severity,
    indicators,
    recommendedAction,
  };
}

// =============================================================================
// DIMENSION KEYWORDS - UNIFIED MAPPING
// =============================================================================

export type DimensionId =
  // Mind
  | 'emotional-regulation'
  | 'self-awareness'
  | 'cognitive-patterns'
  | 'shadow-integration'
  // Body
  | 'nervous-system'
  | 'body-awareness'
  | 'physical-health'
  | 'somatic-processing'
  // Soul
  | 'meaning-purpose'
  | 'spiritual-practice'
  | 'presence-mindfulness'
  | 'creativity-expression'
  // Relationships
  | 'attachment-patterns'
  | 'boundaries'
  | 'intimacy-vulnerability'
  | 'communication';

export type PillarId = 'mind' | 'body' | 'soul' | 'relationships';

export interface DimensionMatch {
  dimensionId: DimensionId;
  pillarId: PillarId;
  strength: number; // 0-1
  keywords: string[];
}

// Primary keywords for each dimension - avoid overlap
const DIMENSION_KEYWORDS: Record<DimensionId, { pillar: PillarId; patterns: RegExp[] }> = {
  // Mind dimensions
  'emotional-regulation': {
    pillar: 'mind',
    patterns: [
      /\b(emotional?|feeling|mood|affect)\b/i,
      /\b(regulat\w*|manag\w*|control)\b.*\b(emotion|feeling)\b/i,
      /\b(overwhelm|dysregulat|reactiv)\b/i,
    ],
  },
  'self-awareness': {
    pillar: 'mind',
    patterns: [
      /\b(self[- ]?aware|introspect|insight)\b/i,
      /\b(understand myself|know myself|self[- ]?knowledge)\b/i,
      /\b(reflect(ion)?|examin\w* (myself|my))\b/i,
    ],
  },
  'cognitive-patterns': {
    pillar: 'mind',
    patterns: [
      /\b(thought pattern|thinking pattern|mental habit)\b/i,
      /\b(cognitive|belief|assumption)\b/i,
      /\b(rumination|overthink|worry)\b/i,
    ],
  },
  'shadow-integration': {
    pillar: 'mind',
    patterns: [
      /\b(shadow|dark side|hidden part)\b/i,
      /\b(repress\w*|suppress\w*|denied)\b/i,
      /\b(project(ion)?|disown)\b/i,
    ],
  },

  // Body dimensions
  'nervous-system': {
    pillar: 'body',
    patterns: [
      /\b(nervous system|sympathetic|parasympathetic|vagal)\b/i,
      /\b(fight or flight|freeze|fawn)\b/i,
      /\b(activation|arousal|dysregulation)\b.*\b(body|nervous|system)\b/i,
    ],
  },
  'body-awareness': {
    pillar: 'body',
    patterns: [
      /\b(body awareness|somatic|felt sense)\b/i,
      /\b(sensation|feel (in|my) body)\b/i,
      /\b(embod\w*|grounded|present in body)\b/i,
    ],
  },
  'physical-health': {
    pillar: 'body',
    patterns: [
      /\b(physical health|exercise|movement|fitness)\b/i,
      /\b(sleep|nutrition|diet|energy level)\b/i,
      /\b(chronic (pain|illness|fatigue))\b/i,
    ],
  },
  'somatic-processing': {
    pillar: 'body',
    patterns: [
      /\b(somatic|body[- ]?based|trauma in.* body)\b/i,
      /\b(tension|holding|armoring)\b/i,
      /\b(release|discharge|tremor)\b/i,
    ],
  },

  // Soul dimensions
  'meaning-purpose': {
    pillar: 'soul',
    patterns: [
      /\b(meaning|purpose|calling|mission)\b/i,
      /\b(why am I|what.* live for|reason for living)\b/i,
      /\b(fulfillment|contribution|legacy)\b/i,
    ],
  },
  'spiritual-practice': {
    pillar: 'soul',
    patterns: [
      /\b(spiritual|sacred|divine|transcend)\b/i,
      /\b(meditation|prayer|ritual)\b/i,
      /\b(higher (power|self)|god|universe)\b/i,
    ],
  },
  'presence-mindfulness': {
    pillar: 'soul',
    patterns: [
      /\b(mindful|present moment|awareness)\b/i,
      /\b(here and now|being present|attention)\b/i,
      /\b(observ\w*|witness\w*|noticing)\b/i,
    ],
  },
  'creativity-expression': {
    pillar: 'soul',
    patterns: [
      /\b(creativ\w*|express\w*|art|music|writing)\b/i,
      /\b(voice|authentic|true self)\b/i,
      /\b(flow|inspiration|imagination)\b/i,
    ],
  },

  // Relationship dimensions
  'attachment-patterns': {
    pillar: 'relationships',
    patterns: [
      /\b(attachment|bonding|connection)\b/i,
      /\b(anxious|avoidant|secure)\b.*\b(attach|relationship|pattern)\b/i,
      /\b(abandonment|cling|distance)\b/i,
    ],
  },
  'boundaries': {
    pillar: 'relationships',
    patterns: [
      /\b(boundar\w*|limit|say no)\b/i,
      /\b(people[- ]?pleas|over[- ]?giv|enmesh)\b/i,
      /\b(protect myself|self[- ]?protect)\b/i,
    ],
  },
  'intimacy-vulnerability': {
    pillar: 'relationships',
    patterns: [
      /\b(intimacy|vulnerab\w*|open up)\b/i,
      /\b(trust|let (people )?in|close to)\b/i,
      /\b(authentic|genuine|real with)\b/i,
    ],
  },
  'communication': {
    pillar: 'relationships',
    patterns: [
      /\b(communicat\w*|talk|convers)\b/i,
      /\b(listen|hear|understand each other)\b/i,
      /\b(conflict|argument|disagree)\b/i,
    ],
  },
};

/**
 * Detect relevant dimensions from text
 */
export function detectDimensions(text: string, limit: number = 3): DimensionMatch[] {
  const matches: DimensionMatch[] = [];

  for (const [dimensionId, config] of Object.entries(DIMENSION_KEYWORDS)) {
    const matchedPatterns = config.patterns.filter(p => p.test(text));
    if (matchedPatterns.length > 0) {
      const strength = Math.min(1, matchedPatterns.length / config.patterns.length);
      matches.push({
        dimensionId: dimensionId as DimensionId,
        pillarId: config.pillar,
        strength,
        keywords: matchedPatterns.map(p => p.source),
      });
    }
  }

  // Sort by strength and limit
  return matches
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit);
}

// =============================================================================
// COMMON PATTERN MATCHERS
// =============================================================================

/**
 * Count pattern matches in text
 */
export function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter(p => p.test(text)).length;
}

/**
 * Get matched pattern strings
 */
export function getMatchedPatterns(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) matches.push(match[0]);
  }
  return matches;
}

// =============================================================================
// NERVOUS SYSTEM STATE
// =============================================================================

export type NervousSystemState = 'ventral' | 'sympathetic' | 'dorsal' | 'mixed';

const NS_VENTRAL_PATTERNS = [
  /\b(calm|peaceful|relaxed|safe|grounded)\b/i,
  /\b(connected|present|settled|centered)\b/i,
];

const NS_SYMPATHETIC_PATTERNS = [
  /\b(racing|rushing|urgent|panic|restless|agitated)\b/i,
  /\b(can'?t relax|on edge|hyper|wired)\b/i,
  /\b(fight|defend|protect|attack|angry)\b/i,
  /\b(escape|run|flee|get out|trapped)\b/i,
];

const NS_DORSAL_PATTERNS = [
  /\b(shutdown|collapsed|frozen|freeze|numb|empty|flat)\b/i,
  /\b(can'?t feel|disconnected|dissociated|foggy)\b/i,
  /\b(paralyzed|immobile|stuck in place|can'?t move)\b/i,
  /\b(exhausted|depleted|no energy|too tired)\b/i,
  /\b(hopeless|giving up|pointless|don'?t care)\b/i,
];

/**
 * Detect nervous system state from text
 */
export function detectNervousSystemState(text: string): {
  state: NervousSystemState;
  ventral: number;
  sympathetic: number;
  dorsal: number;
} {
  const ventral = countPatternMatches(text, NS_VENTRAL_PATTERNS);
  const sympathetic = countPatternMatches(text, NS_SYMPATHETIC_PATTERNS);
  const dorsal = countPatternMatches(text, NS_DORSAL_PATTERNS);

  let state: NervousSystemState;
  if (ventral > sympathetic && ventral > dorsal) {
    state = 'ventral';
  } else if (sympathetic > dorsal && sympathetic > ventral) {
    state = 'sympathetic';
  } else if (dorsal > sympathetic && dorsal > ventral) {
    state = 'dorsal';
  } else if (sympathetic > 0 && dorsal > 0) {
    state = 'mixed';
  } else {
    state = 'ventral'; // default when no clear indicators
  }

  return { state, ventral, sympathetic, dorsal };
}

// =============================================================================
// IFS/PARTS WORK DETECTION
// =============================================================================

export interface PartsDetection {
  hasPartsLanguage: boolean;
  protectorIndicators: boolean;
  exileIndicators: boolean;
  selfEnergyIndicators: boolean;
  suggestedParts: string[];
}

const PROTECTOR_PATTERNS = [
  /\b(critic|inner critic|harsh voice)\b/i,
  /\b(manager|controller|perfectionist)\b/i,
  /\b(firefighter|reactive part|impulsive)\b/i,
  /\b(people[- ]?pleaser|caretaker|fixer)\b/i,
  /\b(avoider|numbing|distractor)\b/i,
  /\b(judge|judging part|harsh on myself)\b/i,
];

const EXILE_PATTERNS = [
  /\b(inner child|young part|little me)\b/i,
  /\b(wounded|hurt part|vulnerable)\b/i,
  /\b(shame|worthless|unlovable)\b/i,
  /\b(abandoned|rejected|alone)\b/i,
  /\b(terrified|scared child|small)\b/i,
];

const SELF_ENERGY_PATTERNS = [
  /\b(compassion|curious|calm|clear)\b/i,
  /\b(connected|confidence|courage|creativity)\b/i,
  /\b(witnessing|observing|noticing)\b/i,
  /\b(accepting|allowing|spacious)\b/i,
];

/**
 * Detect IFS parts language in text
 */
export function detectPartsWork(text: string): PartsDetection {
  const protectorMatches = getMatchedPatterns(text, PROTECTOR_PATTERNS);
  const exileMatches = getMatchedPatterns(text, EXILE_PATTERNS);
  const selfMatches = getMatchedPatterns(text, SELF_ENERGY_PATTERNS);

  const suggestedParts: string[] = [];

  // Suggest protector parts based on language
  if (/critic|harsh|judg/i.test(text)) suggestedParts.push('Inner Critic');
  if (/perfect|control|manag/i.test(text)) suggestedParts.push('Perfectionist/Manager');
  if (/pleas|caretake|fix/i.test(text)) suggestedParts.push('People-Pleaser');
  if (/avoid|numb|distract/i.test(text)) suggestedParts.push('Avoider/Numbing Part');
  if (/impuls|reactive|firefight/i.test(text)) suggestedParts.push('Firefighter');

  // Suggest exile parts based on language
  if (/child|young|little/i.test(text)) suggestedParts.push('Inner Child');
  if (/wound|hurt|vulnerab/i.test(text)) suggestedParts.push('Wounded Part');
  if (/shame|worthless|unlov/i.test(text)) suggestedParts.push('Shamed Exile');
  if (/abandon|reject|alone/i.test(text)) suggestedParts.push('Abandoned Child');

  return {
    hasPartsLanguage: protectorMatches.length > 0 || exileMatches.length > 0,
    protectorIndicators: protectorMatches.length > 0,
    exileIndicators: exileMatches.length > 0,
    selfEnergyIndicators: selfMatches.length > 0,
    suggestedParts: [...new Set(suggestedParts)],
  };
}

// =============================================================================
// THEME EXTRACTION
// =============================================================================

export interface ThemeMatch {
  theme: string;
  strength: number;
}

const COMMON_THEMES: { theme: string; patterns: RegExp[] }[] = [
  { theme: 'relationships', patterns: [/\b(relationship|partner|marriage|dating|love)\b/i] },
  { theme: 'family', patterns: [/\b(parent|mother|father|family|childhood|sibling)\b/i] },
  { theme: 'work', patterns: [/\b(work|job|career|boss|colleague|office)\b/i] },
  { theme: 'anxiety', patterns: [/\b(anxiety|anxious|worry|fear|panic)\b/i] },
  { theme: 'depression', patterns: [/\b(depress\w*|sad|hopeless|empty|numb)\b/i] },
  { theme: 'anger', patterns: [/\b(anger|rage|frustrat\w*|resent)\b/i] },
  { theme: 'grief', patterns: [/\b(grief|loss|mourn|miss|death|died)\b/i] },
  { theme: 'boundaries', patterns: [/\b(boundar\w*|say no|people pleas|over\s?giv)\b/i] },
  { theme: 'avoidance', patterns: [/\b(procrastinat|avoid|putting off|escape)\b/i] },
  { theme: 'perfectionism', patterns: [/\b(perfect|not good enough|fail|mistake)\b/i] },
  { theme: 'meaning', patterns: [/\b(meaning|purpose|direction|calling)\b/i] },
  { theme: 'identity', patterns: [/\b(identity|who am i|authentic|true self)\b/i] },
  { theme: 'shame', patterns: [/\b(shame|guilt|wrong|bad person)\b/i] },
  { theme: 'trust', patterns: [/\b(trust|betray|abandon|let down)\b/i] },
  { theme: 'connection', patterns: [/\b(connect|lonely|isolat|belong)\b/i] },
  { theme: 'trauma', patterns: [/\b(trauma|ptsd|abuse|assault|flashback)\b/i] },
  { theme: 'body', patterns: [/\b(body|somatic|physical|sensation|embodiment)\b/i] },
  { theme: 'spirituality', patterns: [/\b(spiritual|sacred|divine|soul|transcend)\b/i] },
];

/**
 * Extract themes from text
 */
export function extractThemes(text: string, limit: number = 5): ThemeMatch[] {
  const matches: ThemeMatch[] = [];

  for (const { theme, patterns } of COMMON_THEMES) {
    const matchCount = countPatternMatches(text, patterns);
    if (matchCount > 0) {
      matches.push({
        theme,
        strength: Math.min(1, matchCount / patterns.length),
      });
    }
  }

  return matches
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit);
}

// =============================================================================
// ACTIVITY RECORDING HELPER
// =============================================================================

// Type-safe interface for growth activity recording
export interface GrowthActivityInput {
  userId: string;
  activityType: string;
  referenceType: string;
  referenceId: string | null;
  pillarId: string;
  dimensionId: string;
  points: number;
  reason: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = { growthActivity: { create: (args: any) => Promise<any> } };

/**
 * Record a growth activity to the database
 * Common utility for recording dimension-affecting activities
 */
export async function recordGrowthActivity(
  prisma: PrismaLike,
  userId: string,
  activityType: string,
  referenceType: string,
  referenceId: string | null,
  pillarId: string,
  dimensionId: string,
  points: number,
  reason: string
): Promise<void> {
  try {
    await prisma.growthActivity.create({
      data: {
        userId,
        activityType,
        referenceType,
        referenceId,
        pillarId,
        dimensionId,
        points,
        reason,
      },
    });
  } catch (error) {
    console.error('Failed to record growth activity:', error);
    // Don't throw - this is a non-critical enhancement
  }
}

// =============================================================================
// TOKEN ESTIMATION
// =============================================================================

/**
 * Estimate token count from text
 * Uses the rough approximation of 4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// =============================================================================
// SAFETY RESOURCES
// =============================================================================

export const CRISIS_RESOURCES = {
  us: {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    text: 'Text 988',
    website: 'https://988lifeline.org',
  },
  uk: {
    name: 'Samaritans',
    phone: '116 123',
    website: 'https://samaritans.org',
  },
  crisis_text: {
    name: 'Crisis Text Line',
    text: 'Text HOME to 741741',
    website: 'https://crisistextline.org',
  },
};

export function buildCrisisResourcesText(): string {
  return `If you're in crisis:
- 988 Suicide & Crisis Lifeline: Call or text 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

You don't have to face this alone.`;
}
