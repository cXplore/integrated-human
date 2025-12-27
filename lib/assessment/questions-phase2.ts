/**
 * Phase 2: Patterns & History
 *
 * Assesses deeper patterns that have developed over time:
 * - Attachment patterns
 * - Shadow material and defenses
 * - Historical development
 * - Coping strategies
 *
 * This phase helps distinguish between:
 * - Temporary states (someone in crisis but otherwise developed)
 * - Chronic patterns (long-standing difficulties)
 * - Developmental progression (where they've come from)
 */

import type { Question } from './types';

export const PHASE_2_QUESTIONS: Question[] = [
  // ============================================================================
  // ATTACHMENT PATTERNS
  // ============================================================================
  {
    id: 'attach_closeness',
    type: 'agreement',
    text: 'I find it relatively easy to get close to others.',
    scale: 7,
    phase: 2,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity'],
    required: true,
  },
  {
    id: 'attach_depend',
    type: 'agreement',
    text: 'I am comfortable depending on others and having others depend on me.',
    scale: 7,
    phase: 2,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity', 'intimacy'],
    required: true,
  },
  {
    id: 'attach_abandon',
    type: 'frequency',
    text: 'How often do you worry that people you care about will leave or abandon you?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
    phase: 2,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'attach_distance',
    type: 'agreement',
    text: 'I often feel the need to pull away when people get too close.',
    scale: 7,
    phase: 2,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity', 'intimacy'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'attach_conflict',
    type: 'likert',
    text: 'When conflict arises in relationships, I am generally able to stay present and work through it.',
    scale: 7,
    anchors: {
      low: 'Very difficult',
      mid: 'Moderately able',
      high: 'Very capable',
    },
    phase: 2,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity', 'boundaries'],
    required: true,
  },

  // ============================================================================
  // SHADOW / DEFENSES
  // ============================================================================
  {
    id: 'shadow_aware',
    type: 'likert',
    text: 'How aware are you of the parts of yourself that you tend to hide or suppress?',
    scale: 7,
    anchors: {
      low: 'Not aware at all',
      mid: 'Somewhat aware',
      high: 'Very aware',
    },
    phase: 2,
    pillar: 'mind',
    dimensions: ['shadowWork'],
    required: true,
  },
  {
    id: 'shadow_triggers',
    type: 'frequency',
    text: 'How often do you get triggered or have strong emotional reactions that seem out of proportion?',
    options: ['Rarely', 'Sometimes', 'Often', 'Very often', 'Constantly'],
    phase: 2,
    pillar: 'mind',
    dimensions: ['shadowWork', 'emotionalIntelligence'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'shadow_projection',
    type: 'likert',
    text: 'When I strongly dislike something in another person, I can usually recognize it as something I struggle with too.',
    scale: 7,
    anchors: {
      low: 'Never recognize this',
      mid: 'Sometimes',
      high: 'Usually recognize this',
    },
    phase: 2,
    pillar: 'mind',
    dimensions: ['shadowWork'],
    required: true,
  },
  {
    id: 'shadow_integration',
    type: 'likert',
    text: 'How comfortable are you sitting with difficult emotions like anger, jealousy, or shame?',
    scale: 7,
    anchors: {
      low: 'Very uncomfortable',
      mid: 'Somewhat comfortable',
      high: 'Very comfortable',
    },
    phase: 2,
    pillar: 'mind',
    dimensions: ['shadowWork', 'emotionalIntelligence'],
    required: true,
  },

  // ============================================================================
  // NERVOUS SYSTEM PATTERNS
  // ============================================================================
  {
    id: 'ns_hypervigilance',
    type: 'frequency',
    text: 'How often do you feel on guard, scanning for threats, or unable to fully relax?',
    options: ['Rarely', 'Sometimes', 'Often', 'Most of the time', 'Almost always'],
    phase: 2,
    pillar: 'body',
    dimensions: ['nervousSystem'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'ns_shutdown',
    type: 'frequency',
    text: 'How often do you feel numb, disconnected, or shut down?',
    options: ['Rarely', 'Sometimes', 'Often', 'Most of the time', 'Almost always'],
    phase: 2,
    pillar: 'body',
    dimensions: ['nervousSystem', 'embodiment'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'ns_regulation',
    type: 'likert',
    text: 'When you become stressed or activated, how easily can you calm yourself down?',
    scale: 7,
    anchors: {
      low: 'Very difficult',
      mid: 'Takes some effort',
      high: 'Relatively easy',
    },
    phase: 2,
    pillar: 'body',
    dimensions: ['nervousSystem'],
    required: true,
  },
  {
    id: 'ns_body_trust',
    type: 'likert',
    text: 'Do you generally trust your body and its signals?',
    scale: 7,
    anchors: {
      low: 'Not at all',
      mid: 'Somewhat',
      high: 'Completely',
    },
    phase: 2,
    pillar: 'body',
    dimensions: ['embodiment'],
    required: true,
  },

  // ============================================================================
  // COPING PATTERNS
  // ============================================================================
  {
    id: 'cope_avoidance',
    type: 'frequency',
    text: 'When facing difficult emotions, how often do you avoid or distract yourself?',
    options: ['Rarely', 'Sometimes', 'About half the time', 'Often', 'Almost always'],
    phase: 2,
    pillar: 'mind',
    dimensions: ['emotionalIntelligence', 'shadowWork'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'cope_substances',
    type: 'frequency',
    text: 'How often do you use substances (alcohol, cannabis, etc.) to manage stress or emotions?',
    subtext: 'This is not a judgment - just understanding patterns.',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
    phase: 2,
    pillar: 'body',
    dimensions: ['nervousSystem'],
    required: true,
    reverseScored: true,
    sensitive: true,
  },
  {
    id: 'cope_healthy',
    type: 'frequency',
    text: 'How often do you use healthy coping strategies when stressed?',
    subtext: 'Exercise, nature, talking to someone, creative expression, practices, etc.',
    options: ['Rarely', 'Sometimes', 'About half the time', 'Often', 'Almost always'],
    phase: 2,
    pillar: 'mind',
    dimensions: ['emotionalIntelligence'],
    required: true,
  },

  // ============================================================================
  // HISTORY / DEVELOPMENT
  // ============================================================================
  {
    id: 'history_childhood',
    type: 'likert',
    text: 'Overall, how would you describe your childhood emotional environment?',
    scale: 7,
    anchors: {
      low: 'Very difficult / unsafe',
      mid: 'Mixed',
      high: 'Supportive / nurturing',
    },
    phase: 2,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity'],
    required: true,
    sensitive: true,
  },
  {
    id: 'history_trauma',
    type: 'intensity',
    text: 'How much has past trauma or difficult experiences impacted your current life?',
    scale: 10,
    anchors: {
      low: 'Not at all',
      high: 'Very significantly',
    },
    phase: 2,
    required: true,
    sensitive: true,
    reverseScored: true,
  },
  {
    id: 'history_healing',
    type: 'likert',
    text: 'If you have experienced trauma or difficulty, how much healing work have you done around it?',
    scale: 7,
    anchors: {
      low: 'None / Just beginning',
      mid: 'Some work',
      high: 'Significant work',
    },
    phase: 2,
    pillar: 'mind',
    dimensions: ['shadowWork'],
    required: false,
    skipCondition: 'history_trauma', // Only show if trauma > 0
  },

  // ============================================================================
  // RELATIONSHIP PATTERNS
  // ============================================================================
  {
    id: 'rel_pattern_repeat',
    type: 'likert',
    text: 'How much do you notice repeating patterns in your relationships?',
    subtext: 'Attracting similar people, having similar conflicts, etc.',
    scale: 7,
    anchors: {
      low: 'Rarely notice patterns',
      mid: 'Some patterns',
      high: 'Many repeating patterns',
    },
    phase: 2,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'rel_pattern_aware',
    type: 'likert',
    text: 'How aware are you of why these patterns occur?',
    scale: 7,
    anchors: {
      low: 'Not aware',
      mid: 'Somewhat aware',
      high: 'Very aware',
    },
    phase: 2,
    pillar: 'mind',
    dimensions: ['cognitiveClarity', 'shadowWork'],
    required: true,
    skipCondition: 'rel_pattern_repeat',
  },

  // ============================================================================
  // INNER LIFE / SPIRITUAL HISTORY
  // ============================================================================
  {
    id: 'soul_practice_history',
    type: 'likert',
    text: 'What is your history with contemplative or spiritual practices?',
    subtext: 'Meditation, prayer, mindfulness, ceremony, etc.',
    scale: 7,
    anchors: {
      low: 'None / Very new',
      mid: 'Some experience',
      high: 'Extensive experience',
    },
    phase: 2,
    pillar: 'soul',
    dimensions: ['spiritualPractice'],
    required: true,
  },
  {
    id: 'soul_dark_night',
    type: 'intensity',
    text: 'Have you experienced periods of profound crisis, questioning, or "dark night of the soul"?',
    scale: 10,
    anchors: {
      low: 'Never',
      high: 'Very intense experiences',
    },
    phase: 2,
    pillar: 'soul',
    dimensions: ['meaningfulness'],
    required: true,
  },
  {
    id: 'soul_awakening',
    type: 'frequency',
    text: 'How often do you experience moments of deep presence, connection, or expanded awareness?',
    options: ['Never', 'Very rarely', 'Sometimes', 'Regularly', 'Often'],
    phase: 2,
    pillar: 'soul',
    dimensions: ['presence', 'spiritualPractice'],
    required: true,
  },

  // ============================================================================
  // OPEN: PATTERNS
  // ============================================================================
  {
    id: 'patterns_open',
    type: 'open',
    text: 'What patterns in your life would you most like to understand or change?',
    subtext: 'This helps us understand what matters most to you.',
    placeholder: 'The patterns I notice...',
    maxLength: 2000,
    phase: 2,
    required: false,
    forContext: true,
  },
];

export default PHASE_2_QUESTIONS;
