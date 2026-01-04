/**
 * Assessment Synthesis Analysis Library
 *
 * Professional-grade system for synthesizing multiple assessment results.
 * Draws from:
 * - Jungian archetypal psychology
 * - Attachment theory (Bowlby, Ainsworth)
 * - Polyvagal theory (Porges)
 * - Developmental stage models
 * - IFS (Internal Family Systems)
 *
 * Key principles:
 * - Assessments reveal patterns, not permanent traits
 * - Integration happens through understanding + embodiment
 * - Different stages require different approaches
 * - Shadow material needs compassionate confrontation
 */

import type { ArchetypeData, AttachmentData, NervousSystemData } from './insights';

// =============================================================================
// SYNTHESIS TYPES
// =============================================================================

export type DevelopmentalStage =
  | 'collapse'      // Crisis, survival mode
  | 'regulation'    // Building basic stability
  | 'integration'   // Connecting parts, shadow work
  | 'embodiment'    // Living from wholeness
  | 'optimization'; // Fine-tuning, mastery

export type SynthesisApproach =
  | 'stabilize'   // Focus on safety and regulation
  | 'explore'     // Curious inquiry into patterns
  | 'integrate'   // Connect disparate parts
  | 'embody'      // Put insights into practice
  | 'challenge';  // Push growth edges

export interface CrossAssessmentPattern {
  pattern: string;
  assessmentSources: string[];
  significance: 'core' | 'supporting' | 'peripheral';
  description: string;
  integrationPath: string;
}

export interface IntegrationPriority {
  area: string;
  urgency: 'immediate' | 'short-term' | 'ongoing';
  reason: string;
  suggestedResources: string[];
}

export interface SynthesisClassification {
  overallStage: DevelopmentalStage;
  suggestedApproach: SynthesisApproach;
  patterns: CrossAssessmentPattern[];
  priorities: IntegrationPriority[];
  strengths: string[];
  blindSpots: string[];
  flags: {
    needsStabilization: boolean;
    shadowEmergency: boolean;
    relationalWounding: boolean;
    somaticArmoring: boolean;
  };
}

// =============================================================================
// PATTERN DETECTION
// =============================================================================

interface PatternMatcher {
  name: string;
  check: (arch: ArchetypeData | null, attach: AttachmentData | null, ns: NervousSystemData | null) => boolean;
  significance: 'core' | 'supporting' | 'peripheral';
  sources: string[];
  description: string;
  integrationPath: string;
}

const PATTERN_MATCHERS: PatternMatcher[] = [
  // Warrior + Avoidant + Sympathetic
  {
    name: 'Armored Warrior',
    check: (arch, attach, ns) =>
      arch?.primaryArchetype === 'Warrior' &&
      attach?.style === 'avoidant' &&
      ns?.state === 'sympathetic',
    significance: 'core',
    sources: ['archetype', 'attachment', 'nervous-system'],
    description: 'Strong boundaries may be masking vulnerability. The warrior protects, but also isolates.',
    integrationPath: 'Practice safe vulnerability in low-stakes relationships. Let others help.',
  },

  // Lover + Anxious + Ventral
  {
    name: 'Longing Lover',
    check: (arch, attach, ns) =>
      arch?.primaryArchetype === 'Lover' &&
      attach?.style === 'anxious',
    significance: 'core',
    sources: ['archetype', 'attachment'],
    description: 'Deep capacity for connection paired with fear of abandonment. May over-give to secure connection.',
    integrationPath: 'Build self-relationship before seeking external validation. Practice containment.',
  },

  // Magician + Avoidant
  {
    name: 'Isolated Sage',
    check: (arch, attach) =>
      arch?.primaryArchetype === 'Magician' &&
      attach?.style === 'avoidant',
    significance: 'core',
    sources: ['archetype', 'attachment'],
    description: 'Wisdom and insight may be used to maintain distance. Intellectualizing keeps emotions at bay.',
    integrationPath: 'Practice embodiment. Let wisdom flow through relationship, not around it.',
  },

  // King/Queen + Shadow + Dorsal
  {
    name: 'Collapsed Sovereign',
    check: (arch, _, ns) =>
      (arch?.primaryArchetype === 'King' || arch?.primaryArchetype === 'Queen') &&
      arch?.isWounded &&
      ns?.state === 'dorsal',
    significance: 'core',
    sources: ['archetype', 'nervous-system'],
    description: 'Natural leadership capacity is shutdown. May feel powerless or defeated.',
    integrationPath: 'Start with tiny acts of sovereignty. Regulate nervous system before expanding influence.',
  },

  // Anxious + Sympathetic
  {
    name: 'Hypervigilant Relating',
    check: (_, attach, ns) =>
      attach?.style === 'anxious' &&
      ns?.state === 'sympathetic',
    significance: 'core',
    sources: ['attachment', 'nervous-system'],
    description: 'Nervous system is activated in relationships. Scanning for threat of abandonment.',
    integrationPath: 'Learn to recognize and regulate activation. Build earned security through consistency.',
  },

  // Avoidant + Dorsal
  {
    name: 'Disconnected Withdrawal',
    check: (_, attach, ns) =>
      attach?.style === 'avoidant' &&
      ns?.state === 'dorsal',
    significance: 'core',
    sources: ['attachment', 'nervous-system'],
    description: 'Deep shutdown in connection. May feel numb or checked out in relationships.',
    integrationPath: 'Gentle re-approach to connection. Start with co-regulation, not demands.',
  },

  // Disorganized attachment
  {
    name: 'Approach-Avoidance Conflict',
    check: (_, attach) =>
      attach?.style === 'disorganized',
    significance: 'core',
    sources: ['attachment'],
    description: 'Craving closeness and fearing it simultaneously. May have trauma history.',
    integrationPath: 'Trauma-informed work with a skilled practitioner. Build safety before exploration.',
  },

  // Shadow archetype
  {
    name: 'Active Shadow Material',
    check: (arch) =>
      arch?.isWounded === true,
    significance: 'core',
    sources: ['archetype'],
    description: 'Archetype is expressing through its shadow. This isn\'t wrong—it\'s information about unmet needs.',
    integrationPath: 'Explore what the shadow is protecting. What need is being met in distorted ways?',
  },

  // Mother + Anxious
  {
    name: 'Over-Giving Mother',
    check: (arch, attach) =>
      arch?.primaryArchetype === 'Mother' &&
      (attach?.anxietyPercent ?? 0) > 60,
    significance: 'supporting',
    sources: ['archetype', 'attachment'],
    description: 'Care-giving may be driven by anxiety about being needed. May neglect own needs.',
    integrationPath: 'Practice receiving. Let others care for you without immediately reciprocating.',
  },

  // Huntress + Sympathetic
  {
    name: 'Relentless Pursuit',
    check: (arch, _, ns) =>
      arch?.primaryArchetype === 'Huntress' &&
      ns?.state === 'sympathetic',
    significance: 'supporting',
    sources: ['archetype', 'nervous-system'],
    description: 'Drive and focus paired with nervous system activation. May not know how to rest.',
    integrationPath: 'Practice deliberate rest. Learn to distinguish drive from compulsion.',
  },
];

/**
 * Detect cross-assessment patterns
 */
export function detectPatterns(
  archetype: ArchetypeData | null,
  attachment: AttachmentData | null,
  nervousSystem: NervousSystemData | null
): CrossAssessmentPattern[] {
  const patterns: CrossAssessmentPattern[] = [];

  for (const matcher of PATTERN_MATCHERS) {
    if (matcher.check(archetype, attachment, nervousSystem)) {
      patterns.push({
        pattern: matcher.name,
        assessmentSources: matcher.sources,
        significance: matcher.significance,
        description: matcher.description,
        integrationPath: matcher.integrationPath,
      });
    }
  }

  return patterns.sort((a, b) => {
    const order = { core: 0, supporting: 1, peripheral: 2 };
    return order[a.significance] - order[b.significance];
  });
}

// =============================================================================
// STAGE DETERMINATION
// =============================================================================

/**
 * Determine overall developmental stage from assessments
 */
export function determineDevelopmentalStage(
  archetype: ArchetypeData | null,
  attachment: AttachmentData | null,
  nervousSystem: NervousSystemData | null
): DevelopmentalStage {
  // Crisis indicators -> collapse
  if (nervousSystem?.state === 'dorsal' && attachment?.style === 'disorganized') {
    return 'collapse';
  }

  if (nervousSystem?.state === 'dorsal') {
    return 'collapse';
  }

  // High dysregulation -> regulation focus
  if (nervousSystem?.state === 'sympathetic' && attachment?.anxietyPercent && attachment.anxietyPercent > 70) {
    return 'regulation';
  }

  if (attachment?.style === 'disorganized') {
    return 'regulation';
  }

  // Shadow work needed -> integration
  if (archetype?.isWounded) {
    return 'integration';
  }

  if (attachment?.style !== 'secure' && nervousSystem?.state !== 'ventral') {
    return 'integration';
  }

  // Good foundation -> embodiment
  if (archetype?.isIntegrated && attachment?.style === 'secure') {
    return 'embodiment';
  }

  if (nervousSystem?.state === 'ventral' && !archetype?.isWounded) {
    return 'embodiment';
  }

  // Default
  return 'integration';
}

/**
 * Determine synthesis approach based on stage and patterns
 */
export function determineSynthesisApproach(
  stage: DevelopmentalStage,
  patterns: CrossAssessmentPattern[]
): SynthesisApproach {
  // Stage takes priority
  if (stage === 'collapse') return 'stabilize';
  if (stage === 'regulation') return 'stabilize';

  // Check for specific patterns
  const hasShadowEmergency = patterns.some(p =>
    p.pattern === 'Active Shadow Material' && p.significance === 'core'
  );

  if (hasShadowEmergency && stage !== 'embodiment') {
    return 'integrate';
  }

  // Stage-based defaults
  switch (stage) {
    case 'integration':
      return 'integrate';
    case 'embodiment':
      return 'embody';
    case 'optimization':
      return 'challenge';
    default:
      return 'explore';
  }
}

// =============================================================================
// PRIORITY GENERATION
// =============================================================================

/**
 * Generate integration priorities from assessment data
 */
export function generateIntegrationPriorities(
  archetype: ArchetypeData | null,
  attachment: AttachmentData | null,
  nervousSystem: NervousSystemData | null,
  patterns: CrossAssessmentPattern[]
): IntegrationPriority[] {
  const priorities: IntegrationPriority[] = [];

  // Nervous system is always foundational
  if (nervousSystem?.state === 'dorsal') {
    priorities.push({
      area: 'Nervous System Regulation',
      urgency: 'immediate',
      reason: 'Dorsal vagal shutdown limits capacity for other work',
      suggestedResources: ['polyvagal-theory', 'nervous-system-basics', 'grounding-practices'],
    });
  } else if (nervousSystem?.state === 'sympathetic') {
    priorities.push({
      area: 'Stress Regulation',
      urgency: 'short-term',
      reason: 'Activated nervous system affects all other areas',
      suggestedResources: ['breath-regulation', 'somatic-safety'],
    });
  }

  // Attachment work
  if (attachment?.style === 'disorganized') {
    priorities.push({
      area: 'Attachment Healing',
      urgency: 'immediate',
      reason: 'Disorganized attachment often indicates early relational trauma',
      suggestedResources: ['disorganized-attachment', 'attachment-healing'],
    });
  } else if (attachment?.style === 'anxious') {
    priorities.push({
      area: 'Self-Relationship',
      urgency: 'short-term',
      reason: 'Building internal security reduces relational anxiety',
      suggestedResources: ['anxious-attachment-patterns', 'self-soothing'],
    });
  } else if (attachment?.style === 'avoidant') {
    priorities.push({
      area: 'Vulnerability Practice',
      urgency: 'ongoing',
      reason: 'Avoidant patterns limit depth of connection',
      suggestedResources: ['avoidant-attachment', 'intimacy-skills'],
    });
  }

  // Archetype work
  if (archetype?.isWounded) {
    const archetypeName = archetype.primaryArchetype;
    priorities.push({
      area: `${archetypeName} Shadow Integration`,
      urgency: 'short-term',
      reason: `${archetypeName} is expressing through shadow rather than mature form`,
      suggestedResources: [`${archetypeName.toLowerCase()}-archetype`, 'shadow-work-basics'],
    });
  }

  // Pattern-specific priorities
  for (const pattern of patterns.filter(p => p.significance === 'core')) {
    if (!priorities.some(p => p.reason.includes(pattern.pattern))) {
      priorities.push({
        area: pattern.pattern,
        urgency: 'ongoing',
        reason: pattern.description,
        suggestedResources: [],
      });
    }
  }

  return priorities.slice(0, 5);
}

// =============================================================================
// STRENGTHS AND BLIND SPOTS
// =============================================================================

/**
 * Identify strengths from assessment data
 */
export function identifyStrengths(
  archetype: ArchetypeData | null,
  attachment: AttachmentData | null,
  nervousSystem: NervousSystemData | null
): string[] {
  const strengths: string[] = [];

  // Archetype strengths
  if (archetype?.isIntegrated) {
    strengths.push(`Mature ${archetype.primaryArchetype} energy available`);
  }

  if (archetype?.primaryArchetype) {
    const archetypeStrengths: Record<string, string> = {
      King: 'Natural capacity for leadership and blessing others',
      Queen: 'Sovereign presence and ability to create sacred space',
      Warrior: 'Discipline, boundaries, and protective energy',
      Lover: 'Deep capacity for connection and appreciation of beauty',
      Magician: 'Insight, wisdom, and ability to see patterns',
      Mother: 'Nurturing presence and unconditional acceptance',
      Maiden: 'Openness, playfulness, and capacity for wonder',
      Huntress: 'Focus, determination, and independence',
      Mystic: 'Spiritual depth and connection to the numinous',
      'Wild Woman': 'Instinctual wisdom and authentic expression',
    };
    if (archetypeStrengths[archetype.primaryArchetype]) {
      strengths.push(archetypeStrengths[archetype.primaryArchetype]);
    }
  }

  // Attachment strengths
  if (attachment?.style === 'secure') {
    strengths.push('Secure base for relationships and exploration');
  }
  if (attachment?.anxietyPercent && attachment.anxietyPercent < 30) {
    strengths.push('Low relational anxiety enables authentic connection');
  }
  if (attachment?.avoidancePercent && attachment.avoidancePercent < 30) {
    strengths.push('Comfortable with intimacy and vulnerability');
  }

  // Nervous system strengths
  if (nervousSystem?.state === 'ventral') {
    strengths.push('Regulated nervous system supports presence and connection');
  }
  if (nervousSystem?.counts?.ventral && nervousSystem.counts.ventral > 10) {
    strengths.push('Strong ventral vagal capacity for social engagement');
  }

  return strengths.slice(0, 5);
}

/**
 * Identify potential blind spots
 */
export function identifyBlindSpots(
  archetype: ArchetypeData | null,
  attachment: AttachmentData | null,
  nervousSystem: NervousSystemData | null
): string[] {
  const blindSpots: string[] = [];

  // Archetype blind spots
  if (archetype?.isWounded) {
    blindSpots.push(`${archetype.primaryArchetype} shadow may be running the show without awareness`);
  }

  // Specific archetype blind spots
  const archetypeBlindSpots: Record<string, string> = {
    Warrior: 'May mistake aggression for strength, or miss opportunities for vulnerability',
    Lover: 'May over-identify with relationships, lose sense of self',
    Magician: 'May use insight to manipulate or maintain distance',
    King: 'May become tyrannical or abdicate responsibility',
    Queen: 'May become controlling or lose touch with authentic power',
    Mother: 'May over-give at expense of self, enable dependency',
  };
  if (archetype?.primaryArchetype && archetypeBlindSpots[archetype.primaryArchetype]) {
    blindSpots.push(archetypeBlindSpots[archetype.primaryArchetype]);
  }

  // Attachment blind spots
  if (attachment?.style === 'avoidant') {
    blindSpots.push('Dismissing emotional needs (own and others) may feel like strength');
  }
  if (attachment?.style === 'anxious') {
    blindSpots.push('Intensity of connection-seeking may push others away');
  }

  // Nervous system blind spots
  if (nervousSystem?.state === 'sympathetic') {
    blindSpots.push('May not recognize when activation is driving behavior');
  }
  if (nervousSystem?.state === 'dorsal') {
    blindSpots.push('Numbness may be mistaken for peace');
  }

  return blindSpots.slice(0, 4);
}

// =============================================================================
// MAIN CLASSIFICATION FUNCTION
// =============================================================================

/**
 * Generate comprehensive synthesis classification
 */
export function classifySynthesis(
  archetype: ArchetypeData | null,
  attachment: AttachmentData | null,
  nervousSystem: NervousSystemData | null
): SynthesisClassification {
  const patterns = detectPatterns(archetype, attachment, nervousSystem);
  const stage = determineDevelopmentalStage(archetype, attachment, nervousSystem);
  const approach = determineSynthesisApproach(stage, patterns);
  const priorities = generateIntegrationPriorities(archetype, attachment, nervousSystem, patterns);
  const strengths = identifyStrengths(archetype, attachment, nervousSystem);
  const blindSpots = identifyBlindSpots(archetype, attachment, nervousSystem);

  return {
    overallStage: stage,
    suggestedApproach: approach,
    patterns,
    priorities,
    strengths,
    blindSpots,
    flags: {
      needsStabilization: stage === 'collapse' || stage === 'regulation',
      shadowEmergency: archetype?.isWounded === true && nervousSystem?.state !== 'ventral',
      relationalWounding: attachment?.style === 'disorganized' || (attachment?.anxietyPercent || 0) > 80,
      somaticArmoring: nervousSystem?.state === 'dorsal' && attachment?.style === 'avoidant',
    },
  };
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

export const STAGE_GUIDANCE: Record<DevelopmentalStage, string> = {
  collapse: `The user is in a dysregulated, survival-focused state. Focus on:
- Safety and stabilization first
- Simple, concrete suggestions
- Avoid overwhelming with complexity
- Normalize their experience
- Gently suggest professional support if appropriate`,

  regulation: `The user is building basic emotional regulation. Focus on:
- Building resources before exploring wounds
- Teaching nervous system awareness
- Celebrating small wins
- Balancing validation with gentle challenge`,

  integration: `The user is ready for deeper work. Focus on:
- Connecting patterns across assessments
- Shadow work with compassion
- Both/and thinking about polarities
- Practical integration exercises`,

  embodiment: `The user has good foundation. Focus on:
- Putting insights into daily practice
- Refining patterns rather than discovering new ones
- Living from wholeness
- Service and contribution`,

  optimization: `The user has strong integration. Focus on:
- Subtle pattern refinement
- Edge work and growth challenges
- Leadership and teaching others
- Legacy and deeper purpose`,
};

export const APPROACH_PROMPTS: Record<SynthesisApproach, string> = {
  stabilize: `Prioritize safety and regulation. Keep responses grounding and present-focused. Avoid deep exploration.`,
  explore: `Invite curious exploration of patterns. Ask opening questions. Hold space for not-knowing.`,
  integrate: `Connect disparate parts. Name paradoxes. Support holding complexity without splitting.`,
  embody: `Focus on practical application. What would it look like to live this? Specific embodiment practices.`,
  challenge: `Support growth edges. Direct about blind spots. Trust their capacity to handle honesty.`,
};

/**
 * Build enhanced synthesis prompt with classification data
 */
export function buildEnhancedSynthesisPrompt(
  classification: SynthesisClassification,
  assessmentContext: string
): string {
  const stageGuidance = STAGE_GUIDANCE[classification.overallStage];
  const approachGuidance = APPROACH_PROMPTS[classification.suggestedApproach];

  const patternSection = classification.patterns.length > 0
    ? `\n---\nCROSS-ASSESSMENT PATTERNS DETECTED:\n${classification.patterns
        .map(p => `- ${p.pattern} (${p.significance}): ${p.description}`)
        .join('\n')}`
    : '';

  const prioritySection = classification.priorities.length > 0
    ? `\n---\nSUGGESTED PRIORITIES:\n${classification.priorities
        .map(p => `- ${p.area} (${p.urgency}): ${p.reason}`)
        .join('\n')}`
    : '';

  const strengthSection = classification.strengths.length > 0
    ? `\n---\nSTRENGTHS TO HONOR:\n${classification.strengths.map(s => `- ${s}`).join('\n')}`
    : '';

  const blindSpotSection = classification.blindSpots.length > 0
    ? `\n---\nPOTENTIAL BLIND SPOTS:\n${classification.blindSpots.map(b => `- ${b}`).join('\n')}`
    : '';

  let flagWarnings = '';
  if (classification.flags.needsStabilization) {
    flagWarnings += '\n⚠️ User may need stabilization before deep exploration.';
  }
  if (classification.flags.shadowEmergency) {
    flagWarnings += '\n⚠️ Shadow material is active with nervous system dysregulation.';
  }
  if (classification.flags.relationalWounding) {
    flagWarnings += '\n⚠️ Significant relational wounding detected.';
  }
  if (classification.flags.somaticArmoring) {
    flagWarnings += '\n⚠️ Body may be shut down as protection.';
  }

  return `You are an Integration Guide synthesizing this user's psychological assessments.

DEVELOPMENTAL STAGE: ${classification.overallStage}
APPROACH: ${classification.suggestedApproach}

${stageGuidance}

${approachGuidance}
${flagWarnings}
${patternSection}
${prioritySection}
${strengthSection}
${blindSpotSection}

---
RAW ASSESSMENT DATA:
${assessmentContext}
---

Guidelines:
- Reference their specific results and patterns
- Connect dots between assessments
- Be direct but compassionate about shadow material
- Ground insights in practical suggestions
- Honor strengths alongside growth areas
- 2-4 paragraphs typically
- One or two specific invitations when appropriate

---
PRACTICE SUGGESTIONS:

IMPORTANT: End your synthesis with a "Suggested Practices" section. Based on the user's stage and patterns, suggest 1-2 specific, embodied practices they can try:

For STABILIZE/REGULATION stages:
- Simple grounding exercises (5-4-3-2-1 senses, feet on floor)
- Breath regulation (extended exhale, box breathing)
- Safe co-regulation activities (time with pets, trusted people)
- Body-based settling (warm drink, weighted blanket, gentle movement)

For INTEGRATION stages:
- Journaling prompts connecting to patterns ("When I notice [pattern], I feel...")
- Parts work questions ("What part of me is driving this? What does it need?")
- Shadow dialogue exercises
- Somatic awareness of where patterns live in the body

For EMBODIMENT/OPTIMIZATION stages:
- Daily micro-practices aligned with archetype strengths
- Edge work - small acts outside comfort zone
- Teaching or sharing insights with others
- Ritual and ceremony to honor growth

Format your suggestion like:
"**Practice to Try:** [Specific practice with concrete instructions - what to do, when, for how long]"

The practice should be:
- Concrete and actionable (not vague like "be more aware")
- Matched to their developmental stage (simple if stabilizing, deeper if integrating)
- Connected to a pattern or priority you mentioned
- Doable in 5-15 minutes`;
}
