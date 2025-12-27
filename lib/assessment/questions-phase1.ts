/**
 * Phase 1: Current State
 *
 * Assesses the user's present-moment experience across all pillars.
 * This phase is critical for:
 * - Detecting collapse/crisis states that need immediate attention
 * - Understanding current nervous system state
 * - Gauging baseline functioning
 *
 * Questions use professional psychological assessment formats
 * while maintaining warmth and approachability.
 */

import type { Question } from './types';

export const PHASE_1_QUESTIONS: Question[] = [
  // ============================================================================
  // OPENING: General Current State (sets baseline, safety check)
  // ============================================================================
  {
    id: 'current_wellbeing',
    type: 'slider',
    text: 'Right now, how would you describe your overall sense of wellbeing?',
    subtext: 'Consider your mental, emotional, and physical state together.',
    min: 0,
    max: 100,
    step: 1,
    anchors: {
      low: 'Very poor',
      mid: 'Okay',
      high: 'Excellent',
    },
    phase: 1,
    required: true,
  },
  {
    id: 'current_overwhelm',
    type: 'intensity',
    text: 'How overwhelmed do you feel by life right now?',
    scale: 10,
    anchors: {
      low: 'Not at all overwhelmed',
      high: 'Completely overwhelmed',
    },
    phase: 1,
    required: true,
    reverseScored: true,
  },
  {
    id: 'current_stability',
    type: 'likert',
    text: 'Over the past week, how stable have you felt emotionally?',
    scale: 7,
    anchors: {
      low: 'Very unstable',
      mid: 'Fluctuating',
      high: 'Very stable',
    },
    phase: 1,
    pillar: 'mind',
    dimensions: ['emotionalIntelligence'],
    required: true,
  },
  {
    id: 'current_crisis',
    type: 'intensity',
    text: 'Are you currently experiencing a crisis or acute difficulty?',
    subtext: 'This could be emotional, relational, financial, health-related, or other.',
    scale: 10,
    anchors: {
      low: 'No crisis',
      high: 'Severe crisis',
    },
    phase: 1,
    required: true,
    sensitive: true,
    reverseScored: true,
  },

  // ============================================================================
  // BODY / NERVOUS SYSTEM
  // ============================================================================
  {
    id: 'body_energy',
    type: 'slider',
    text: 'What is your typical energy level throughout the day?',
    min: 0,
    max: 100,
    anchors: {
      low: 'Exhausted / Depleted',
      mid: 'Moderate',
      high: 'Vibrant / Energized',
    },
    phase: 1,
    pillar: 'body',
    dimensions: ['physicalVitality'],
    required: true,
  },
  {
    id: 'body_tension',
    type: 'frequency',
    text: 'How often do you notice tension, tightness, or discomfort in your body?',
    options: ['Rarely', 'Sometimes', 'Often', 'Most of the time', 'Constantly'],
    phase: 1,
    pillar: 'body',
    dimensions: ['nervousSystem', 'embodiment'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'body_sleep',
    type: 'likert',
    text: 'How would you rate your sleep quality over the past month?',
    scale: 7,
    anchors: {
      low: 'Very poor',
      mid: 'Adequate',
      high: 'Excellent',
    },
    phase: 1,
    pillar: 'body',
    dimensions: ['nervousSystem', 'physicalVitality'],
    required: true,
  },
  {
    id: 'body_calm',
    type: 'frequency',
    text: 'How often do you feel a sense of physical calm and ease?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Most of the time'],
    phase: 1,
    pillar: 'body',
    dimensions: ['nervousSystem'],
    required: true,
  },
  {
    id: 'body_awareness',
    type: 'likert',
    text: 'How connected do you feel to sensations in your body?',
    subtext: 'Can you easily notice what your body is experiencing?',
    scale: 7,
    anchors: {
      low: 'Very disconnected',
      mid: 'Somewhat connected',
      high: 'Deeply connected',
    },
    phase: 1,
    pillar: 'body',
    dimensions: ['embodiment'],
    required: true,
  },

  // ============================================================================
  // MIND / EMOTIONAL STATE
  // ============================================================================
  {
    id: 'mind_anxiety',
    type: 'frequency',
    text: 'In the past two weeks, how often have you felt anxious, worried, or on edge?',
    options: ['Not at all', 'A few days', 'More than half the days', 'Nearly every day', 'Constantly'],
    phase: 1,
    pillar: 'mind',
    dimensions: ['emotionalIntelligence'],
    required: true,
    reverseScored: true,
  },
  {
    id: 'mind_depression',
    type: 'frequency',
    text: 'In the past two weeks, how often have you felt down, hopeless, or lost interest in things?',
    options: ['Not at all', 'A few days', 'More than half the days', 'Nearly every day', 'Constantly'],
    phase: 1,
    pillar: 'mind',
    dimensions: ['emotionalIntelligence'],
    required: true,
    reverseScored: true,
    sensitive: true,
  },
  {
    id: 'mind_clarity',
    type: 'likert',
    text: 'How clear is your thinking right now?',
    subtext: 'Can you focus, make decisions, and think through problems?',
    scale: 7,
    anchors: {
      low: 'Very foggy / confused',
      mid: 'Somewhat clear',
      high: 'Very clear and sharp',
    },
    phase: 1,
    pillar: 'mind',
    dimensions: ['cognitiveClarity'],
    required: true,
  },
  {
    id: 'mind_emotional_range',
    type: 'likert',
    text: 'How well can you feel and express the full range of your emotions?',
    subtext: 'Including joy, sadness, anger, fear, and everything in between.',
    scale: 7,
    anchors: {
      low: 'Very limited / blocked',
      mid: 'Moderate range',
      high: 'Full access to emotions',
    },
    phase: 1,
    pillar: 'mind',
    dimensions: ['emotionalIntelligence'],
    required: true,
  },
  {
    id: 'mind_self_criticism',
    type: 'frequency',
    text: 'How often does your inner critic dominate your thinking?',
    options: ['Rarely', 'Sometimes', 'Often', 'Most of the time', 'Almost always'],
    phase: 1,
    pillar: 'mind',
    dimensions: ['shadowWork'],
    required: true,
    reverseScored: true,
  },

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================
  {
    id: 'rel_connection',
    type: 'likert',
    text: 'How connected do you feel to the people who matter most to you?',
    scale: 7,
    anchors: {
      low: 'Very disconnected',
      mid: 'Somewhat connected',
      high: 'Deeply connected',
    },
    phase: 1,
    pillar: 'relationships',
    dimensions: ['intimacy'],
    required: true,
  },
  {
    id: 'rel_safe',
    type: 'frequency',
    text: 'How often do you feel safe being fully yourself with others?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    phase: 1,
    pillar: 'relationships',
    dimensions: ['attachmentSecurity', 'intimacy'],
    required: true,
  },
  {
    id: 'rel_boundaries',
    type: 'likert',
    text: 'How effective are you at setting and maintaining healthy boundaries?',
    scale: 7,
    anchors: {
      low: 'Very ineffective',
      mid: 'Moderately effective',
      high: 'Very effective',
    },
    phase: 1,
    pillar: 'relationships',
    dimensions: ['boundaries'],
    required: true,
  },
  {
    id: 'rel_loneliness',
    type: 'frequency',
    text: 'How often do you feel lonely or isolated?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Most of the time'],
    phase: 1,
    pillar: 'relationships',
    dimensions: ['intimacy', 'attachmentSecurity'],
    required: true,
    reverseScored: true,
  },

  // ============================================================================
  // SOUL / MEANING
  // ============================================================================
  {
    id: 'soul_meaning',
    type: 'likert',
    text: 'How much meaning and purpose do you currently feel in your life?',
    scale: 7,
    anchors: {
      low: 'Very little meaning',
      mid: 'Some meaning',
      high: 'Deep sense of purpose',
    },
    phase: 1,
    pillar: 'soul',
    dimensions: ['meaningfulness'],
    required: true,
  },
  {
    id: 'soul_presence',
    type: 'frequency',
    text: 'How often are you able to be fully present in the current moment?',
    options: ['Rarely', 'Sometimes', 'About half the time', 'Often', 'Most of the time'],
    phase: 1,
    pillar: 'soul',
    dimensions: ['presence'],
    required: true,
  },
  {
    id: 'soul_inner_life',
    type: 'likert',
    text: 'How rich and nourishing is your inner life?',
    subtext: 'Your relationship with yourself, your thoughts, dreams, intuition.',
    scale: 7,
    anchors: {
      low: 'Empty or chaotic',
      mid: 'Somewhat present',
      high: 'Rich and vital',
    },
    phase: 1,
    pillar: 'soul',
    dimensions: ['meaningfulness', 'presence'],
    required: true,
  },

  // ============================================================================
  // FUNCTIONING / CAPACITY
  // ============================================================================
  {
    id: 'functioning_daily',
    type: 'likert',
    text: 'How well are you managing your day-to-day responsibilities?',
    subtext: 'Work, household, relationships, self-care.',
    scale: 7,
    anchors: {
      low: 'Barely managing',
      mid: 'Getting by',
      high: 'Managing well',
    },
    phase: 1,
    required: true,
  },
  {
    id: 'functioning_resilience',
    type: 'likert',
    text: 'When difficulties arise, how quickly do you recover your equilibrium?',
    scale: 7,
    anchors: {
      low: 'Takes a very long time',
      mid: 'Moderate recovery',
      high: 'Quick recovery',
    },
    phase: 1,
    pillar: 'body',
    dimensions: ['nervousSystem'],
    required: true,
  },

  // ============================================================================
  // OPEN: Current Situation (for context)
  // ============================================================================
  {
    id: 'current_situation_open',
    type: 'open',
    text: 'Is there anything specific happening in your life right now that feels important for us to know?',
    subtext: 'This is optional. Share only what feels comfortable.',
    placeholder: 'What\'s present for you right now...',
    maxLength: 2000,
    phase: 1,
    required: false,
    forContext: true,
  },
];

export default PHASE_1_QUESTIONS;
