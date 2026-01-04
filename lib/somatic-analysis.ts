/**
 * Somatic Analysis Library
 *
 * Professional-grade system for body-centered guidance.
 * Draws from:
 * - Somatic Experiencing (Peter Levine)
 * - Polyvagal Theory (Stephen Porges)
 * - Hakomi (Ron Kurtz)
 * - Focusing (Eugene Gendlin)
 * - Trauma-informed bodywork
 *
 * Key principles:
 * - The body holds what the mind cannot process
 * - Sensation is the language of the nervous system
 * - Titration prevents overwhelm
 * - Following the body's wisdom, not directing it
 */

// =============================================================================
// SOMATIC STATE CLASSIFICATION
// =============================================================================

export type SomaticState =
  | 'grounded'       // Present, stable, resourced
  | 'activated'      // Fight/flight, sympathetic arousal
  | 'collapsed'      // Freeze/shutdown, dorsal vagal
  | 'dissociated'    // Out of body, numbed out
  | 'flooded'        // Overwhelmed with sensation
  | 'armored'        // Chronic tension, protection
  | 'restless'       // Can't settle, agitated
  | 'depleted'       // Exhausted, no resources
  | 'mixed';         // Multiple states

export type BodyRegion =
  | 'head'
  | 'throat'
  | 'chest'
  | 'heart'
  | 'stomach'
  | 'gut'
  | 'pelvis'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'whole-body';

export type SensationType =
  | 'tension'
  | 'pain'
  | 'numbness'
  | 'tingling'
  | 'warmth'
  | 'cold'
  | 'pressure'
  | 'heaviness'
  | 'lightness'
  | 'vibration'
  | 'constriction'
  | 'expansion'
  | 'pulsing'
  | 'empty'
  | 'full';

export interface SomaticClassification {
  primaryState: SomaticState;
  secondaryState?: SomaticState;
  affectedRegions: BodyRegion[];
  dominantSensations: SensationType[];
  intensityLevel: 'low' | 'moderate' | 'high' | 'extreme';
  suggestedApproach: 'ground' | 'resource' | 'titrate' | 'discharge' | 'contain' | 'explore';
  flags: {
    dissociationRisk: boolean;
    floodingRisk: boolean;
    chronicPattern: boolean;
    traumaIndicators: boolean;
    needsProfessional: boolean;
  };
  window: 'hyper' | 'within' | 'hypo'; // Window of tolerance
}

// =============================================================================
// PATTERN DETECTION
// =============================================================================

// Activation patterns
const ACTIVATION_PATTERNS = [
  /\b(racing|pounding|fast|rapid)\s*(heart|pulse|heartbeat)\b/i,
  /\b(can'?t sit still|restless|agitated|jittery)\b/i,
  /\b(shaking|trembling|shaky|quivering)\b/i,
  /\b(sweating|sweaty|hot|flushed)\b/i,
  /\b(clenched|tight|tense|wound up)\b/i,
  /\b(breath\w*\s*(short|shallow|fast|can'?t))\b/i,
  /\b(muscles\s*(tense|tight|ready))\b/i,
  /\b(on edge|hypervigilant|alert|wired)\b/i,
];

// Collapse/shutdown patterns
const COLLAPSE_PATTERNS = [
  /\b(numb|numbness|can'?t feel|frozen)\b/i,
  /\b(heavy|leaden|weighed down|can'?t move)\b/i,
  /\b(exhausted|depleted|no energy|drained)\b/i,
  /\b(shutdown|collapsed|checked out|gone)\b/i,
  /\b(foggy|fuzzy|cloudy|unclear)\b/i,
  /\b(slow|sluggish|lethargic)\b/i,
  /\b(cold|chilled|cool)\b/i,
  /\b(disconnected|far away|distant)\b/i,
];

// Dissociation patterns
const DISSOCIATION_PATTERNS = [
  /\b(out of (my )?body|floating|detached)\b/i,
  /\b(watching (myself|from outside))\b/i,
  /\b(not (real|here)|unreal|dreamlike)\b/i,
  /\b(can'?t feel (anything|my body|myself))\b/i,
  /\b(disconnected from|separated from)\s*body\b/i,
  /\b(blank|empty|void|nothing)\b/i,
  /\b(spacing out|zoned out|checked out)\b/i,
];

// Flooding patterns
const FLOODING_PATTERNS = [
  /\b(overwhelmed|too much|can'?t handle)\b/i,
  /\b(flooded|drowning in|waves of)\b/i,
  /\b(intense|overwhelming|unbearable)\b/i,
  /\b(spinning|out of control|losing it)\b/i,
  /\b(panic|panicking|panicked)\b/i,
];

// Armored/chronic tension patterns
const ARMORED_PATTERNS = [
  /\b(always tense|chronically tight|constantly)\b/i,
  /\b(holding|bracing|guarding)\b/i,
  /\b(can'?t relax|won'?t release|stuck)\b/i,
  /\b(armor|wall|barrier|protection)\b/i,
  /\b(years of|for a long time|always been)\b/i,
];

// Body region patterns
const REGION_PATTERNS: Record<BodyRegion, RegExp[]> = {
  head: [/\b(head|skull|forehead|temples|headache|migraine)\b/i],
  throat: [/\b(throat|neck|voice|swallow|lump in)\b/i],
  chest: [/\b(chest|ribcage|sternum|lungs|breath)\b/i],
  heart: [/\b(heart|heartbeat|cardiac|pulse)\b/i],
  stomach: [/\b(stomach|belly|tummy|nausea|butterflies)\b/i],
  gut: [/\b(gut|intestine|bowel|lower abdomen|core)\b/i],
  pelvis: [/\b(pelvis|pelvic|hips|groin|sacrum)\b/i],
  back: [/\b(back|spine|lower back|upper back|lumbar)\b/i],
  shoulders: [/\b(shoulder\w*|trapezius|neck and shoulder)\b/i],
  arms: [/\b(arm|bicep|forearm|elbow)\b/i],
  hands: [/\b(hand|finger|palm|wrist|grip)\b/i],
  legs: [/\b(leg|thigh|calf|knee|hamstring)\b/i],
  feet: [/\b(foot|feet|ankle|toe|sole)\b/i],
  'whole-body': [/\b(whole body|all over|everywhere|entire body)\b/i],
};

// Sensation patterns
const SENSATION_PATTERNS: Record<SensationType, RegExp[]> = {
  tension: [/\b(tension|tense|tight|tightness)\b/i],
  pain: [/\b(pain|ache|hurt|sore|sharp|stabbing)\b/i],
  numbness: [/\b(numb|numbness|can'?t feel|no sensation)\b/i],
  tingling: [/\b(tingling|pins and needles|prickly|buzzing)\b/i],
  warmth: [/\b(warm|warmth|hot|heat|burning)\b/i],
  cold: [/\b(cold|cool|chilled|icy|frozen)\b/i],
  pressure: [/\b(pressure|pushing|pressing|compressed)\b/i],
  heaviness: [/\b(heavy|heaviness|weighed|weight|dense)\b/i],
  lightness: [/\b(light|airy|floating|buoyant)\b/i],
  vibration: [/\b(vibrating|vibration|buzzing|humming|tremor)\b/i],
  constriction: [/\b(constricted|tight|squeezed|narrow|small)\b/i],
  expansion: [/\b(expanding|opening|spreading|spacious)\b/i],
  pulsing: [/\b(pulsing|throbbing|beating|rhythmic)\b/i],
  empty: [/\b(empty|hollow|void|nothing there)\b/i],
  full: [/\b(full|filled|congested|blocked)\b/i],
};

// Trauma indicators
const TRAUMA_PATTERNS = [
  /\b(flashback|trigger|triggering|triggered)\b/i,
  /\b(body remembers|stored in my body|body memory)\b/i,
  /\b(abuse|assault|trauma|violation)\b/i,
  /\b(freeze|paralyz|can'?t move|stuck)\b/i,
  /\b(unsafe|danger|threat|scared)\b/i,
];

/**
 * Classify somatic state from user description
 */
export function classifySomaticState(description: string): SomaticClassification {
  const text = description.toLowerCase();

  // Score each state
  const activationScore = ACTIVATION_PATTERNS.filter(p => p.test(text)).length;
  const collapseScore = COLLAPSE_PATTERNS.filter(p => p.test(text)).length;
  const dissociationScore = DISSOCIATION_PATTERNS.filter(p => p.test(text)).length;
  const floodingScore = FLOODING_PATTERNS.filter(p => p.test(text)).length;
  const armoredScore = ARMORED_PATTERNS.filter(p => p.test(text)).length;
  const traumaScore = TRAUMA_PATTERNS.filter(p => p.test(text)).length;

  // Detect affected regions
  const affectedRegions: BodyRegion[] = [];
  for (const [region, patterns] of Object.entries(REGION_PATTERNS)) {
    if (patterns.some(p => p.test(text))) {
      affectedRegions.push(region as BodyRegion);
    }
  }

  // Detect sensations
  const dominantSensations: SensationType[] = [];
  for (const [sensation, patterns] of Object.entries(SENSATION_PATTERNS)) {
    if (patterns.some(p => p.test(text))) {
      dominantSensations.push(sensation as SensationType);
    }
  }

  // Determine primary state
  let primaryState: SomaticState = 'grounded';
  let secondaryState: SomaticState | undefined;

  const scores: [SomaticState, number][] = [
    ['activated', activationScore],
    ['collapsed', collapseScore],
    ['dissociated', dissociationScore],
    ['flooded', floodingScore],
    ['armored', armoredScore],
  ];

  scores.sort((a, b) => b[1] - a[1]);

  if (scores[0][1] >= 2) {
    primaryState = scores[0][0];
    if (scores[1][1] >= 2) {
      secondaryState = scores[1][0];
    }
  }

  // Special case: restless
  if (/\b(restless|can'?t settle|agitated)\b/i.test(text) && activationScore < 2) {
    primaryState = 'restless';
  }

  // Special case: depleted
  if (/\b(exhausted|depleted|drained|no energy)\b/i.test(text) && collapseScore < 2) {
    primaryState = 'depleted';
  }

  // Special case: mixed states
  if (activationScore >= 2 && collapseScore >= 2) {
    primaryState = 'mixed';
  }

  // Determine intensity
  const maxScore = Math.max(activationScore, collapseScore, dissociationScore, floodingScore);
  let intensityLevel: 'low' | 'moderate' | 'high' | 'extreme';
  if (floodingScore >= 2 || maxScore >= 5) intensityLevel = 'extreme';
  else if (dissociationScore >= 2 || maxScore >= 3) intensityLevel = 'high';
  else if (maxScore >= 2) intensityLevel = 'moderate';
  else intensityLevel = 'low';

  // Determine window of tolerance
  let window: 'hyper' | 'within' | 'hypo';
  if (activationScore > collapseScore + dissociationScore) {
    window = 'hyper';
  } else if (collapseScore + dissociationScore > activationScore) {
    window = 'hypo';
  } else {
    window = 'within';
  }

  // Determine approach - order matters!
  let suggestedApproach: 'ground' | 'resource' | 'titrate' | 'discharge' | 'contain' | 'explore';
  if (dissociationScore >= 2) {
    suggestedApproach = 'ground'; // Dissociation always needs grounding first
  } else if (floodingScore >= 2) {
    suggestedApproach = 'contain'; // Flooding needs containment
  } else if (collapseScore >= 2 && dissociationScore < 2) {
    suggestedApproach = 'resource'; // Collapse without dissociation needs resourcing
  } else if (intensityLevel === 'extreme') {
    suggestedApproach = 'ground'; // Extreme intensity needs grounding
  } else if (activationScore >= 3) {
    suggestedApproach = 'discharge';
  } else if (armoredScore >= 2) {
    suggestedApproach = 'titrate';
  } else {
    suggestedApproach = 'explore';
  }

  return {
    primaryState,
    secondaryState,
    affectedRegions: affectedRegions.slice(0, 5),
    dominantSensations: dominantSensations.slice(0, 5),
    intensityLevel,
    suggestedApproach,
    flags: {
      dissociationRisk: dissociationScore >= 1,
      floodingRisk: floodingScore >= 1,
      chronicPattern: armoredScore >= 2 || /\b(always|years|chronic)\b/i.test(text),
      traumaIndicators: traumaScore >= 1,
      needsProfessional: traumaScore >= 2 || (dissociationScore >= 2 && floodingScore >= 1),
    },
    window,
  };
}

// =============================================================================
// APPROACH GUIDANCE
// =============================================================================

export interface SomaticApproach {
  name: string;
  description: string;
  techniques: string[];
  avoid: string[];
  pacing: string;
}

export const SOMATIC_APPROACHES: Record<string, SomaticApproach> = {
  ground: {
    name: 'Grounding',
    description: 'Bring awareness back to body and present moment',
    techniques: [
      'Feel feet on floor, weight through legs',
      '5-4-3-2-1 senses (5 things you see, 4 hear, etc.)',
      'Name physical objects in the room',
      'Orienting - slowly look around, notice what catches your eye',
      'Hold something cold or textured',
    ],
    avoid: [
      'Closing eyes if dissociated',
      'Going into body sensation deeply',
      'Exploring trauma material',
      'Long silence without anchoring',
    ],
    pacing: 'Slow, concrete, present-focused. Stay surface-level.',
  },
  resource: {
    name: 'Resourcing',
    description: 'Build capacity and access positive states',
    techniques: [
      'Remember a place where you felt safe',
      'Recall someone who cares about you',
      'Notice any place in body that feels okay or neutral',
      'Gentle self-touch (hand on heart, hug self)',
      'Slow, extended exhale',
    ],
    avoid: [
      'Rushing to "fix" the shutdown',
      'Demanding big emotional shifts',
      'Focusing on what\'s wrong',
      'Overwhelming with too many options',
    ],
    pacing: 'Gentle, patient. Build slowly. Honor the collapse as protection.',
  },
  titrate: {
    name: 'Titration',
    description: 'Touch into sensation in small doses',
    techniques: [
      'Notice the edge of the sensation, not the center',
      'Pendulate between difficult and okay places',
      'Stay for just 10-15 seconds, then rest',
      'Use breath to regulate intensity',
      'Track subtle shifts and changes',
    ],
    avoid: [
      'Diving deep into intense sensation',
      'Pushing through resistance',
      'Staying too long in activation',
      'Forcing release',
    ],
    pacing: 'Small doses. Approach and retreat. Respect the body\'s pace.',
  },
  discharge: {
    name: 'Discharge',
    description: 'Help mobilized energy complete its movement',
    techniques: [
      'Allow natural trembling or shaking',
      'Pushing against wall or floor (isometric)',
      'Squeezing and releasing fists',
      'Shaking out limbs',
      'Movement that follows impulse',
    ],
    avoid: [
      'Forcing discharge',
      'Stopping natural movement',
      'Going too fast',
      'Making meaning while discharging',
    ],
    pacing: 'Follow the body. Let movement complete itself. Then rest.',
  },
  contain: {
    name: 'Containment',
    description: 'Create safety and boundaries for intense experience',
    techniques: [
      'Wrap in blanket or weighted object',
      'Firm pressure (self-hug, squeeze hands)',
      'Visualize container for the experience',
      'Slow, rhythmic breath',
      'Name what\'s happening (externalize)',
    ],
    avoid: [
      'Exploring what\'s overwhelming',
      'Opening up more',
      'Pushing through',
      'Talking about trauma content',
    ],
    pacing: 'Slow down. Create safety first. The experience can wait.',
  },
  explore: {
    name: 'Exploration',
    description: 'Curious inquiry into body experience',
    techniques: [
      'Notice shape, size, texture of sensation',
      'Ask "what does this part need?"',
      'Track changes as you pay attention',
      'Follow impulses and micro-movements',
      'Sense meaning or message in the body',
    ],
    avoid: [
      'Rushing to interpretation',
      'Imposing meaning',
      'Ignoring body signals to stop',
    ],
    pacing: 'Curious, open, non-directive. Follow the body\'s lead.',
  },
};

// =============================================================================
// BODY PROMPTS
// =============================================================================

export interface BodyPrompt {
  prompt: string;
  purpose: string;
  followUp?: string;
}

/**
 * Generate body-awareness prompts based on state
 */
export function generateBodyPrompts(
  classification: SomaticClassification
): BodyPrompt[] {
  const prompts: BodyPrompt[] = [];

  // State-specific prompts
  switch (classification.primaryState) {
    case 'activated':
      prompts.push({
        prompt: 'Where in your body do you feel this activation most?',
        purpose: 'Localize the experience',
        followUp: 'What happens when you just notice it without trying to change it?',
      });
      prompts.push({
        prompt: 'Is there any impulse to move? A gesture wanting to happen?',
        purpose: 'Allow natural discharge',
      });
      break;

    case 'collapsed':
      prompts.push({
        prompt: 'Can you feel your feet on the floor right now?',
        purpose: 'Basic grounding',
      });
      prompts.push({
        prompt: 'Is there anywhere in your body that feels okay, even neutral?',
        purpose: 'Find resource',
        followUp: 'Can you rest your attention there for a moment?',
      });
      break;

    case 'dissociated':
      prompts.push({
        prompt: 'Can you look around the room and name three things you see?',
        purpose: 'Orient to present',
      });
      prompts.push({
        prompt: 'Feel your hands. Can you press them together or grip something?',
        purpose: 'Bring awareness back',
      });
      break;

    case 'flooded':
      prompts.push({
        prompt: 'Let\'s slow down. Can you take one slow breath?',
        purpose: 'Create space',
      });
      prompts.push({
        prompt: 'You don\'t have to process this all right now. What\'s one thing that could help you feel a little more contained?',
        purpose: 'Containment',
      });
      break;

    case 'armored':
      prompts.push({
        prompt: 'What do you think this tension might be protecting?',
        purpose: 'Honor the defense',
        followUp: 'Can you thank it for trying to help?',
      });
      prompts.push({
        prompt: 'If you were to let just 5% of this tension go, what would that be like?',
        purpose: 'Titrated release',
      });
      break;

    default:
      prompts.push({
        prompt: 'As you bring attention to your body right now, what do you notice first?',
        purpose: 'Open exploration',
      });
      prompts.push({
        prompt: 'Is there a place that\'s calling for your attention?',
        purpose: 'Follow the body\'s lead',
      });
  }

  // Region-specific prompts
  if (classification.affectedRegions.includes('chest') || classification.affectedRegions.includes('heart')) {
    prompts.push({
      prompt: 'Placing a hand on your chest, what do you notice under your palm?',
      purpose: 'Heart connection',
    });
  }

  if (classification.affectedRegions.includes('stomach') || classification.affectedRegions.includes('gut')) {
    prompts.push({
      prompt: 'Our gut often holds old emotions. What might this belly sensation be holding?',
      purpose: 'Gut wisdom',
    });
  }

  if (classification.affectedRegions.includes('throat')) {
    prompts.push({
      prompt: 'Is there something your throat wants to say? Or something it\'s holding back?',
      purpose: 'Expression',
    });
  }

  return prompts.slice(0, 4);
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

/**
 * Build professional somatic companion prompt
 */
export function buildSomaticPrompt(classification: SomaticClassification): string {
  const approach = SOMATIC_APPROACHES[classification.suggestedApproach];

  let windowGuidance = '';
  switch (classification.window) {
    case 'hyper':
      windowGuidance = 'User is HYPER-AROUSED (above window of tolerance). Focus on slowing down, grounding, and discharge.';
      break;
    case 'hypo':
      windowGuidance = 'User is HYPO-AROUSED (below window of tolerance). Focus on gentle activation, resourcing, and orienting.';
      break;
    case 'within':
      windowGuidance = 'User appears within window of tolerance. Open exploration is appropriate.';
      break;
  }

  let flagWarnings = '';
  if (classification.flags.dissociationRisk) {
    flagWarnings += '\n⚠️ Dissociation indicators present. Keep them oriented to present. Avoid closing eyes or going deep.';
  }
  if (classification.flags.floodingRisk) {
    flagWarnings += '\n⚠️ Flooding risk. Prioritize containment over exploration. Slow everything down.';
  }
  if (classification.flags.traumaIndicators) {
    flagWarnings += '\n⚠️ Trauma indicators. This is not therapy. Stay with sensation, not story. Suggest professional support.';
  }
  if (classification.flags.needsProfessional) {
    flagWarnings += '\n⚠️ SUGGEST PROFESSIONAL SUPPORT. What they\'re describing may need in-person trauma-informed care.';
  }

  return `You are a Somatic Companion - a guide for body awareness and nervous system regulation.

CURRENT STATE: ${classification.primaryState}${classification.secondaryState ? ` with ${classification.secondaryState}` : ''}
INTENSITY: ${classification.intensityLevel}
WINDOW OF TOLERANCE: ${windowGuidance}

APPROACH: ${approach.name}
${approach.description}

TECHNIQUES TO OFFER:
${approach.techniques.map(t => `- ${t}`).join('\n')}

AVOID:
${approach.avoid.map(a => `- ${a}`).join('\n')}

PACING: ${approach.pacing}
${flagWarnings}

---
AFFECTED REGIONS: ${classification.affectedRegions.join(', ') || 'Not specified'}
SENSATIONS: ${classification.dominantSensations.join(', ') || 'Not specified'}
---

Your role:
1. Validate their body experience without pathologizing
2. Guide them toward awareness, not interpretation
3. Offer one practice or inquiry at a time
4. Follow their body's wisdom, don't direct
5. Honor defenses as protective
6. Keep them oriented to present moment
7. Slow down if they're overwhelmed
8. Suggest professional support for trauma work

Response style:
- Warm but grounded
- Embodied language (feel, sense, notice)
- Present tense
- Short sentences
- One invitation at a time
- 2-3 paragraphs typically`;
}
