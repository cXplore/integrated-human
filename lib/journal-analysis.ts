/**
 * Journal Analysis Library
 *
 * Professional-grade journal companion system drawing from:
 * - Depth psychology (Jung, Hillman)
 * - Internal Family Systems (IFS)
 * - Somatic awareness practices
 * - Narrative therapy
 * - Positive psychology research
 *
 * Key principles:
 * - The journaler is the expert on their own experience
 * - Writing itself is therapeutic - don't over-process
 * - Patterns emerge over time; honor the process
 * - Body and emotion are doorways to insight
 */

// =============================================================================
// JOURNAL ENTRY CLASSIFICATION
// =============================================================================

export type JournalEntryType =
  | 'processing'      // Working through an event or emotion
  | 'venting'         // Releasing frustration/anger (needs witnessing, not fixing)
  | 'gratitude'       // Appreciation practice
  | 'insight'         // Breakthrough or realization
  | 'planning'        // Goal-setting, future-focused
  | 'memory'          // Recalling past events
  | 'questioning'     // Seeking answers, exploring uncertainty
  | 'crisis'          // Acute distress (needs grounding/safety)
  | 'celebration'     // Sharing wins/joy
  | 'grief'           // Processing loss
  | 'relationship'    // Interpersonal dynamics
  | 'identity'        // Who am I? questions
  | 'somatic'         // Body-focused awareness
  | 'spiritual'       // Meaning, purpose, transcendence
  | 'shadow'          // Dark material, hidden parts
  | 'creative'        // Artistic expression, ideas
  | 'standard';       // General journaling

export interface JournalClassification {
  primaryType: JournalEntryType;
  secondaryTypes: JournalEntryType[];
  emotionalTone: {
    valence: 'positive' | 'negative' | 'mixed' | 'neutral';
    intensity: 'low' | 'moderate' | 'high' | 'extreme';
    primaryEmotions: string[];
  };
  flags: {
    crisisIndicators: boolean;
    somaticContent: boolean;
    shadowContent: boolean;
    growthMoment: boolean;
    spiralPattern: boolean;
    requestingAdvice: boolean;
  };
  suggestedApproach: 'witness' | 'explore' | 'ground' | 'celebrate' | 'challenge';
}

// Crisis indicators
const CRISIS_PATTERNS = [
  /\b(kill myself|end my life|suicide|suicidal)\b/i,
  /\b(want to die|don'?t want to (be here|exist|live))\b/i,
  /\b(hurt myself|self[- ]?harm|cutting myself)\b/i,
  /\b(can'?t go on|can'?t take (it|this)( anymore)?)\b/i,
  /\b(hopeless|no hope|no point)\b/i,
  /\b(everyone would be better off without me)\b/i,
  /\b(nothing matters|everything is pointless)\b/i,
];

// Venting indicators (needs witnessing, not advice)
const VENTING_PATTERNS = [
  /\b(so frustrated|so angry|so pissed|so annoyed)\b/i,
  /\b(I can'?t believe|can you believe)\b/i,
  /\b(hate this|hate my|hate that)\b/i,
  /\b(sick of|tired of|fed up)\b/i,
  /\b(ugh|argh|!{3,})\b/i,
  /\b(need to vent|just venting|let me rant)\b/i,
];

// Insight/breakthrough indicators
const INSIGHT_PATTERNS = [
  /\b(I realized?|just realized|it hit me)\b/i,
  /\b(finally understand|now I (see|get|understand))\b/i,
  /\b(something shifted|breakthrough|aha moment)\b/i,
  /\b(I never noticed|I never saw)\b/i,
  /\b(pattern I'?ve been|pattern I keep)\b/i,
  /\b(makes sense now|it all makes sense)\b/i,
];

// Grief indicators
const GRIEF_PATTERNS = [
  /\b(miss (them|him|her|you)|I miss)\b/i,
  /\b(passed away|died|death|funeral)\b/i,
  /\b(loss|losing|lost (them|him|her))\b/i,
  /\b(grief|grieving|mourn)\b/i,
  /\b(can'?t believe (they'?re|he'?s|she'?s) gone)\b/i,
];

// Shadow content indicators
const SHADOW_PATTERNS = [
  /\b(ashamed|shame|embarrassed)\b/i,
  /\b(hate myself|self-loathing|disgusted with myself)\b/i,
  /\b(dark (thoughts|side|parts?)|darkness in me)\b/i,
  /\b(jealous|envy|envious)\b/i,
  /\b(rage|violent (thoughts|urges))\b/i,
  /\b(secret|hide|hiding|no one knows)\b/i,
  /\b(worst (part|thing) about me)\b/i,
];

// Somatic content indicators
const SOMATIC_PATTERNS = [
  /\b(feel it in my|felt in my) (body|chest|stomach|gut|throat|heart)\b/i,
  /\b(body (feels?|is|was))\b/i,
  /\b(tension|tightness|heaviness|lightness)\b/i,
  /\b(nauseous|sick to my stomach|knot in my)\b/i,
  /\b(breathing|breath|breathe)\b/i,
  /\b(heart (racing|pounding|heavy))\b/i,
  /\b(shaking|trembling|frozen|numb)\b/i,
];

// Spiritual content indicators
const SPIRITUAL_PATTERNS = [
  /\b(meaning|purpose|why am I here)\b/i,
  /\b(soul|spirit|spiritual)\b/i,
  /\b(god|divine|sacred|universe)\b/i,
  /\b(meditation|pray|prayer)\b/i,
  /\b(transcend|awakening|enlighten)\b/i,
  /\b(connected to (something|everything))\b/i,
];

// Growth moment indicators
const GROWTH_PATTERNS = [
  /\b(proud of myself|I did it|finally did)\b/i,
  /\b(progress|growth|growing|evolved)\b/i,
  /\b(used to .+ but now)\b/i,
  /\b(first time I|I'?ve never been able to)\b/i,
  /\b(boundaries?|stood up for|said no)\b/i,
  /\b(healthy|healthier|better than)\b/i,
];

// Spiral pattern indicators (rumination)
const SPIRAL_PATTERNS = [
  /\b(same (thing|thoughts?|feelings?|problem) (over|again))\b/i,
  /\b(can'?t stop thinking|keep thinking|always thinking)\b/i,
  /\b(every time|always happens|never changes)\b/i,
  /\b(what if|but what if)\b/i,
  /\b(should have|shouldn'?t have|if only)\b/i,
  /\b(stuck in|going in circles|same loop)\b/i,
];

// Advice-seeking indicators
const ADVICE_PATTERNS = [
  /\b(what (should|do) I|should I)\b/i,
  /\b(any (advice|suggestions|thoughts))\b/i,
  /\b(help me (understand|figure|decide))\b/i,
  /\b(what would you|how do I)\b/i,
  /\?{2,}|\?$/,
];

// Emotion word lists
const POSITIVE_EMOTIONS = [
  'happy', 'joyful', 'grateful', 'thankful', 'peaceful', 'calm', 'content',
  'excited', 'hopeful', 'proud', 'relieved', 'loved', 'appreciated',
  'confident', 'empowered', 'free', 'light', 'alive', 'energized'
];

const NEGATIVE_EMOTIONS = [
  'sad', 'angry', 'frustrated', 'anxious', 'worried', 'scared', 'afraid',
  'lonely', 'hurt', 'disappointed', 'overwhelmed', 'exhausted', 'lost',
  'confused', 'guilty', 'ashamed', 'hopeless', 'numb', 'empty', 'stuck'
];

/**
 * Classify a journal entry by type and characteristics
 */
export function classifyJournalEntry(
  content: string,
  mood?: string
): JournalClassification {
  const text = content.toLowerCase();

  const scores: Record<JournalEntryType, number> = {
    processing: 1, // baseline
    venting: 0,
    gratitude: 0,
    insight: 0,
    planning: 0,
    memory: 0,
    questioning: 0,
    crisis: 0,
    celebration: 0,
    grief: 0,
    relationship: 0,
    identity: 0,
    somatic: 0,
    spiritual: 0,
    shadow: 0,
    creative: 0,
    standard: 0,
  };

  // Check pattern groups
  const crisisScore = CRISIS_PATTERNS.filter(p => p.test(text)).length;
  const ventingScore = VENTING_PATTERNS.filter(p => p.test(text)).length;
  const insightScore = INSIGHT_PATTERNS.filter(p => p.test(text)).length;
  const griefScore = GRIEF_PATTERNS.filter(p => p.test(text)).length;
  const shadowScore = SHADOW_PATTERNS.filter(p => p.test(text)).length;
  const somaticScore = SOMATIC_PATTERNS.filter(p => p.test(text)).length;
  const spiritualScore = SPIRITUAL_PATTERNS.filter(p => p.test(text)).length;
  const growthScore = GROWTH_PATTERNS.filter(p => p.test(text)).length;
  const spiralScore = SPIRAL_PATTERNS.filter(p => p.test(text)).length;
  const adviceScore = ADVICE_PATTERNS.filter(p => p.test(text)).length;

  // Score entry types
  if (crisisScore >= 1) scores.crisis = crisisScore * 5;
  if (ventingScore >= 2) scores.venting = ventingScore * 2;
  if (insightScore >= 1) scores.insight = insightScore * 3;
  if (griefScore >= 1) scores.grief = griefScore * 2;
  if (shadowScore >= 2) scores.shadow = shadowScore * 2;
  if (somaticScore >= 1) scores.somatic = somaticScore * 2;
  if (spiritualScore >= 1) scores.spiritual = spiritualScore * 2;

  // Check for gratitude
  if (/\b(grateful|thankful|appreciate|blessed)\b/i.test(text)) {
    scores.gratitude = 3;
  }

  // Check for celebration
  if (/\b(excited|amazing|wonderful|best|great news|finally)\b/i.test(text) && growthScore > 0) {
    scores.celebration = growthScore * 2;
  }

  // Check for planning
  if (/\b(going to|plan to|want to|will|goal|next steps?)\b/i.test(text)) {
    scores.planning = 2;
  }

  // Check for questioning
  if (adviceScore >= 2 || /\b(wondering|confused|uncertain|don'?t know)\b/i.test(text)) {
    scores.questioning = adviceScore + 2;
  }

  // Check for relationship focus
  if (/\b(partner|relationship|friend|family|mother|father|they said|told me|between us)\b/i.test(text)) {
    scores.relationship = 3;
  }

  // Check for identity
  if (/\b(who am I|identity|sense of self|the real me|authentic)\b/i.test(text)) {
    scores.identity = 3;
  }

  // Detect emotional tone
  const positiveCount = POSITIVE_EMOTIONS.filter(e => text.includes(e)).length;
  const negativeCount = NEGATIVE_EMOTIONS.filter(e => text.includes(e)).length;
  const foundEmotions = [
    ...POSITIVE_EMOTIONS.filter(e => text.includes(e)),
    ...NEGATIVE_EMOTIONS.filter(e => text.includes(e)),
  ].slice(0, 5);

  let valence: 'positive' | 'negative' | 'mixed' | 'neutral';
  if (positiveCount > negativeCount * 2) valence = 'positive';
  else if (negativeCount > positiveCount * 2) valence = 'negative';
  else if (positiveCount > 0 && negativeCount > 0) valence = 'mixed';
  else valence = 'neutral';

  // Factor in mood if provided
  if (mood) {
    const moodLower = mood.toLowerCase();
    if (POSITIVE_EMOTIONS.includes(moodLower)) valence = valence === 'negative' ? 'mixed' : 'positive';
    if (NEGATIVE_EMOTIONS.includes(moodLower)) valence = valence === 'positive' ? 'mixed' : 'negative';
    if (!foundEmotions.includes(moodLower)) foundEmotions.unshift(moodLower);
  }

  // Calculate intensity
  const totalEmotionCount = positiveCount + negativeCount;
  const exclamations = (text.match(/!/g) || []).length;
  const caps = (text.match(/[A-Z]{2,}/g) || []).length;
  const intensityScore = totalEmotionCount + exclamations + caps + (crisisScore * 3);

  let intensity: 'low' | 'moderate' | 'high' | 'extreme';
  if (crisisScore >= 2 || intensityScore >= 10) intensity = 'extreme';
  else if (intensityScore >= 6) intensity = 'high';
  else if (intensityScore >= 3) intensity = 'moderate';
  else intensity = 'low';

  // Determine primary and secondary types
  const sortedTypes = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const primaryType = sortedTypes[0]?.[0] as JournalEntryType || 'standard';
  const secondaryTypes = sortedTypes
    .slice(1, 3)
    .filter(([_, score]) => score >= 2)
    .map(([type]) => type as JournalEntryType);

  // Determine suggested approach
  let suggestedApproach: 'witness' | 'explore' | 'ground' | 'celebrate' | 'challenge';
  if (crisisScore >= 1) suggestedApproach = 'ground';
  else if (scores.venting >= 3) suggestedApproach = 'witness';
  else if (scores.celebration >= 2 || scores.gratitude >= 2) suggestedApproach = 'celebrate';
  else if (spiralScore >= 2) suggestedApproach = 'challenge';
  else suggestedApproach = 'explore';

  return {
    primaryType,
    secondaryTypes,
    emotionalTone: {
      valence,
      intensity,
      primaryEmotions: foundEmotions,
    },
    flags: {
      crisisIndicators: crisisScore >= 1,
      somaticContent: somaticScore >= 1,
      shadowContent: shadowScore >= 2,
      growthMoment: growthScore >= 1,
      spiralPattern: spiralScore >= 2,
      requestingAdvice: adviceScore >= 2,
    },
    suggestedApproach,
  };
}

// =============================================================================
// COMPANION RESPONSE PROFILES
// =============================================================================

export interface CompanionProfile {
  responseLength: string;
  tone: string;
  focus: string[];
  avoidances: string[];
  questionsToAsk: number;
  includeGrounding: boolean;
  includeResources: boolean;
}

export function getCompanionProfile(
  classification: JournalClassification
): CompanionProfile {

  // Crisis - safety first
  if (classification.flags.crisisIndicators) {
    return {
      responseLength: '150-250 words',
      tone: 'Calm, grounding, present. Not analytical.',
      focus: [
        'Acknowledge their pain directly',
        'Thank them for sharing something so difficult',
        'Ground them in the present moment',
        'Offer crisis resources',
      ],
      avoidances: [
        'DO NOT analyze or interpret',
        'DO NOT offer advice or solutions',
        'DO NOT minimize or rush past the pain',
        'DO NOT ask probing questions',
      ],
      questionsToAsk: 0,
      includeGrounding: true,
      includeResources: true,
    };
  }

  // Venting - witness, don't fix
  if (classification.primaryType === 'venting' || classification.suggestedApproach === 'witness') {
    return {
      responseLength: '100-200 words',
      tone: 'Validating, present, non-judgmental. A witness, not a fixer.',
      focus: [
        'Simply acknowledge and validate their feelings',
        'Reflect back that you hear them',
        'Honor their right to feel this way',
      ],
      avoidances: [
        'DO NOT offer advice or solutions',
        'DO NOT try to make them feel better',
        'DO NOT suggest reframes or silver linings',
        'DO NOT ask "have you tried..."',
      ],
      questionsToAsk: 1,
      includeGrounding: false,
      includeResources: false,
    };
  }

  // Grief - gentle presence
  if (classification.primaryType === 'grief') {
    return {
      responseLength: '150-250 words',
      tone: 'Gentle, honoring, unhurried. Comfortable with sadness.',
      focus: [
        'Honor the significance of who/what was lost',
        'Validate the depth of their feelings',
        'Sit with them in the grief, don\'t rush through it',
        'Acknowledge that grief has no timeline',
      ],
      avoidances: [
        'DO NOT offer platitudes (they\'re in a better place, etc.)',
        'DO NOT suggest they should be "over it"',
        'DO NOT compare losses',
        'DO NOT rush to positivity',
      ],
      questionsToAsk: 1,
      includeGrounding: false,
      includeResources: false,
    };
  }

  // Celebration/gratitude - amplify joy
  if (classification.primaryType === 'celebration' || classification.primaryType === 'gratitude') {
    return {
      responseLength: '100-180 words',
      tone: 'Warm, celebratory, genuinely pleased. Match their energy.',
      focus: [
        'Celebrate with them authentically',
        'Reflect back what makes this meaningful',
        'Honor the work/growth that led here',
      ],
      avoidances: [
        'DO NOT immediately ask about challenges',
        'DO NOT dampen with caution or "buts"',
        'DO NOT rush past the positive',
      ],
      questionsToAsk: 1,
      includeGrounding: false,
      includeResources: false,
    };
  }

  // Insight - honor and deepen
  if (classification.primaryType === 'insight' || classification.flags.growthMoment) {
    return {
      responseLength: '150-250 words',
      tone: 'Curious, affirming, deepening. Honor the breakthrough.',
      focus: [
        'Validate the significance of their realization',
        'Help them articulate what shifted',
        'Explore how this connects to their larger journey',
        'Invite them to sit with the insight',
      ],
      avoidances: [
        'DO NOT immediately add your own interpretation',
        'DO NOT rush past the insight to "what now"',
        'DO NOT minimize with "everyone goes through this"',
      ],
      questionsToAsk: 2,
      includeGrounding: false,
      includeResources: false,
    };
  }

  // Shadow work - steady presence
  if (classification.primaryType === 'shadow' || classification.flags.shadowContent) {
    return {
      responseLength: '200-300 words',
      tone: 'Steady, accepting, non-judgmental. Unflinching but warm.',
      focus: [
        'Honor their courage in exploring difficult material',
        'Normalize that we all have shadow aspects',
        'Help them stay curious rather than judgmental toward themselves',
        'Explore without pathologizing',
      ],
      avoidances: [
        'DO NOT react with alarm or judgment',
        'DO NOT reassure them they\'re "not really like that"',
        'DO NOT rush to fix or resolve',
        'DO NOT moralize',
      ],
      questionsToAsk: 2,
      includeGrounding: false,
      includeResources: false,
    };
  }

  // Spiral pattern - gentle challenge
  if (classification.flags.spiralPattern) {
    return {
      responseLength: '150-250 words',
      tone: 'Compassionate but gently challenging. Pattern-noticing.',
      focus: [
        'Acknowledge the struggle without feeding the spiral',
        'Gently name the pattern if appropriate',
        'Invite a different perspective or question',
        'Redirect attention to body or present moment',
      ],
      avoidances: [
        'DO NOT get pulled into the spiral with them',
        'DO NOT argue with their thoughts',
        'DO NOT dismiss their concerns as "just rumination"',
      ],
      questionsToAsk: 1,
      includeGrounding: true,
      includeResources: false,
    };
  }

  // Somatic content - body awareness
  if (classification.flags.somaticContent) {
    return {
      responseLength: '150-250 words',
      tone: 'Embodied, curious, slow-paced.',
      focus: [
        'Honor their body awareness',
        'Invite them to stay with the sensation',
        'Explore what the body might be communicating',
        'Offer gentle somatic prompts',
      ],
      avoidances: [
        'DO NOT rush to interpretation',
        'DO NOT immediately go to "fixing" the sensation',
        'DO NOT pathologize body sensations',
      ],
      questionsToAsk: 2,
      includeGrounding: false,
      includeResources: false,
    };
  }

  // Questioning/advice-seeking
  if (classification.primaryType === 'questioning' || classification.flags.requestingAdvice) {
    return {
      responseLength: '200-300 words',
      tone: 'Thoughtful, collaborative. A thinking partner, not an authority.',
      focus: [
        'Acknowledge their question and the uncertainty',
        'Explore what they already know or sense',
        'Offer perspectives (not prescriptions)',
        'Help them clarify what matters most to them',
      ],
      avoidances: [
        'DO NOT give directive advice',
        'DO NOT pretend to know what\'s best for them',
        'DO NOT overwhelm with options',
      ],
      questionsToAsk: 2,
      includeGrounding: false,
      includeResources: false,
    };
  }

  // Default - curious exploration
  return {
    responseLength: '150-250 words',
    tone: 'Warm, curious, present. A thoughtful companion.',
    focus: [
      'Notice what feels most alive or important in what they shared',
      'Reflect back patterns or themes you notice',
      'Offer one or two deepening questions',
    ],
    avoidances: [
      'DO NOT lecture or over-interpret',
      'DO NOT make assumptions about their experience',
      'DO NOT rush to advice or solutions',
    ],
    questionsToAsk: 2,
    includeGrounding: false,
    includeResources: false,
  };
}

// =============================================================================
// JOURNAL PROMPT TYPES
// =============================================================================

export type JournalPromptType =
  | 'deepening'     // Go deeper into what's here
  | 'somatic'       // Body awareness
  | 'parts'         // Internal Family Systems inspired
  | 'perspective'   // Different viewpoint
  | 'gratitude'     // Appreciation
  | 'shadow'        // Exploring hidden parts
  | 'future-self'   // Future perspective
  | 'completion'    // Sentence completion
  | 'letter'        // Write a letter
  | 'dialogue';     // Dialogue with a part/person

export interface JournalPrompt {
  type: JournalPromptType;
  prompt: string;
  guidance?: string;
}

/**
 * Generate follow-up journal prompts based on entry content
 */
export function generateJournalPrompts(
  classification: JournalClassification,
  entryContent: string
): JournalPrompt[] {
  const prompts: JournalPrompt[] = [];

  // Don't offer prompts for crisis content
  if (classification.flags.crisisIndicators) {
    return [{
      type: 'somatic',
      prompt: 'Right now, where do you feel most grounded in your body?',
      guidance: 'You don\'t need to write more. Just notice your breath and body.',
    }];
  }

  // Somatic prompt for any emotional content
  if (classification.emotionalTone.intensity !== 'low') {
    prompts.push({
      type: 'somatic',
      prompt: 'As you re-read what you wrote, where do you notice it in your body?',
      guidance: 'Scan from head to toe. Notice any sensations - tightness, warmth, heaviness, lightness.',
    });
  }

  // Parts work for internal conflict
  if (classification.primaryType === 'shadow' || /\b(part of me)\b/i.test(entryContent)) {
    prompts.push({
      type: 'parts',
      prompt: 'If the part of you that feels this could speak directly, what would it say?',
      guidance: 'Write in first person from that part\'s perspective. Let it express itself fully.',
    });
  }

  // Perspective shift for relationship content
  if (classification.primaryType === 'relationship') {
    prompts.push({
      type: 'perspective',
      prompt: 'If the other person in this situation could write their version, what might they say?',
      guidance: 'This isn\'t about being "right" - it\'s about expanding understanding.',
    });
  }

  // Future self for questioning/uncertainty
  if (classification.primaryType === 'questioning') {
    prompts.push({
      type: 'future-self',
      prompt: 'Imagine yourself one year from now, having navigated this beautifully. What would they want you to know?',
      guidance: 'Write as if you\'ve already found your way through. What wisdom would you share?',
    });
  }

  // Letter prompt for grief or relationship
  if (classification.primaryType === 'grief') {
    prompts.push({
      type: 'letter',
      prompt: 'If you could write a letter to them, what would you want them to know?',
      guidance: 'Say everything - what you miss, what you wish you\'d said, how you\'re carrying them.',
    });
  }

  // Deepening for insight
  if (classification.primaryType === 'insight') {
    prompts.push({
      type: 'deepening',
      prompt: 'What makes this realization feel significant? What does it change?',
      guidance: 'Stay with the insight. Let it reveal more.',
    });
  }

  // Gratitude for negative valence (gentle)
  if (classification.emotionalTone.valence === 'negative' && !classification.flags.crisisIndicators) {
    prompts.push({
      type: 'gratitude',
      prompt: 'In the midst of all this, is there one small thing you can appreciate about yourself?',
      guidance: 'This isn\'t about silver linings. It\'s about acknowledging your own humanity.',
    });
  }

  // Shadow for growth moments
  if (classification.flags.growthMoment) {
    prompts.push({
      type: 'shadow',
      prompt: 'What part of yourself did you have to face or accept to get here?',
      guidance: 'Growth often asks us to integrate something we previously rejected.',
    });
  }

  return prompts.slice(0, 3);
}

// =============================================================================
// PATTERN DETECTION ACROSS ENTRIES
// =============================================================================

export interface JournalPatterns {
  recurringEmotions: Array<{ emotion: string; count: number }>;
  recurringThemes: string[];
  emotionalTrend: 'improving' | 'declining' | 'stable' | 'variable';
  possibleInsights: string[];
}

/**
 * Analyze patterns across multiple journal entries
 */
export function analyzeJournalPatterns(
  entries: Array<{ content: string; mood?: string; createdAt: Date }>,
): JournalPatterns {
  const emotionCounts: Record<string, number> = {};
  const themes: Set<string> = new Set();
  const recentValences: number[] = [];

  for (const entry of entries) {
    const classification = classifyJournalEntry(entry.content, entry.mood);

    // Track emotions
    for (const emotion of classification.emotionalTone.primaryEmotions) {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }

    // Track themes
    if (classification.primaryType !== 'standard') {
      themes.add(classification.primaryType);
    }
    for (const type of classification.secondaryTypes) {
      themes.add(type);
    }

    // Track valence for trend
    const valenceScore =
      classification.emotionalTone.valence === 'positive' ? 2 :
      classification.emotionalTone.valence === 'mixed' ? 0 :
      classification.emotionalTone.valence === 'negative' ? -2 : 0;
    recentValences.push(valenceScore);
  }

  // Calculate trend
  let trend: 'improving' | 'declining' | 'stable' | 'variable' = 'stable';
  if (recentValences.length >= 3) {
    const firstHalf = recentValences.slice(0, Math.floor(recentValences.length / 2));
    const secondHalf = recentValences.slice(Math.floor(recentValences.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const variance = Math.max(...recentValences) - Math.min(...recentValences);

    if (variance >= 3) trend = 'variable';
    else if (secondAvg > firstAvg + 0.5) trend = 'improving';
    else if (secondAvg < firstAvg - 0.5) trend = 'declining';
  }

  // Generate possible insights
  const insights: string[] = [];
  const sortedEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1]);

  if (sortedEmotions.length > 0 && sortedEmotions[0][1] >= 3) {
    insights.push(`'${sortedEmotions[0][0]}' appears frequently in your recent entries`);
  }

  if (themes.has('relationship') && themes.has('shadow')) {
    insights.push('Your entries often connect relationship dynamics with inner work');
  }

  if (themes.has('somatic')) {
    insights.push('You\'re developing strong body awareness in your reflections');
  }

  return {
    recurringEmotions: sortedEmotions.slice(0, 5).map(([emotion, count]) => ({ emotion, count })),
    recurringThemes: Array.from(themes).slice(0, 5),
    emotionalTrend: trend,
    possibleInsights: insights,
  };
}

// =============================================================================
// PROFESSIONAL PROMPT BUILDER
// =============================================================================

export interface JournalCompanionContext {
  currentEntry: string;
  classification: JournalClassification;
  recentEntries?: Array<{ content: string; mood?: string; createdAt: Date }>;
  userProfile?: {
    name?: string;
    challenges?: string[];
    interests?: string[];
  };
  conversationHistory?: Array<{ role: string; content: string }>;
}

export function buildJournalCompanionPrompt(context: JournalCompanionContext): string {
  const profile = getCompanionProfile(context.classification);
  const patterns = context.recentEntries
    ? analyzeJournalPatterns(context.recentEntries)
    : null;

  let systemPrompt = `You are a Journal Companion - a thoughtful guide for introspection and self-discovery.

## Core Identity

You are NOT a therapist, coach, or advisor. You are a wise, present witness to their inner journey. You help users explore their journal entries with curiosity and compassion.

## For This Entry

**Entry Type:** ${context.classification.primaryType}${context.classification.secondaryTypes.length > 0 ? ` (with elements of ${context.classification.secondaryTypes.join(', ')})` : ''}
**Emotional Tone:** ${context.classification.emotionalTone.valence} intensity (${context.classification.emotionalTone.intensity})
${context.classification.emotionalTone.primaryEmotions.length > 0 ? `**Emotions Present:** ${context.classification.emotionalTone.primaryEmotions.join(', ')}` : ''}
**Your Approach:** ${context.classification.suggestedApproach}
**Response Length:** ${profile.responseLength}
**Tone:** ${profile.tone}

## What to Focus On

${profile.focus.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## What to Avoid

${profile.avoidances.map(a => `- ${a}`).join('\n')}

## Questions

${profile.questionsToAsk === 0
  ? 'Do NOT ask questions. Just be present.'
  : `Include ${profile.questionsToAsk} thoughtful question(s) that invite deeper exploration.`}
`;

  // Add pattern context if available
  if (patterns && patterns.recurringEmotions.length > 0) {
    systemPrompt += `
## Patterns from Recent Entries

${patterns.recurringEmotions.length > 0 ? `- Recurring emotions: ${patterns.recurringEmotions.map(e => e.emotion).join(', ')}` : ''}
${patterns.recurringThemes.length > 0 ? `- Recurring themes: ${patterns.recurringThemes.join(', ')}` : ''}
${patterns.emotionalTrend !== 'stable' ? `- Emotional trend: ${patterns.emotionalTrend}` : ''}
${patterns.possibleInsights.length > 0 ? `- Notable: ${patterns.possibleInsights[0]}` : ''}

Reference these patterns naturally if relevant, but don't force connections.
`;
  }

  // Add grounding if needed
  if (profile.includeGrounding) {
    systemPrompt += `
## Grounding

If appropriate, offer a simple grounding anchor:
"Take a breath. Feel your feet on the floor. You're here, now, and you're not alone."
`;
  }

  // Add resources if needed
  if (profile.includeResources) {
    systemPrompt += `
## Resources

For significant distress, include: "If you need support right now, the 988 Suicide & Crisis Lifeline is available 24/7."
`;
  }

  // Add user context
  if (context.userProfile?.name) {
    systemPrompt += `\n## About This Person\nName: ${context.userProfile.name}\n`;
  }

  return systemPrompt;
}

// =============================================================================
// GROUNDING SCRIPTS
// =============================================================================

export const JOURNAL_GROUNDING_SCRIPT = `Take a breath with me.

Feel your feet on the floor. Feel your seat beneath you.

Look around and name one thing you can see.

You are here. You are now. You wrote something true.

That takes courage.`;

export const CRISIS_RESOURCES = `If you're struggling right now:
- 988 Suicide & Crisis Lifeline: Call or text 988 (24/7)
- Crisis Text Line: Text HOME to 741741
- You don't have to face this alone.`;
