/**
 * Phase 3: Depth & Direction
 *
 * Assesses:
 * - Experience level with inner work
 * - Current priorities and intentions
 * - Readiness for different types of content
 * - Personal goals and direction
 *
 * This phase helps match the user to appropriate content depth
 * and understand what matters most to them right now.
 */

import type { Question } from './types';

export const PHASE_3_QUESTIONS: Question[] = [
  // ============================================================================
  // EXPERIENCE LEVEL
  // ============================================================================
  {
    id: 'exp_therapy',
    type: 'likert',
    text: 'What is your experience with therapy or counseling?',
    scale: 7,
    anchors: {
      low: 'None',
      mid: 'Some experience',
      high: 'Extensive experience',
    },
    phase: 3,
    pillar: 'mind',
    dimensions: ['emotionalIntelligence', 'shadowWork'],
    required: true,
  },
  {
    id: 'exp_bodywork',
    type: 'likert',
    text: 'What is your experience with body-based practices?',
    subtext: 'Yoga, somatic therapy, breathwork, movement practices, etc.',
    scale: 7,
    anchors: {
      low: 'None',
      mid: 'Some experience',
      high: 'Extensive experience',
    },
    phase: 3,
    pillar: 'body',
    dimensions: ['embodiment'],
    required: true,
  },
  {
    id: 'exp_meditation',
    type: 'likert',
    text: 'What is your experience with meditation or mindfulness practices?',
    scale: 7,
    anchors: {
      low: 'None',
      mid: 'Some experience',
      high: 'Extensive experience',
    },
    phase: 3,
    pillar: 'soul',
    dimensions: ['presence', 'spiritualPractice'],
    required: true,
  },
  {
    id: 'exp_psychedelics',
    type: 'likert',
    text: 'What is your experience with psychedelics or plant medicines?',
    subtext: 'For therapeutic or spiritual purposes.',
    scale: 7,
    anchors: {
      low: 'None',
      mid: 'Some experience',
      high: 'Extensive experience',
    },
    phase: 3,
    pillar: 'soul',
    dimensions: ['presence', 'meaningfulness'],
    required: true,
    sensitive: true,
  },
  {
    id: 'exp_depth',
    type: 'likert',
    text: 'How deep into inner work have you gone?',
    subtext: 'This could be through any modality - therapy, meditation, retreat, crisis, etc.',
    scale: 7,
    anchors: {
      low: 'Just beginning',
      mid: 'Moderate depth',
      high: 'Very deep exploration',
    },
    phase: 3,
    required: true,
  },

  // ============================================================================
  // CURRENT PRIORITIES
  // ============================================================================
  {
    id: 'priority_areas',
    type: 'multi-select',
    text: 'What areas feel most important to address right now?',
    subtext: 'Select all that apply, up to 5.',
    options: [
      { value: 'anxiety', label: 'Anxiety or worry', weight: 1 },
      { value: 'depression', label: 'Depression or low mood', weight: 1 },
      { value: 'trauma', label: 'Healing trauma', weight: 1 },
      { value: 'relationships', label: 'Relationship patterns', weight: 1 },
      { value: 'boundaries', label: 'Setting boundaries', weight: 1 },
      { value: 'self_worth', label: 'Self-worth and confidence', weight: 1 },
      { value: 'anger', label: 'Managing anger', weight: 1 },
      { value: 'grief', label: 'Processing grief or loss', weight: 1 },
      { value: 'purpose', label: 'Finding purpose and meaning', weight: 1 },
      { value: 'spiritual', label: 'Spiritual development', weight: 1 },
      { value: 'nervous_system', label: 'Nervous system regulation', weight: 1 },
      { value: 'addiction', label: 'Addiction patterns', weight: 1 },
      { value: 'shadow', label: 'Shadow work and integration', weight: 1 },
      { value: 'productivity', label: 'Performance and productivity', weight: 1 },
      { value: 'creativity', label: 'Creativity and expression', weight: 1 },
    ],
    maxSelections: 5,
    phase: 3,
    required: true,
  },
  {
    id: 'priority_one',
    type: 'open',
    text: 'If you could only address one thing in your life right now, what would it be?',
    placeholder: 'The one thing I most want to change...',
    maxLength: 500,
    phase: 3,
    required: true,
  },

  // ============================================================================
  // READINESS / APPROACH
  // ============================================================================
  {
    id: 'ready_discomfort',
    type: 'likert',
    text: 'How ready are you to face uncomfortable material?',
    subtext: 'Looking at difficult emotions, patterns, or truths about yourself.',
    scale: 7,
    anchors: {
      low: 'Not ready',
      mid: 'Somewhat ready',
      high: 'Very ready',
    },
    phase: 3,
    required: true,
  },
  {
    id: 'ready_pace',
    type: 'likert',
    text: 'What pace of change feels right for you?',
    scale: 7,
    anchors: {
      low: 'Very gentle / slow',
      mid: 'Moderate',
      high: 'Intensive / fast',
    },
    phase: 3,
    required: true,
  },
  {
    id: 'ready_support',
    type: 'frequency',
    text: 'How much outside support do you currently have?',
    subtext: 'Therapist, coach, mentor, supportive community, etc.',
    options: ['None', 'Minimal', 'Some support', 'Good support', 'Strong support'],
    phase: 3,
    pillar: 'relationships',
    required: true,
  },

  // ============================================================================
  // VISION / DIRECTION
  // ============================================================================
  {
    id: 'vision_self',
    type: 'open',
    text: 'Imagine yourself a year from now, having done significant inner work. What does that version of you look like?',
    subtext: 'There are no wrong answers - let yourself envision freely.',
    placeholder: 'In a year, I see myself...',
    maxLength: 2000,
    phase: 3,
    required: false,
    forContext: true,
  },
  {
    id: 'vision_obstacles',
    type: 'open',
    text: 'What do you think most stands in the way of that vision?',
    placeholder: 'What holds me back is...',
    maxLength: 1000,
    phase: 3,
    required: false,
    forContext: true,
  },

  // ============================================================================
  // CONTENT PREFERENCES
  // ============================================================================
  {
    id: 'pref_learning',
    type: 'multi-select',
    text: 'How do you learn best?',
    options: [
      { value: 'reading', label: 'Reading articles and essays' },
      { value: 'courses', label: 'Structured courses' },
      { value: 'practices', label: 'Guided practices' },
      { value: 'conversation', label: 'Dialogue and conversation' },
      { value: 'journaling', label: 'Writing and journaling' },
      { value: 'video', label: 'Video content' },
      { value: 'audio', label: 'Audio / podcasts' },
    ],
    maxSelections: 3,
    phase: 3,
    required: true,
  },
  {
    id: 'pref_time',
    type: 'frequency',
    text: 'How much time can you realistically dedicate to this work each week?',
    options: [
      'Just a few minutes when I can',
      '30 minutes to an hour',
      '1-3 hours',
      '3-5 hours',
      '5+ hours',
    ],
    phase: 3,
    required: true,
  },

  // ============================================================================
  // CLOSING
  // ============================================================================
  {
    id: 'final_anything',
    type: 'open',
    text: 'Is there anything else you want us to know as we begin this journey together?',
    placeholder: 'Anything else on your heart...',
    maxLength: 2000,
    phase: 3,
    required: false,
    forContext: true,
  },
];

export default PHASE_3_QUESTIONS;
