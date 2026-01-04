/**
 * Dream Analysis Library
 *
 * Professional-grade dream interpretation system drawing from:
 * - Jungian depth psychology & archetypal analysis
 * - Contemporary dream research (Hartmann, Domhoff)
 * - Trauma-informed approaches (EMDR, Somatic Experiencing)
 * - Cross-cultural symbol systems
 *
 * Key principles:
 * - The dreamer is the ultimate authority on their dream's meaning
 * - Dreams serve multiple functions (processing, compensation, guidance)
 * - Trauma content requires special handling
 * - Cultural context shapes symbol meaning
 */

// =============================================================================
// DREAM TYPE CLASSIFICATION
// =============================================================================

export type DreamType =
  | 'processing'    // Mundane, daily life processing
  | 'anxiety'       // Stress/worry manifestation
  | 'nightmare'     // Intense fear, may be trauma-related
  | 'recurring'     // Repeated pattern, unresolved issue
  | 'lucid'         // Aware of dreaming
  | 'numinous'      // Spiritual, transcendent, profound
  | 'compensatory'  // Balancing waking attitude
  | 'prospective'   // Future-oriented, problem-solving
  | 'somatic'       // Body-focused, health-related
  | 'visitation'    // Deceased person appears
  | 'archetypal'    // Major archetypal themes
  | 'standard';     // General dream

export interface DreamClassification {
  primaryType: DreamType;
  secondaryTypes: DreamType[];
  confidence: number; // 0-1
  flags: {
    traumaIndicators: boolean;
    crisisIndicators: boolean;
    spiritualContent: boolean;
    somaticContent: boolean;
    relationshipFocus: boolean;
  };
  intensityLevel: 'low' | 'moderate' | 'high' | 'extreme';
}

// Trauma/nightmare indicators
const TRAUMA_PATTERNS = [
  /\b(attack|attacked|attacking)\b/i,
  /\b(chase|chased|chasing|pursued|hunting)\b/i,
  /\b(scream|screaming|couldn't scream|no voice)\b/i,
  /\b(paralyz|frozen|couldn't move|stuck)\b/i,
  /\b(terror|terrified|horrif|petrified)\b/i,
  /\b(rape|assault|abuse|molest|violat)\b/i,
  /\b(blood|bleeding|wound|stab|shot)\b/i,
  /\b(drown|suffocate|choke|can't breathe)\b/i,
  /\b(war|bomb|explosion|gun|weapon)\b/i,
  /\b(trapped|locked|prison|cage|escape)\b/i,
  /\b(helpless|powerless|vulnerable)\b/i,
  /\b(dark figure|shadow figure|intruder|stranger)\b/i,
];

// Numinous/spiritual indicators
const NUMINOUS_PATTERNS = [
  /\b(god|goddess|divine|sacred|holy)\b/i,
  /\b(angel|spirit|soul|transcend)\b/i,
  /\b(light|glow|radiant|luminous|golden)\b/i,
  /\b(heaven|paradise|afterlife|other side)\b/i,
  /\b(peace|bliss|ecstasy|profound)\b/i,
  /\b(message|revelation|vision|prophecy)\b/i,
  /\b(transform|metamorphosis|rebirth)\b/i,
  /\b(cosmic|universe|infinite|eternal)\b/i,
  /\b(wise (old )?man|wise (old )?woman|sage|elder|guide)\b/i,
  /\b(mandala|symbol|archetypal)\b/i,
];

// Anxiety/stress indicators
const ANXIETY_PATTERNS = [
  /\b(late|running late|missed|unprepared)\b/i,
  /\b(exam|test|presentation|interview)\b/i,
  /\b(naked|exposed|embarrass)\b/i,
  /\b(lost|can't find|searching|looking for)\b/i,
  /\b(fall|falling|drop)\b/i,
  /\b(teeth falling|teeth crumbling|losing teeth)\b/i,
  /\b(forgot|forgotten|can't remember)\b/i,
  /\b(deadline|pressure|overwhelm)\b/i,
  /\b(wrong|mistake|failure|fail)\b/i,
];

// Somatic/body indicators
const SOMATIC_PATTERNS = [
  /\b(body|physical|sensation|felt in my)\b/i,
  /\b(pain|ache|hurt|injury|wound)\b/i,
  /\b(sick|ill|disease|cancer|dying)\b/i,
  /\b(heart|stomach|chest|head|back)\b/i,
  /\b(pregnant|birth|baby|womb)\b/i,
  /\b(surgery|hospital|doctor|medical)\b/i,
  /\b(heat|cold|numb|tingling)\b/i,
];

// Visitation dream indicators
const VISITATION_PATTERNS = [
  /\b(deceased|dead|passed away|who died)\b/i,
  /\b(grandmother|grandfather|grandma|grandpa) (who|that) (died|passed)\b/i,
  /\b(my (late|deceased) (father|mother|parent|friend|partner))\b/i,
  /\b(came to me|visited me|appeared to me)\b/i,
  /\b(said goodbye|message from|told me)\b/i,
];

// Processing/mundane indicators
const PROCESSING_PATTERNS = [
  /\b(work|office|job|meeting|email)\b/i,
  /\b(grocery|shopping|cooking|cleaning)\b/i,
  /\b(driving|commute|traffic)\b/i,
  /\b(phone|texting|scrolling)\b/i,
  /\b(normal|regular|usual|ordinary)\b/i,
];

/**
 * Classify a dream by type and characteristics
 */
export function classifyDream(
  content: string,
  emotions: string[] = [],
  isRecurring: boolean = false,
  isLucid: boolean = false
): DreamClassification {
  const text = content.toLowerCase();
  const emotionText = emotions.join(' ').toLowerCase();

  const scores: Record<DreamType, number> = {
    processing: 0,
    anxiety: 0,
    nightmare: 0,
    recurring: 0,
    lucid: 0,
    numinous: 0,
    compensatory: 0,
    prospective: 0,
    somatic: 0,
    visitation: 0,
    archetypal: 0,
    standard: 1, // baseline
  };

  // Check patterns
  const traumaScore = TRAUMA_PATTERNS.filter(p => p.test(text)).length;
  const numinousScore = NUMINOUS_PATTERNS.filter(p => p.test(text)).length;
  const anxietyScore = ANXIETY_PATTERNS.filter(p => p.test(text)).length;
  const somaticScore = SOMATIC_PATTERNS.filter(p => p.test(text)).length;
  const visitationScore = VISITATION_PATTERNS.filter(p => p.test(text)).length;
  const processingScore = PROCESSING_PATTERNS.filter(p => p.test(text)).length;

  // Score dream types
  if (traumaScore >= 3) scores.nightmare = traumaScore * 2;
  else if (traumaScore >= 1) scores.nightmare = traumaScore;

  if (numinousScore >= 2) scores.numinous = numinousScore * 2;
  if (anxietyScore >= 2) scores.anxiety = anxietyScore * 1.5;
  if (somaticScore >= 2) scores.somatic = somaticScore;
  if (visitationScore >= 1) scores.visitation = visitationScore * 2;
  if (processingScore >= 2) scores.processing = processingScore + 2;

  // Emotion modifiers
  const negativeEmotions = ['fear', 'terror', 'anxiety', 'panic', 'dread', 'horror'];
  const positiveEmotions = ['peace', 'joy', 'love', 'awe', 'wonder', 'bliss'];

  if (emotions.some(e => negativeEmotions.includes(e.toLowerCase()))) {
    scores.nightmare += 2;
    scores.anxiety += 1;
  }
  if (emotions.some(e => positiveEmotions.includes(e.toLowerCase()))) {
    scores.numinous += 1;
  }

  // Explicit flags
  if (isRecurring) scores.recurring = 5;
  if (isLucid) scores.lucid = 5;

  // Determine primary and secondary types
  const sortedTypes = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const primaryType = sortedTypes[0]?.[0] as DreamType || 'standard';
  const secondaryTypes = sortedTypes
    .slice(1, 3)
    .filter(([_, score]) => score >= 2)
    .map(([type]) => type as DreamType);

  // Calculate intensity
  const maxScore = sortedTypes[0]?.[1] || 0;
  let intensityLevel: 'low' | 'moderate' | 'high' | 'extreme';
  if (traumaScore >= 4 || maxScore >= 8) intensityLevel = 'extreme';
  else if (traumaScore >= 2 || maxScore >= 5) intensityLevel = 'high';
  else if (maxScore >= 3) intensityLevel = 'moderate';
  else intensityLevel = 'low';

  return {
    primaryType,
    secondaryTypes,
    confidence: Math.min(1, maxScore / 10),
    flags: {
      traumaIndicators: traumaScore >= 2,
      crisisIndicators: traumaScore >= 4 || /\b(suicide|kill myself|end it)\b/i.test(text),
      spiritualContent: numinousScore >= 2,
      somaticContent: somaticScore >= 2,
      relationshipFocus: /\b(mother|father|partner|ex|family|friend|lover)\b/i.test(text),
    },
    intensityLevel,
  };
}

// =============================================================================
// CULTURAL/SPIRITUAL CONTEXT
// =============================================================================

export type CulturalContext =
  | 'western-secular'     // Default: Jungian/Western psychology
  | 'western-christian'   // Christian symbolism emphasized
  | 'jewish'              // Jewish dream interpretation tradition
  | 'islamic'             // Islamic dream interpretation (ta'bir)
  | 'hindu'               // Hindu/Vedantic traditions
  | 'buddhist'            // Buddhist perspectives
  | 'indigenous'          // Indigenous/shamanic traditions
  | 'east-asian'          // Chinese/Japanese/Korean
  | 'african'             // African traditional
  | 'eclectic';           // Mix of traditions

export const CULTURAL_CONTEXT_PROMPTS: Record<CulturalContext, string> = {
  'western-secular': `Interpret using depth psychology (Jung, Freud) and contemporary dream research. Focus on psychological meaning, shadow work, and individuation. Use secular, psychological language.`,

  'western-christian': `Honor Christian spiritual symbolism alongside psychological interpretation. Consider biblical archetypes (water as baptism/purification, light as divine presence, serpent as temptation or wisdom). If appropriate, consider whether the dream might contain spiritual guidance or consolation.`,

  'jewish': `Draw from Jewish dream interpretation tradition (Talmudic perspectives) where dreams may contain divine communication. Consider that "a dream not interpreted is like a letter unread." Honor symbols from Jewish tradition while exploring psychological meaning.`,

  'islamic': `Honor Islamic dream interpretation tradition (ta'bir al-ru'ya). Consider three categories: true dreams (from Allah), self-reflection dreams, and disturbing dreams (from Shaytan). For potentially significant dreams, suggest the dreamer seek counsel from someone knowledgeable. Approach with appropriate reverence.`,

  'hindu': `Draw from Hindu/Vedantic dream traditions. Consider the three states of consciousness (waking, dreaming, deep sleep) and their relationship to Atman. Honor symbols from Hindu tradition (lotus, elephant, rivers, deities). Consider both psychological and spiritual dimensions.`,

  'buddhist': `Consider Buddhist perspectives on dreams as mental formations (sankhara). Explore what attachments, aversions, or delusions might be arising. Consider mindfulness of dream content without excessive elaboration. Honor the teaching that dreams can offer insight into our conditioning.`,

  'indigenous': `Approach with respect for indigenous/shamanic dream traditions that view dreams as spirit communication, ancestral guidance, or journeys to other realms. Honor that dream figures may be beings in their own right. Suggest the dreamer might share with an elder or traditional practitioner if culturally appropriate.`,

  'east-asian': `Consider East Asian dream symbolism (Chinese, Japanese, Korean traditions). Honor cultural symbols: dragons (transformation, power), phoenix (renewal), water (fortune, emotion), ancestors (guidance). Consider dreams may carry messages about family, ancestors, or fate.`,

  'african': `Approach with respect for African traditional perspectives on dreams as communication from ancestors, spirits, or the divine. Dreams may contain warnings, guidance, or prophetic content. Suggest the dreamer might share with family elders if culturally appropriate.`,

  'eclectic': `Draw from multiple wisdom traditions while maintaining psychological grounding. Honor that the dreamer's own cultural and spiritual background shapes meaning. Weave together depth psychology with spiritual perspectives as appropriate to the dream content.`,
};

// =============================================================================
// INTERPRETATION DEPTH PROFILES
// =============================================================================

export interface InterpretationProfile {
  responseLength: string;
  focusAreas: string[];
  tone: string;
  includeResources: boolean;
  includeGrounding: boolean;
  includeQuestions: number;
  safetyFirst: boolean;
}

export function getInterpretationProfile(
  classification: DreamClassification,
  isFirstDream: boolean = false
): InterpretationProfile {

  // Nightmare/trauma dreams - safety first
  if (classification.primaryType === 'nightmare' || classification.flags.traumaIndicators) {
    return {
      responseLength: '200-350 words',
      focusAreas: [
        'Acknowledge the intensity of the experience',
        'Normalize that nightmares often process difficult experiences',
        'Gentle exploration of what might be asking for attention',
        'Grounding and safety resources',
      ],
      tone: 'Calm, grounding, validating. Not analytical or interpretive.',
      includeResources: true,
      includeGrounding: true,
      includeQuestions: 1,
      safetyFirst: true,
    };
  }

  // Numinous/spiritual dreams - honor the depth
  if (classification.primaryType === 'numinous' || classification.flags.spiritualContent) {
    return {
      responseLength: '300-500 words',
      focusAreas: [
        'Honor the profound nature of the experience',
        'Explore archetypal and spiritual dimensions',
        'Consider the dream as potentially transformative',
        'Suggest ways to honor or integrate the experience',
      ],
      tone: 'Reverential, curious, open to mystery. Not reductive.',
      includeResources: false,
      includeGrounding: false,
      includeQuestions: 3,
      safetyFirst: false,
    };
  }

  // Processing/mundane dreams - keep it light
  if (classification.primaryType === 'processing' || classification.intensityLevel === 'low') {
    return {
      responseLength: '100-150 words',
      focusAreas: [
        'Acknowledge this may be simple processing',
        'Ask if anything felt significant to THEM',
        'Light reflection without over-interpretation',
      ],
      tone: 'Casual, conversational, not overly analytical.',
      includeResources: false,
      includeGrounding: false,
      includeQuestions: 1,
      safetyFirst: false,
    };
  }

  // Visitation dreams - special care
  if (classification.primaryType === 'visitation') {
    return {
      responseLength: '200-300 words',
      focusAreas: [
        'Honor the significance of the encounter',
        'Explore what the deceased person might represent',
        'Consider both psychological and spiritual dimensions',
        'Acknowledge grief and ongoing connection',
      ],
      tone: 'Gentle, honoring, open to multiple interpretations.',
      includeResources: false,
      includeGrounding: false,
      includeQuestions: 2,
      safetyFirst: false,
    };
  }

  // Recurring dreams - pattern focus
  if (classification.primaryType === 'recurring') {
    return {
      responseLength: '250-400 words',
      focusAreas: [
        'Explore what keeps returning and why',
        'Look for evolution in the recurring pattern',
        'Consider what remains unresolved',
        'Suggest ways to work with the pattern',
      ],
      tone: 'Curious, pattern-oriented, empowering.',
      includeResources: false,
      includeGrounding: false,
      includeQuestions: 3,
      safetyFirst: false,
    };
  }

  // Default: moderate depth
  return {
    responseLength: '200-350 words',
    focusAreas: [
      'Symbol exploration with openness',
      'Emotional landscape and meaning',
      'Possible connections to waking life',
      'Integration questions',
    ],
    tone: 'Warm, curious, grounded. Professional but accessible.',
    includeResources: false,
    includeGrounding: false,
    includeQuestions: 2,
    safetyFirst: false,
  };
}

// =============================================================================
// ACTIVE IMAGINATION PROMPTS
// =============================================================================

export interface ActiveImaginationPrompt {
  type: 'dialogue' | 'continuation' | 'transformation' | 'embodiment' | 'artwork';
  prompt: string;
  guidance: string;
}

export function generateActiveImaginationPrompts(
  dreamContent: string,
  classification: DreamClassification
): ActiveImaginationPrompt[] {
  const prompts: ActiveImaginationPrompt[] = [];

  // Don't suggest active imagination for trauma content
  if (classification.flags.traumaIndicators || classification.flags.crisisIndicators) {
    return [{
      type: 'embodiment',
      prompt: 'Notice where you feel this dream in your body right now.',
      guidance: 'If the sensations feel overwhelming, you can imagine placing them in a container, or simply return your attention to the soles of your feet touching the ground.',
    }];
  }

  // Extract potential figures for dialogue
  const figurePatterns = [
    /\b(a |an |the )?(man|woman|person|figure|child|elder|stranger|animal|creature)\b/gi,
    /\b(my )?(mother|father|grandmother|grandfather|friend|partner|ex|boss)\b/gi,
  ];

  const figures: string[] = [];
  for (const pattern of figurePatterns) {
    const matches = dreamContent.match(pattern);
    if (matches) {
      figures.push(...matches.slice(0, 2));
    }
  }

  if (figures.length > 0) {
    prompts.push({
      type: 'dialogue',
      prompt: `If you could speak with ${figures[0]} from your dream, what would you want to ask or say?`,
      guidance: 'Close your eyes and imagine this figure before you. Speak to them from your heart, then pause and listen for their response. Write down what emerges, even if it surprises you.',
    });
  }

  // Continuation for unfinished dreams
  if (dreamContent.includes('woke up') || dreamContent.includes('then I woke')) {
    prompts.push({
      type: 'continuation',
      prompt: 'If this dream could continue, what would happen next?',
      guidance: 'Allow your imagination to continue the dream story. Don\'t force it—let images arise naturally. Notice what wants to unfold.',
    });
  }

  // Transformation for threatening elements
  if (classification.primaryType === 'anxiety' || classification.flags.traumaIndicators === false && /\b(scary|frightening|threatening|monster|enemy)\b/i.test(dreamContent)) {
    prompts.push({
      type: 'transformation',
      prompt: 'If you could face what frightened you in this dream with courage, what would you do or say?',
      guidance: 'Imagine yourself with all the strength and resources you need. What happens when you turn to face what was threatening? Sometimes our dream fears transform when met directly.',
    });
  }

  // Embodiment for somatic dreams
  if (classification.flags.somaticContent) {
    prompts.push({
      type: 'embodiment',
      prompt: 'Where do you feel this dream in your body right now?',
      guidance: 'Scan your body slowly. Notice any areas of tension, warmth, coolness, or sensation. These body feelings are part of the dream\'s message.',
    });
  }

  // Artwork for numinous/archetypal
  if (classification.primaryType === 'numinous' || classification.primaryType === 'archetypal') {
    prompts.push({
      type: 'artwork',
      prompt: 'Consider expressing this dream through art, movement, or writing.',
      guidance: 'Dreams often speak in images and feelings rather than words. Drawing, painting, dancing, or free-writing the dream can unlock meanings that analysis cannot reach.',
    });
  }

  return prompts.slice(0, 3);
}

// =============================================================================
// GROUNDING RESOURCES
// =============================================================================

export const GROUNDING_SCRIPT = `**If this dream brought up difficult feelings, here's a simple grounding exercise:**

Take a slow breath. Feel your feet on the floor. Look around and name 5 things you can see. Notice 4 things you can touch. Listen for 3 sounds. Find 2 scents. Notice 1 thing you can taste.

You are here, now, awake and safe.`;

export const NIGHTMARE_RESOURCES = `**Resources for Recurring Nightmares:**
- Image Rehearsal Therapy (IRT): Rewrite the nightmare ending while awake, then rehearse the new version
- If nightmares persist or relate to trauma, a therapist trained in trauma can help
- The 988 Suicide & Crisis Lifeline is available 24/7 if you're struggling`;

// =============================================================================
// SYMBOL ENHANCEMENT
// =============================================================================

export interface EnhancedSymbol {
  symbol: string;
  universalMeanings: string[];
  jungianPerspective?: string;
  questions: string[];
  culturalVariations?: Record<string, string>;
}

// Extended archetypal symbol dictionary
export const ENHANCED_SYMBOLS: Record<string, EnhancedSymbol> = {
  water: {
    symbol: 'water',
    universalMeanings: ['emotions', 'the unconscious', 'purification', 'life force', 'flow'],
    jungianPerspective: 'Water often represents the unconscious—its state (calm, turbulent, murky, clear) reflects your relationship with unconscious material.',
    questions: [
      'What was the quality of the water—clear, murky, calm, turbulent?',
      'Were you in the water, observing it, or affected by it?',
      'What emotions arise when you recall the water?',
    ],
    culturalVariations: {
      christian: 'Baptism, purification, the Holy Spirit',
      hindu: 'Sacred rivers (Ganga), purification, life-giving',
      chinese: 'Wealth, wisdom, adaptability',
    },
  },
  snake: {
    symbol: 'snake',
    universalMeanings: ['transformation', 'healing', 'hidden fears', 'kundalini energy', 'wisdom'],
    jungianPerspective: 'The serpent is one of the oldest archetypal symbols—representing both danger and healing (as in the caduceus), both fall and wisdom.',
    questions: [
      'Was the snake threatening or neutral/beneficial?',
      'What was your response—fear, fascination, or something else?',
      'Is there something in your life undergoing transformation?',
    ],
    culturalVariations: {
      christian: 'Temptation, evil, but also wisdom ("wise as serpents")',
      hindu: 'Kundalini energy, Shiva, transformation',
      indigenous: 'Often a powerful spirit, healer, or ancestor',
    },
  },
  death: {
    symbol: 'death',
    universalMeanings: ['endings', 'transformation', 'letting go', 'new beginnings', 'fear of change'],
    jungianPerspective: 'Death in dreams rarely predicts literal death. More often it signals the end of a phase, identity, or way of being—making room for rebirth.',
    questions: [
      'What is ending or needs to end in your life?',
      'Is there an old identity or pattern ready to die?',
      'What might be born from this ending?',
    ],
  },
  house: {
    symbol: 'house',
    universalMeanings: ['the self', 'psyche', 'body', 'different aspects of personality'],
    jungianPerspective: 'Houses often represent the Self—different rooms are different aspects of psyche. The condition of the house reflects inner state. Basements are unconscious; attics are higher consciousness or forgotten aspects.',
    questions: [
      'What part of the house were you in?',
      'What was the condition—familiar, strange, damaged, expanding?',
      'Do you recognize this house from waking life?',
    ],
  },
  flying: {
    symbol: 'flying',
    universalMeanings: ['freedom', 'transcendence', 'escape', 'aspiration', 'rising above'],
    jungianPerspective: 'Flying dreams often emerge when we\'re gaining perspective, breaking free from limitations, or needing to "rise above" a situation. Pay attention to how you\'re flying—effortlessly or struggling.',
    questions: [
      'How did it feel to fly—exhilarating, frightening, effortful?',
      'Were you flying toward something or away from something?',
      'Where in your life do you need more freedom or perspective?',
    ],
  },
  falling: {
    symbol: 'falling',
    universalMeanings: ['loss of control', 'anxiety', 'letting go', 'fear of failure', 'descent into unconscious'],
    jungianPerspective: 'Falling can represent losing control, but also a necessary descent—sometimes we must fall to reach deeper ground. The feeling matters: terror vs. surrender.',
    questions: [
      'Were you falling into something or just falling?',
      'What was the feeling—panic or surrender?',
      'Where in your life do you feel you\'re losing footing?',
    ],
  },
  chase: {
    symbol: 'chase/being chased',
    universalMeanings: ['avoidance', 'anxiety', 'something demanding attention', 'running from shadow'],
    jungianPerspective: 'What chases us in dreams is often our own shadow—disowned parts of ourselves. The pursuer wants integration, not destruction. Consider what you\'re running from in waking life.',
    questions: [
      'Who or what was chasing you?',
      'What would happen if you stopped and faced it?',
      'What are you running from in waking life?',
    ],
  },
  teeth: {
    symbol: 'teeth (falling out)',
    universalMeanings: ['anxiety about appearance', 'powerlessness', 'communication issues', 'loss', 'aging'],
    jungianPerspective: 'Teeth are tools of power—we bite, chew, speak with them. Losing teeth may reflect feelings of powerlessness, difficulty expressing oneself, or anxiety about how we appear to others.',
    questions: [
      'Are you feeling powerless or unable to express yourself?',
      'Is there something you\'re afraid of losing?',
      'Are there words you\'ve been unable to speak?',
    ],
  },
  child: {
    symbol: 'child',
    universalMeanings: ['innocence', 'inner child', 'new beginning', 'vulnerability', 'potential'],
    jungianPerspective: 'The Divine Child archetype represents new possibilities, authenticity, and the eternal aspect of self. A neglected child may indicate neglected aspects of your authentic nature.',
    questions: [
      'What was the child\'s condition—healthy, neglected, in danger?',
      'Did you recognize this child?',
      'What part of your own innocence or potential is this child showing you?',
    ],
  },
  shadow_figure: {
    symbol: 'shadow/dark figure',
    universalMeanings: ['unknown aspects of self', 'repressed material', 'fear', 'potential'],
    jungianPerspective: 'The Shadow contains everything we\'ve rejected about ourselves—but also gold. Shadow figures want integration. They often transform when faced directly.',
    questions: [
      'What qualities did this figure embody?',
      'Could these be qualities you\'ve rejected in yourself?',
      'What would happen if you befriended this figure?',
    ],
  },
};

/**
 * Get enhanced symbol information if available
 */
export function getEnhancedSymbol(symbol: string): EnhancedSymbol | null {
  const normalized = symbol.toLowerCase().trim();

  // Direct match
  if (ENHANCED_SYMBOLS[normalized]) {
    return ENHANCED_SYMBOLS[normalized];
  }

  // Partial match
  for (const [key, value] of Object.entries(ENHANCED_SYMBOLS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

// =============================================================================
// PROFESSIONAL INTERPRETATION PROMPT BUILDER
// =============================================================================

export interface InterpretationContext {
  dreamContent: string;
  symbols: string[];
  emotions: string[];
  isRecurring: boolean;
  isLucid: boolean;
  userContext?: string;
  culturalContext: CulturalContext;
  personalSymbols: Array<{ symbol: string; meaning: string; count: number }>;
  assessmentProfile?: string;
  recentDreamPatterns?: string;
  classification: DreamClassification;
}

export function buildProfessionalPrompt(context: InterpretationContext): string {
  const profile = getInterpretationProfile(context.classification);
  const culturalGuidance = CULTURAL_CONTEXT_PROMPTS[context.culturalContext];

  let systemPrompt = `You are a professional dream analyst drawing from depth psychology, Jungian analysis, contemporary dream research, and trauma-informed practice.

## Your Approach

${culturalGuidance}

## Core Principles

1. **The dreamer is the authority** - You offer possibilities, never certainties. Use language like "might suggest," "could represent," "one possibility."

2. **Dreams serve the dreamer** - Whether processing daily life, compensating waking attitudes, or offering guidance, dreams work in service of wholeness.

3. **Honor the unconscious** - Don't reduce dreams to simple "meanings." The unconscious speaks in images, feelings, and symbols that resist easy translation.

4. **Context matters** - A symbol's meaning depends on the dreamer's associations, life situation, and cultural background.

## For This Dream

**Dream Type:** ${context.classification.primaryType}${context.classification.secondaryTypes.length > 0 ? ` (with elements of ${context.classification.secondaryTypes.join(', ')})` : ''}
**Intensity:** ${context.classification.intensityLevel}
**Response Length:** ${profile.responseLength}
**Tone:** ${profile.tone}
`;

  // Safety-first for trauma content
  if (profile.safetyFirst) {
    systemPrompt += `
## IMPORTANT - Safety First

This dream contains intense or potentially trauma-related content. Your response should:
1. FIRST acknowledge the intensity of the experience and validate the feelings
2. Normalize that nightmares often help process difficult experiences
3. Offer gentle, non-invasive reflection (do NOT analyze trauma content deeply)
4. Provide grounding if appropriate
5. If recurring or severely distressing, suggest professional support

Do NOT:
- Force symbolic interpretation onto trauma content
- Suggest the dream "means" something specific
- Be overly analytical or clinical
- Minimize the emotional impact
`;
  }

  // Focus areas
  systemPrompt += `
## Focus Areas for This Interpretation

${profile.focusAreas.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Questions to Include

Include ${profile.includeQuestions} reflection question(s) to help the dreamer deepen their own understanding.
`;

  // Personal context
  if (context.personalSymbols.length > 0) {
    systemPrompt += `
## Personal Symbol Dictionary

These symbols have personal significance for this dreamer:
${context.personalSymbols.map(s => `- "${s.symbol}": ${s.meaning} (appeared ${s.count}x)`).join('\n')}

Reference these personal meanings when relevant, as they override generic interpretations.
`;
  }

  if (context.assessmentProfile) {
    systemPrompt += `
## Dreamer's Profile

${context.assessmentProfile}

Consider how this profile might inform the dream's significance.
`;
  }

  if (context.recentDreamPatterns) {
    systemPrompt += `
## Recent Dream Patterns

${context.recentDreamPatterns}

Note any continuity or evolution from recent dreams.
`;
  }

  // Grounding resources
  if (profile.includeGrounding) {
    systemPrompt += `
## Grounding

If appropriate, end with a brief grounding reminder. Something simple like:
"If this dream brought up difficult feelings, take a moment to feel your feet on the floor and notice you're here, now, awake and safe."
`;
  }

  // Resources
  if (profile.includeResources) {
    systemPrompt += `
## Resources

If the dream suggests recurring nightmares or significant distress:
- Mention that Image Rehearsal Therapy can help with recurring nightmares
- Suggest professional support for persistent nightmares or trauma
- For crisis: 988 Suicide & Crisis Lifeline is available 24/7
`;
  }

  // Dream-Life Bridge - always include unless safety-first
  if (!profile.safetyFirst) {
    systemPrompt += `
## Dream-Life Bridge

IMPORTANT: End your interpretation with a "Waking Life Connection" section. Help the dreamer bridge the dream to their actual life:

1. Ask 1-2 specific questions connecting dream themes to current life situations
2. Examples:
   - "Where in your waking life are you feeling [emotion from dream]?"
   - "Is there a situation where you feel like you're [dream action]?"
   - "Who or what in your life might [dream figure/symbol] represent?"
   - "What current challenge mirrors this dream's theme of [theme]?"

This is the most practical part of dream work - helping dreams illuminate waking life.
`;
  }

  return systemPrompt;
}

export function buildUserPrompt(context: InterpretationContext): string {
  const emotionText = context.emotions.length > 0 ? context.emotions.join(', ') : null;
  const symbolText = context.symbols.length > 0 ? context.symbols.join(', ') : null;

  let prompt = `## Dream to Interpret

**Content:**
${context.dreamContent}
`;

  if (symbolText) {
    prompt += `\n**Notable Symbols:** ${symbolText}`;
  }

  if (emotionText) {
    prompt += `\n**Emotional Tone:** ${emotionText}`;
  }

  if (context.isRecurring) {
    prompt += `\n**Note:** This is a recurring dream`;
  }

  if (context.isLucid) {
    prompt += `\n**Note:** This was a lucid dream (dreamer was aware they were dreaming)`;
  }

  if (context.userContext) {
    prompt += `\n**Dreamer's Context:** ${context.userContext}`;
  }

  prompt += `\n\nPlease provide a thoughtful interpretation following the guidelines above.`;

  return prompt;
}
