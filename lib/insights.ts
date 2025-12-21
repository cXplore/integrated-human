/**
 * Cross-assessment insights engine
 * Generates personalized insights by connecting patterns across assessments
 */

export interface ArchetypeData {
  gender: 'man' | 'woman';
  primaryArchetype: string;
  secondaryArchetype: string | null;
  isWounded: boolean;
  isIntegrated: boolean;
  profiles: {
    primary: Array<{
      archetype: string;
      mature: number;
      shadow: number;
      total: number;
      ratio: number;
    }>;
    secondary: Array<{
      archetype: string;
      mature: number;
      shadow: number;
      total: number;
      ratio: number;
    }>;
  };
}

export interface AttachmentData {
  style: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  styleName: string;
  anxietyPercent: number;
  avoidancePercent: number;
}

export interface NervousSystemData {
  state: 'ventral' | 'sympathetic' | 'dorsal' | 'mixed';
  stateName: string;
  counts: {
    ventral: number;
    sympathetic: number;
    dorsal: number;
  };
}

export interface CrossInsight {
  title: string;
  insight: string;
  invitation: string;
  sources: string[]; // Which assessments this draws from
}

export interface InsightSummary {
  overallPattern: string;
  insights: CrossInsight[];
  primaryWork: string;
  strengths: string[];
  watchPoints: string[];
}

// Map archetypes to their core patterns
const archetypePatterns = {
  // Masculine
  King: { core: 'holding space', shadow: 'control or collapse', need: 'grounded authority' },
  Warrior: { core: 'boundaries', shadow: 'aggression or passivity', need: 'focused protection' },
  Magician: { core: 'awareness', shadow: 'manipulation or denial', need: 'truthful seeing' },
  Lover: { core: 'connection', shadow: 'addiction or numbness', need: 'feeling aliveness' },
  // Feminine
  Queen: { core: 'radiance', shadow: 'jealousy or self-abandonment', need: 'self-worth' },
  Mother: { core: 'nurturing', shadow: 'devouring or absence', need: 'caring without losing self' },
  Maiden: { core: 'receptivity', shadow: 'eternal girl or hardened', need: 'vulnerable openness' },
  Huntress: { core: 'independence', shadow: 'hostility or collapse', need: 'autonomous power' },
  Mystic: { core: 'depth', shadow: 'withdrawal or scattered', need: 'inner stillness' },
  WildWoman: { core: 'primal force', shadow: 'destruction or tameness', need: 'channeled intensity' },
};

/**
 * Generate cross-assessment insights
 */
export function generateInsights(
  archetype?: ArchetypeData,
  attachment?: AttachmentData,
  nervousSystem?: NervousSystemData
): InsightSummary | null {
  // Need at least 2 assessments to generate meaningful insights
  const hasArchetype = !!archetype;
  const hasAttachment = !!attachment;
  const hasNervousSystem = !!nervousSystem;

  const assessmentCount = [hasArchetype, hasAttachment, hasNervousSystem].filter(Boolean).length;
  if (assessmentCount < 2) {
    return null;
  }

  const insights: CrossInsight[] = [];
  const strengths: string[] = [];
  const watchPoints: string[] = [];

  // Archetype + Attachment connections
  if (archetype && attachment) {
    const archetypeAttachmentInsight = getArchetypeAttachmentInsight(archetype, attachment);
    if (archetypeAttachmentInsight) {
      insights.push(archetypeAttachmentInsight);
    }

    // Identify strengths and watch points
    if (attachment.style === 'secure') {
      strengths.push('Your secure attachment provides a stable foundation for expressing your archetypal energy');
    }

    if (archetype.isWounded && attachment.style !== 'secure') {
      watchPoints.push('Wounded archetype patterns may be amplifying attachment insecurity — work on one often helps the other');
    }
  }

  // Archetype + Nervous System connections
  if (archetype && nervousSystem) {
    const archetypeNervousInsight = getArchetypeNervousSystemInsight(archetype, nervousSystem);
    if (archetypeNervousInsight) {
      insights.push(archetypeNervousInsight);
    }

    if (nervousSystem.state === 'ventral') {
      strengths.push('Regulated nervous system allows access to your mature archetypal expressions');
    }

    if (archetype.isWounded && nervousSystem.state !== 'ventral') {
      watchPoints.push('Shadow patterns often emerge when the nervous system is dysregulated — grounding first may help');
    }
  }

  // Attachment + Nervous System connections
  if (attachment && nervousSystem) {
    const attachmentNervousInsight = getAttachmentNervousSystemInsight(attachment, nervousSystem);
    if (attachmentNervousInsight) {
      insights.push(attachmentNervousInsight);
    }

    if (attachment.style === 'anxious' && nervousSystem.state === 'sympathetic') {
      watchPoints.push('Anxious attachment + activated nervous system creates an amplifying loop — body regulation is key');
    }

    if (attachment.style === 'avoidant' && nervousSystem.state === 'dorsal') {
      watchPoints.push('Avoidant patterns may be reinforced by shutdown — gentle activation before connection work may help');
    }
  }

  // All three together
  if (archetype && attachment && nervousSystem) {
    const holisticInsight = getHolisticInsight(archetype, attachment, nervousSystem);
    if (holisticInsight) {
      insights.push(holisticInsight);
    }
  }

  // Determine primary work
  const primaryWork = determinePrimaryWork(archetype, attachment, nervousSystem);

  // Generate overall pattern
  const overallPattern = generateOverallPattern(archetype, attachment, nervousSystem);

  return {
    overallPattern,
    insights,
    primaryWork,
    strengths,
    watchPoints,
  };
}

function getArchetypeAttachmentInsight(
  archetype: ArchetypeData,
  attachment: AttachmentData
): CrossInsight | null {
  const primary = archetype.primaryArchetype;
  const style = attachment.style;

  // Specific combinations
  if ((primary === 'Lover' || primary === 'Lover') && style === 'anxious') {
    return {
      title: 'The Lover\'s Longing',
      insight: `Your strong Lover energy combined with anxious attachment creates a powerful drive toward connection — but also a fear that it will never be enough. The Lover feels everything deeply; anxiety amplifies this into hypervigilance about whether you're loved.`,
      invitation: 'Practice feeling fully without needing the other person to complete you. The Lover integrated can feel intensely AND stay centered.',
      sources: ['archetype', 'attachment'],
    };
  }

  if ((primary === 'Warrior' || primary === 'Huntress') && style === 'avoidant') {
    return {
      title: 'The Fortress',
      insight: `Your ${primary} energy provides strength and independence — but combined with avoidant attachment, this can become a fortress. The boundary-setting capacity that protects you may also keep out the intimacy you might secretly want.`,
      invitation: 'Your strength is real. Can you be strong AND let people in? Protection and vulnerability aren\'t opposites.',
      sources: ['archetype', 'attachment'],
    };
  }

  if ((primary === 'King' || primary === 'Queen') && style === 'secure') {
    return {
      title: 'Grounded Sovereignty',
      insight: `Your ${primary} archetype combined with secure attachment creates a powerful capacity for leadership in relationship. You can hold space without needing to control, and remain centered when others are struggling.`,
      invitation: 'This is a gift. Consider how you can model healthy relating for others without making it about you.',
      sources: ['archetype', 'attachment'],
    };
  }

  if ((primary === 'Magician' || primary === 'Mystic') && style === 'avoidant') {
    return {
      title: 'The Observer\'s Distance',
      insight: `Your ${primary} capacity for seeing clearly can combine with avoidance to create distance from what you see. You may understand relationship dynamics intellectually while keeping yourself safely removed from actually experiencing them.`,
      invitation: 'Insight is not the same as intimacy. Can you bring your awareness into the experience, not just about it?',
      sources: ['archetype', 'attachment'],
    };
  }

  if ((primary === 'Mother') && (style === 'anxious' || style === 'disorganized')) {
    return {
      title: 'The Giving That Depletes',
      insight: `Your Mother archetype drives you to nurture — but combined with attachment insecurity, this giving may come from anxiety about being needed rather than genuine overflow. You might care for others hoping they\'ll finally stay.`,
      invitation: 'Your nurturing is real. But are you giving from fullness or from fear of abandonment? Notice the difference in your body.',
      sources: ['archetype', 'attachment'],
    };
  }

  // Generic fallback
  const pattern = archetypePatterns[primary as keyof typeof archetypePatterns];
  if (pattern) {
    return {
      title: `${primary} + ${attachment.styleName}`,
      insight: `Your ${primary} archetype (${pattern.core}) interacts with your ${attachment.styleName.toLowerCase()} attachment. ${style !== 'secure' ? `The ${pattern.shadow} shadow may be reinforced by attachment patterns.` : `Your secure base supports healthy ${pattern.core}.`}`,
      invitation: `Notice how your attachment style shows up when you\'re in ${primary} energy. Are they working together or against each other?`,
      sources: ['archetype', 'attachment'],
    };
  }

  return null;
}

function getArchetypeNervousSystemInsight(
  archetype: ArchetypeData,
  nervousSystem: NervousSystemData
): CrossInsight | null {
  const primary = archetype.primaryArchetype;
  const state = nervousSystem.state;

  if (archetype.isWounded && state === 'sympathetic') {
    return {
      title: 'Shadow Under Activation',
      insight: `When your nervous system is in fight-flight mode, the shadow side of your ${primary} archetype is more likely to emerge. The mature expression requires the groundedness that activation makes difficult to access.`,
      invitation: 'Before trying to "work on" your archetype patterns, try regulating your nervous system first. Shadow work from a dysregulated state often reinforces the shadow.',
      sources: ['archetype', 'nervous-system'],
    };
  }

  if (archetype.isWounded && state === 'dorsal') {
    return {
      title: 'Shadow in Shutdown',
      insight: `Your nervous system\'s shutdown state may be related to the shadow patterns in your ${primary} archetype. Dorsal collapse can look like the "passive" side of shadow — the impotent Lover, the weak King, the damsel.`,
      invitation: 'Gentle activation before integration. You may need to thaw before you can transform.',
      sources: ['archetype', 'nervous-system'],
    };
  }

  if (archetype.isIntegrated && state === 'ventral') {
    return {
      title: 'Integrated Expression',
      insight: `Your regulated nervous system supports the mature expression of your ${primary} archetype. From this grounded place, you have access to ${archetypePatterns[primary as keyof typeof archetypePatterns]?.core || 'your core gifts'} without the shadow taking over.`,
      invitation: 'This is your practice ground. Notice what maintains this state, and what disrupts it.',
      sources: ['archetype', 'nervous-system'],
    };
  }

  if ((primary === 'Warrior' || primary === 'Huntress') && state === 'sympathetic') {
    return {
      title: 'Activation as Default',
      insight: `Your ${primary} energy is naturally mobilized — you\'re built for action. But if your nervous system is chronically activated, you may be in warrior mode when the situation doesn\'t require it. The sword is always drawn.`,
      invitation: 'Can the warrior rest without losing readiness? Practice being alert AND calm.',
      sources: ['archetype', 'nervous-system'],
    };
  }

  if ((primary === 'Mystic' || primary === 'Magician') && state === 'dorsal') {
    return {
      title: 'Withdrawal as Wisdom',
      insight: `Your ${primary} archetype values depth and stillness — but combined with dorsal shutdown, this can become avoidance disguised as spiritual practice. Silence chosen is different from silence collapsed into.`,
      invitation: 'Is your retreat toward depth or away from life? Notice the difference in your body.',
      sources: ['archetype', 'nervous-system'],
    };
  }

  return null;
}

function getAttachmentNervousSystemInsight(
  attachment: AttachmentData,
  nervousSystem: NervousSystemData
): CrossInsight | null {
  const style = attachment.style;
  const state = nervousSystem.state;

  if (style === 'anxious' && state === 'sympathetic') {
    return {
      title: 'The Anxiety Loop',
      insight: 'Your anxious attachment and activated nervous system are reinforcing each other. Relational anxiety triggers fight-flight, which makes you scan harder for threats to connection, which maintains the activation. This is a loop that runs on its own.',
      invitation: 'Breaking the loop starts with the body. When you notice the urge to seek reassurance, try regulating your nervous system first. The need may look different once you\'re grounded.',
      sources: ['attachment', 'nervous-system'],
    };
  }

  if (style === 'avoidant' && state === 'dorsal') {
    return {
      title: 'The Shutdown Loop',
      insight: 'Your avoidant patterns may be connected to nervous system shutdown. When closeness feels overwhelming, you don\'t just pull away mentally — your body goes into conservation mode. This makes re-engaging feel even harder.',
      invitation: 'Gentle activation before connection. Movement, breath, small doses of contact. Your system needs to wake up before it can relate.',
      sources: ['attachment', 'nervous-system'],
    };
  }

  if (style === 'disorganized' && state === 'mixed') {
    return {
      title: 'The Push-Pull Pattern',
      insight: 'Your disorganized attachment and mixed nervous system state reflect the same pattern: approach and avoid, activate and collapse. This isn\'t a flaw — it\'s often a brilliant adaptation to an impossible situation. But now it may be running when you don\'t need it.',
      invitation: 'The work is building capacity to stay in one state longer. Not forcing — just gradually expanding your window of tolerance.',
      sources: ['attachment', 'nervous-system'],
    };
  }

  if (style === 'secure' && state === 'ventral') {
    return {
      title: 'Relational Resilience',
      insight: 'Your secure attachment and regulated nervous system support each other. When you feel safe in relationship, your body stays calm. When your body is calm, you can take the risks intimacy requires.',
      invitation: 'This capacity is a gift, but it\'s not fixed. Notice what maintains it, protect it, and share it with others who are still building it.',
      sources: ['attachment', 'nervous-system'],
    };
  }

  return null;
}

function getHolisticInsight(
  archetype: ArchetypeData,
  attachment: AttachmentData,
  nervousSystem: NervousSystemData
): CrossInsight {
  const regulated = nervousSystem.state === 'ventral';
  const secure = attachment.style === 'secure';
  const integrated = archetype.isIntegrated;

  // Count "healthy" indicators
  const healthyCount = [regulated, secure, integrated].filter(Boolean).length;

  if (healthyCount === 3) {
    return {
      title: 'Integrated Wholeness',
      insight: 'Your archetype, attachment, and nervous system assessments all show healthy patterns. This doesn\'t mean you\'re "done" — but you have a solid foundation. The work now is about depth, service, and maintaining what you\'ve built.',
      invitation: 'Consider how you can support others in their integration. Your stability is a resource for the world.',
      sources: ['archetype', 'attachment', 'nervous-system'],
    };
  }

  if (healthyCount === 0) {
    return {
      title: 'Interwoven Patterns',
      insight: `Your assessments show interconnected patterns: shadow archetypal expression, insecure attachment, and nervous system dysregulation often feed each other. This isn't overwhelming — it means working on any one area will help the others.`,
      invitation: 'Start with the body. Nervous system regulation often creates the foundation for the other work. You don\'t have to solve everything at once.',
      sources: ['archetype', 'attachment', 'nervous-system'],
    };
  }

  // Mixed picture
  const strong = [];
  const growing = [];

  if (regulated) strong.push('nervous system regulation');
  else growing.push('nervous system regulation');

  if (secure) strong.push('secure attachment');
  else growing.push('attachment security');

  if (integrated) strong.push('integrated archetype expression');
  else growing.push('archetype integration');

  return {
    title: 'Your Unique Constellation',
    insight: `Your strengths are ${strong.join(' and ')}. Your growing edges are ${growing.join(' and ')}. These aren't separate — ${strong[0]} can support your work on ${growing[0]}.`,
    invitation: 'Use your strengths as a foundation for growth. Don\'t try to fix everything at once — let your strong areas support the developing ones.',
    sources: ['archetype', 'attachment', 'nervous-system'],
  };
}

function determinePrimaryWork(
  archetype?: ArchetypeData,
  attachment?: AttachmentData,
  nervousSystem?: NervousSystemData
): string {
  // Priority: Nervous system > Attachment > Archetype
  // Because regulation enables everything else

  if (nervousSystem && nervousSystem.state !== 'ventral') {
    return 'Nervous system regulation is your foundation. When your body feels safe, the other patterns become more workable.';
  }

  if (attachment && attachment.style !== 'secure') {
    return 'Attachment healing is your growing edge. With a regulated nervous system, you can start rewiring relational patterns.';
  }

  if (archetype && archetype.isWounded) {
    return 'Archetype integration is your current work. Your stable foundation supports shadow integration.';
  }

  return 'Deepening and maintaining integration. Your foundation is solid — the work is about depth and service.';
}

function generateOverallPattern(
  archetype?: ArchetypeData,
  attachment?: AttachmentData,
  nervousSystem?: NervousSystemData
): string {
  const parts = [];

  if (archetype) {
    const archetypePart = archetype.secondaryArchetype
      ? `${archetype.primaryArchetype}-${archetype.secondaryArchetype} ${archetype.isWounded ? '(in shadow)' : '(integrated)'}`
      : `${archetype.primaryArchetype} ${archetype.isWounded ? '(in shadow)' : '(integrated)'}`;
    parts.push(archetypePart);
  }

  if (attachment) {
    parts.push(`${attachment.styleName} attachment`);
  }

  if (nervousSystem) {
    parts.push(`${nervousSystem.stateName} nervous system`);
  }

  return parts.join(' + ');
}
