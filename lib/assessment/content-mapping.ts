/**
 * CONTENT TO DIMENSION MAPPING
 *
 * Maps content (courses, articles, practices) to the dimensions they address.
 * Used for:
 * - Calculating estimated scores based on content completion
 * - Recommending content for specific dimensions
 * - Tracking growth activities
 */

import type { PillarId } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface ContentMapping {
  courses: string[];      // Course slugs
  articles: string[];     // Article slugs
  practices: string[];    // Practice slugs
}

export interface DimensionContent extends ContentMapping {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;
}

export interface ContentContribution {
  pillarId: PillarId;
  dimensionId: string;
  points: number;         // How many points this contributes
}

// =============================================================================
// MIND PILLAR CONTENT MAPPING
// =============================================================================

const MIND_CONTENT: Record<string, ContentMapping> = {
  'emotional-regulation': {
    courses: [
      'emotional-intelligence-101',
      'nervous-system-mastery',
      'emotional-alchemy',
      'anger-transformation',
      'anxiety-first-aid',
    ],
    articles: [
      'understanding-emotions',
      'emotion-regulation-techniques',
      'window-of-tolerance',
      'emotional-flooding',
      'feelings-wheel-guide',
    ],
    practices: [
      'box-breathing',
      'body-scan',
      'grounding-5-4-3-2-1',
      'emotional-naming',
      'containment-visualization',
    ],
  },

  'cognitive-flexibility': {
    courses: [
      'cognitive-reframing',
      'mindset-mastery',
      'perspective-taking',
    ],
    articles: [
      'cognitive-distortions',
      'growth-mindset',
      'mental-flexibility',
      'reframing-techniques',
      'black-white-thinking',
    ],
    practices: [
      'perspective-shift',
      'thought-defusion',
      'both-and-thinking',
      'curiosity-practice',
    ],
  },

  'self-awareness': {
    courses: [
      'shadow-work-foundations',
      'self-discovery-journey',
      'patterns-and-projections',
    ],
    articles: [
      'self-awareness-guide',
      'blind-spots',
      'internal-family-systems-intro',
      'projection-recognition',
      'metacognition-explained',
    ],
    practices: [
      'journaling-prompts',
      'parts-work-intro',
      'mirror-exercise',
      'trigger-tracking',
    ],
  },

  'present-moment': {
    courses: [
      'mindfulness-foundations',
      'presence-practice',
      'attention-training',
    ],
    articles: [
      'mindfulness-basics',
      'present-moment-awareness',
      'attention-focus',
      'rumination-breaking',
    ],
    practices: [
      'breath-awareness',
      'body-scan',
      'mindful-walking',
      'open-awareness',
      'noting-practice',
    ],
  },

  'thought-patterns': {
    courses: [
      'cognitive-reframing',
      'inner-critic-work',
      'rumination-recovery',
    ],
    articles: [
      'cognitive-distortions',
      'inner-critic-guide',
      'rumination-patterns',
      'catastrophizing',
      'self-talk-transformation',
    ],
    practices: [
      'thought-record',
      'inner-critic-dialogue',
      'worry-time',
      'thought-stopping',
    ],
  },

  'psychological-safety': {
    courses: [
      'nervous-system-mastery',
      'trauma-informed-foundations',
      'safety-anchoring',
    ],
    articles: [
      'polyvagal-theory-basics',
      'window-of-tolerance',
      'nervous-system-states',
      'safety-signals',
      'neuroception-explained',
    ],
    practices: [
      'vagal-toning',
      'safe-place-visualization',
      'grounding-5-4-3-2-1',
      'orienting-exercise',
      'co-regulation-practice',
    ],
  },

  'self-relationship': {
    courses: [
      'self-compassion-journey',
      'inner-child-healing',
      'self-acceptance-path',
    ],
    articles: [
      'self-compassion-guide',
      'inner-critic-vs-inner-ally',
      'self-acceptance',
      'self-trust-building',
      'befriending-yourself',
    ],
    practices: [
      'self-compassion-break',
      'loving-kindness-self',
      'inner-child-meditation',
      'self-appreciation',
    ],
  },

  'meaning-purpose': {
    courses: [
      'values-clarification',
      'purpose-discovery',
      'meaningful-living',
    ],
    articles: [
      'finding-your-values',
      'purpose-vs-goals',
      'meaning-making',
      'existential-clarity',
      'living-with-intention',
    ],
    practices: [
      'values-exploration',
      'life-purpose-meditation',
      'meaningful-moments',
      'legacy-reflection',
    ],
  },
};

// =============================================================================
// BODY PILLAR CONTENT MAPPING
// =============================================================================

const BODY_CONTENT: Record<string, ContentMapping> = {
  'interoception': {
    courses: [
      'body-awareness-basics',
      'somatic-sensing',
      'embodiment-101',
    ],
    articles: [
      'interoception-explained',
      'body-signals-guide',
      'somatic-awareness',
      'gut-feelings',
    ],
    practices: [
      'body-scan',
      'sensation-tracking',
      'interoceptive-meditation',
      'hunger-fullness-check',
    ],
  },

  'stress-physiology': {
    courses: [
      'nervous-system-mastery',
      'stress-resilience',
      'burnout-recovery',
    ],
    articles: [
      'stress-response-explained',
      'chronic-stress-effects',
      'recovery-science',
      'allostatic-load',
      'tension-patterns',
    ],
    practices: [
      'progressive-relaxation',
      'tension-release',
      'recovery-breathing',
      'stress-reset',
    ],
  },

  'sleep-restoration': {
    courses: [
      'sleep-optimization',
      'rest-and-recovery',
    ],
    articles: [
      'sleep-science',
      'circadian-rhythm',
      'sleep-hygiene',
      'restorative-rest',
    ],
    practices: [
      'sleep-preparation',
      'body-scan-for-sleep',
      'wind-down-routine',
      'yoga-nidra',
    ],
  },

  'energy-vitality': {
    courses: [
      'energy-management',
      'vitality-optimization',
    ],
    articles: [
      'energy-cycles',
      'fatigue-patterns',
      'vitality-foundations',
      'sustainable-energy',
    ],
    practices: [
      'energy-check-in',
      'energizing-breath',
      'vitality-movement',
    ],
  },

  'movement-capacity': {
    courses: [
      'movement-foundations',
      'functional-fitness',
      'mobility-mastery',
    ],
    articles: [
      'movement-for-wellbeing',
      'body-confidence',
      'physical-literacy',
      'joyful-movement',
    ],
    practices: [
      'morning-movement',
      'mobility-routine',
      'playful-movement',
      'strength-basics',
    ],
  },

  'nourishment': {
    courses: [
      'intuitive-eating',
      'mindful-eating',
      'food-relationship-healing',
    ],
    articles: [
      'intuitive-eating-basics',
      'hunger-fullness-signals',
      'emotional-eating',
      'food-freedom',
    ],
    practices: [
      'mindful-eating-exercise',
      'hunger-scale-check',
      'food-body-connection',
    ],
  },

  'embodied-presence': {
    courses: [
      'embodiment-101',
      'somatic-presence',
      'body-psychotherapy-basics',
    ],
    articles: [
      'embodiment-explained',
      'living-in-your-body',
      'somatic-expression',
      'body-as-home',
    ],
    practices: [
      'embodiment-meditation',
      'expressive-movement',
      'body-inhabiting',
      'somatic-grounding',
    ],
  },
};

// =============================================================================
// SOUL PILLAR CONTENT MAPPING
// =============================================================================

const SOUL_CONTENT: Record<string, ContentMapping> = {
  'authenticity': {
    courses: [
      'authentic-self-discovery',
      'masks-and-true-self',
      'living-authentically',
    ],
    articles: [
      'authenticity-guide',
      'people-pleasing-patterns',
      'true-self-vs-false-self',
      'integrity-living',
    ],
    practices: [
      'authenticity-check-in',
      'values-alignment',
      'mask-exploration',
      'truth-speaking',
    ],
  },

  'existential-grounding': {
    courses: [
      'existential-foundations',
      'mortality-and-meaning',
      'uncertainty-tolerance',
    ],
    articles: [
      'existential-questions',
      'mortality-awareness',
      'living-with-uncertainty',
      'meaning-after-loss',
    ],
    practices: [
      'death-contemplation',
      'impermanence-meditation',
      'meaning-making-reflection',
    ],
  },

  'transcendence': {
    courses: [
      'spiritual-awakening',
      'transcendence-practices',
      'awe-and-wonder',
    ],
    articles: [
      'transcendent-experiences',
      'awe-science',
      'interconnection',
      'peak-experiences',
    ],
    practices: [
      'awe-walk',
      'gratitude-expansion',
      'nature-connection',
      'unity-meditation',
    ],
  },

  'shadow-integration': {
    courses: [
      'shadow-work-foundations',
      'shadow-integration-deep',
      'reclaiming-the-shadow',
    ],
    articles: [
      'shadow-self-explained',
      'projection-patterns',
      'shadow-gifts',
      'integration-process',
    ],
    practices: [
      'shadow-journaling',
      'projection-work',
      'parts-dialogue',
      'shadow-meditation',
    ],
  },

  'creative-expression': {
    courses: [
      'creative-unblocking',
      'expressive-arts',
      'creativity-as-healing',
    ],
    articles: [
      'creativity-and-healing',
      'creative-blocks',
      'expressive-writing',
      'art-therapy-basics',
    ],
    practices: [
      'free-writing',
      'creative-movement',
      'art-expression',
      'creative-play',
    ],
  },

  'life-engagement': {
    courses: [
      'vitality-and-engagement',
      'flow-states',
      'passionate-living',
    ],
    articles: [
      'engagement-vs-numbing',
      'flow-explained',
      'aliveness-practices',
      'depression-to-engagement',
    ],
    practices: [
      'engagement-inventory',
      'aliveness-check-in',
      'passion-exploration',
      'flow-activities',
    ],
  },

  'inner-wisdom': {
    courses: [
      'intuition-development',
      'inner-guidance',
      'wisdom-traditions',
    ],
    articles: [
      'intuition-vs-fear',
      'inner-knowing',
      'trusting-yourself',
      'wisdom-access',
    ],
    practices: [
      'intuition-meditation',
      'inner-guidance-dialogue',
      'wisdom-journaling',
      'gut-check-practice',
    ],
  },

  'spiritual-practice': {
    courses: [
      'meditation-foundations',
      'contemplative-practice',
      'spiritual-development',
    ],
    articles: [
      'starting-a-practice',
      'meditation-types',
      'spiritual-routines',
      'deepening-practice',
    ],
    practices: [
      'sitting-meditation',
      'contemplative-prayer',
      'walking-meditation',
      'devotional-practice',
    ],
  },
};

// =============================================================================
// RELATIONSHIPS PILLAR CONTENT MAPPING
// =============================================================================

const RELATIONSHIPS_CONTENT: Record<string, ContentMapping> = {
  'attachment-patterns': {
    courses: [
      'attachment-healing',
      'earned-secure-attachment',
      'relationship-patterns',
    ],
    articles: [
      'attachment-styles-explained',
      'anxious-attachment',
      'avoidant-attachment',
      'disorganized-attachment',
      'secure-attachment-building',
    ],
    practices: [
      'attachment-reflection',
      'safe-base-visualization',
      'self-soothing-anxious',
      'opening-up-avoidant',
    ],
  },

  'communication': {
    courses: [
      'nonviolent-communication',
      'relationship-communication',
      'difficult-conversations',
    ],
    articles: [
      'communication-basics',
      'active-listening',
      'expressing-needs',
      'conflict-communication',
    ],
    practices: [
      'reflective-listening',
      'i-statements',
      'needs-identification',
      'repair-conversation',
    ],
  },

  'boundaries': {
    courses: [
      'boundary-foundations',
      'healthy-boundaries',
      'codependency-recovery',
    ],
    articles: [
      'boundary-basics',
      'saying-no',
      'porous-vs-rigid-boundaries',
      'boundary-violations',
    ],
    practices: [
      'boundary-inventory',
      'no-practice',
      'boundary-visualization',
      'limit-setting',
    ],
  },

  'conflict-repair': {
    courses: [
      'conflict-resolution',
      'relationship-repair',
      'fighting-fair',
    ],
    articles: [
      'conflict-styles',
      'repair-attempts',
      'forgiveness-process',
      'rupture-and-repair',
    ],
    practices: [
      'conflict-reflection',
      'repair-initiation',
      'forgiveness-meditation',
      'letting-go-practice',
    ],
  },

  'trust-vulnerability': {
    courses: [
      'vulnerability-practice',
      'trust-building',
      'intimacy-foundations',
    ],
    articles: [
      'vulnerability-explained',
      'trust-after-betrayal',
      'opening-up',
      'emotional-risk-taking',
    ],
    practices: [
      'vulnerability-small-steps',
      'trust-reflection',
      'sharing-practice',
      'receiving-practice',
    ],
  },

  'empathy-attunement': {
    courses: [
      'empathy-development',
      'emotional-intelligence-relationships',
      'attunement-practice',
    ],
    articles: [
      'empathy-vs-sympathy',
      'attunement-explained',
      'reading-emotions',
      'empathic-response',
    ],
    practices: [
      'empathy-meditation',
      'perspective-taking',
      'emotional-mirroring',
      'attunement-exercise',
    ],
  },

  'intimacy-depth': {
    courses: [
      'deepening-intimacy',
      'relationship-depth',
      'emotional-intimacy',
    ],
    articles: [
      'intimacy-types',
      'fear-of-intimacy',
      'deepening-connection',
      'vulnerability-and-intimacy',
    ],
    practices: [
      'intimacy-questions',
      'eye-gazing',
      'appreciation-sharing',
      'deep-listening',
    ],
  },

  'social-connection': {
    courses: [
      'building-community',
      'friendship-foundations',
      'belonging-practice',
    ],
    articles: [
      'loneliness-and-connection',
      'building-friendships',
      'community-finding',
      'social-skills',
    ],
    practices: [
      'connection-inventory',
      'reaching-out',
      'community-engagement',
      'social-risk-taking',
    ],
  },

  'relational-patterns': {
    courses: [
      'relationship-patterns',
      'family-systems-intro',
      'relational-awareness',
    ],
    articles: [
      'relationship-patterns-guide',
      'family-of-origin',
      'repetition-compulsion',
      'changing-patterns',
    ],
    practices: [
      'pattern-mapping',
      'family-reflection',
      'relationship-timeline',
      'pattern-interruption',
    ],
  },
};

// =============================================================================
// COMBINED MAPPING
// =============================================================================

export const DIMENSION_CONTENT_MAP: Record<PillarId, Record<string, ContentMapping>> = {
  mind: MIND_CONTENT,
  body: BODY_CONTENT,
  soul: SOUL_CONTENT,
  relationships: RELATIONSHIPS_CONTENT,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get content mapping for a specific dimension
 */
export function getContentForDimension(
  pillarId: PillarId,
  dimensionId: string
): ContentMapping | null {
  return DIMENSION_CONTENT_MAP[pillarId]?.[dimensionId] || null;
}

/**
 * Find which dimensions a piece of content addresses
 */
export function getDimensionsForContent(
  contentType: 'course' | 'article' | 'practice',
  slug: string
): ContentContribution[] {
  const contributions: ContentContribution[] = [];
  const key = contentType === 'course' ? 'courses' :
              contentType === 'article' ? 'articles' : 'practices';

  for (const [pillarId, dimensions] of Object.entries(DIMENSION_CONTENT_MAP)) {
    for (const [dimensionId, content] of Object.entries(dimensions)) {
      const contentList = content[key];
      if (contentList.includes(slug)) {
        contributions.push({
          pillarId: pillarId as PillarId,
          dimensionId,
          points: getPointsForContentType(contentType),
        });
      }
    }
  }

  return contributions;
}

/**
 * Get default points for content type
 */
export function getPointsForContentType(
  contentType: 'course' | 'article' | 'practice'
): number {
  switch (contentType) {
    case 'course':
      return 8;  // Courses are substantial
    case 'article':
      return 3;  // Articles are lighter
    case 'practice':
      return 2;  // Practices accumulate over time
    default:
      return 1;
  }
}

/**
 * Get all content for a pillar
 */
export function getAllContentForPillar(pillarId: PillarId): DimensionContent[] {
  const pillarContent = DIMENSION_CONTENT_MAP[pillarId];
  if (!pillarContent) return [];

  return Object.entries(pillarContent).map(([dimensionId, content]) => ({
    pillarId,
    dimensionId,
    dimensionName: dimensionId, // Would ideally look up from framework
    ...content,
  }));
}

/**
 * Check if content exists in mapping
 */
export function isContentMapped(
  contentType: 'course' | 'article' | 'practice',
  slug: string
): boolean {
  return getDimensionsForContent(contentType, slug).length > 0;
}
