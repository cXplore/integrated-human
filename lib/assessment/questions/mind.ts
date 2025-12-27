/**
 * MIND PILLAR ASSESSMENT QUESTIONS
 *
 * 8 Dimensions, 55 Questions
 *
 * Dimensions:
 * 1. Emotional Regulation (8 questions)
 * 2. Cognitive Flexibility (8 questions)
 * 3. Self-Awareness (7 questions)
 * 4. Present-Moment Awareness (6 questions)
 * 5. Thought Patterns (7 questions)
 * 6. Psychological Safety (6 questions)
 * 7. Self-Relationship (7 questions)
 * 8. Meaning & Purpose (6 questions)
 */

import type { Question } from '../types';

export const MIND_QUESTIONS: Question[] = [
  // ==========================================================================
  // DIMENSION 1: EMOTIONAL REGULATION (8 questions)
  // ==========================================================================

  // Facet: Emotional Awareness
  {
    id: 'mind_er_awareness_1',
    text: 'I can usually identify what emotion I am feeling in the moment.',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'emotional-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_er_awareness_2',
    text: 'I can distinguish between similar emotions (like frustration vs. disappointment, or anxiety vs. excitement).',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'emotional-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_er_awareness_3',
    text: 'I notice when my emotional state is shifting before it fully takes hold.',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'emotional-awareness',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Distress Tolerance
  {
    id: 'mind_er_distress_1',
    text: 'When I experience intense negative emotions, I can sit with them without immediately reacting.',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'distress-tolerance',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_er_distress_2',
    text: 'I do things I later regret when I am upset.',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'distress-tolerance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_er_distress_3',
    text: 'I can tolerate uncertainty and discomfort without needing immediate relief.',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'distress-tolerance',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Emotional Modulation
  {
    id: 'mind_er_modulation_1',
    text: 'I can calm myself down when I feel overwhelmed.',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'emotional-modulation',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_er_modulation_2',
    text: 'I can shift my emotional state when the situation calls for it.',
    pillar: 'mind',
    dimensionId: 'emotional-regulation',
    facetId: 'emotional-modulation',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // ==========================================================================
  // DIMENSION 2: COGNITIVE FLEXIBILITY (8 questions)
  // ==========================================================================

  // Facet: Perspective Shifting
  {
    id: 'mind_cf_perspective_1',
    text: 'When I disagree with someone, I genuinely try to understand their point of view.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'perspective-shifting',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'mind_cf_perspective_2',
    text: 'I can see the same situation from multiple perspectives.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'perspective-shifting',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_cf_perspective_3',
    text: 'I find it difficult to understand why others see things differently than I do.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'perspective-shifting',
    type: 'agreement',
    scale: 7,
    reverseScored: true,
    required: true,
  },

  // Facet: Cognitive Defusion
  {
    id: 'mind_cf_defusion_1',
    text: 'I can observe my thoughts as mental events rather than facts.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'cognitive-defusion',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_cf_defusion_2',
    text: 'I get caught up in my thoughts and believe everything they tell me.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'cognitive-defusion',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Adaptability
  {
    id: 'mind_cf_adapt_1',
    text: 'When my plans don\'t work out, I can adjust and find alternative approaches.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'adaptability',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_cf_adapt_2',
    text: 'I struggle to change my approach even when it clearly isn\'t working.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'adaptability',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_cf_adapt_3',
    text: 'I am open to changing my mind when presented with new information.',
    pillar: 'mind',
    dimensionId: 'cognitive-flexibility',
    facetId: 'adaptability',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 3: SELF-AWARENESS (7 questions)
  // ==========================================================================

  // Facet: Internal Awareness
  {
    id: 'mind_sa_internal_1',
    text: 'I understand why I react the way I do in most situations.',
    pillar: 'mind',
    dimensionId: 'self-awareness',
    facetId: 'internal-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_sa_internal_2',
    text: 'I am aware of my core values and what truly matters to me.',
    pillar: 'mind',
    dimensionId: 'self-awareness',
    facetId: 'internal-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_sa_internal_3',
    text: 'I understand my own motivations and what drives my behavior.',
    pillar: 'mind',
    dimensionId: 'self-awareness',
    facetId: 'internal-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: External Awareness
  {
    id: 'mind_sa_external_1',
    text: 'I have a clear sense of how I come across to other people.',
    pillar: 'mind',
    dimensionId: 'self-awareness',
    facetId: 'external-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_sa_external_2',
    text: 'I am often surprised by feedback about how others perceive me.',
    pillar: 'mind',
    dimensionId: 'self-awareness',
    facetId: 'external-awareness',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Pattern Recognition
  {
    id: 'mind_sa_patterns_1',
    text: 'I notice when I am repeating old patterns in my life.',
    pillar: 'mind',
    dimensionId: 'self-awareness',
    facetId: 'pattern-recognition',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'mind_sa_patterns_2',
    text: 'I can see connections between my current behavior and my past experiences.',
    pillar: 'mind',
    dimensionId: 'self-awareness',
    facetId: 'pattern-recognition',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 4: PRESENT-MOMENT AWARENESS (6 questions)
  // ==========================================================================

  // Facet: Attention Stability
  {
    id: 'mind_pm_attention_1',
    text: 'I can maintain focus on what I am doing without my mind wandering.',
    pillar: 'mind',
    dimensionId: 'present-moment',
    facetId: 'attention-stability',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'mind_pm_attention_2',
    text: 'I find it hard to concentrate on one thing at a time.',
    pillar: 'mind',
    dimensionId: 'present-moment',
    facetId: 'attention-stability',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_pm_attention_3',
    text: 'I can direct my attention where I choose and keep it there.',
    pillar: 'mind',
    dimensionId: 'present-moment',
    facetId: 'attention-stability',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Present Engagement
  {
    id: 'mind_pm_engage_1',
    text: 'I am fully present during conversations rather than thinking about other things.',
    pillar: 'mind',
    dimensionId: 'present-moment',
    facetId: 'present-engagement',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'mind_pm_engage_2',
    text: 'I spend a lot of time replaying the past or worrying about the future.',
    pillar: 'mind',
    dimensionId: 'present-moment',
    facetId: 'present-engagement',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_pm_engage_3',
    text: 'I can fully immerse myself in what I am doing.',
    pillar: 'mind',
    dimensionId: 'present-moment',
    facetId: 'present-engagement',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 5: THOUGHT PATTERNS (7 questions)
  // ==========================================================================

  // Facet: Rumination
  {
    id: 'mind_tp_rumination_1',
    text: 'I get stuck thinking about the same problems or worries over and over.',
    pillar: 'mind',
    dimensionId: 'thought-patterns',
    facetId: 'rumination',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_tp_rumination_2',
    text: 'I can let go of unhelpful thoughts once I recognize them.',
    pillar: 'mind',
    dimensionId: 'thought-patterns',
    facetId: 'rumination',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Catastrophizing
  {
    id: 'mind_tp_catastrophe_1',
    text: 'When something goes wrong, I assume the worst possible outcome.',
    pillar: 'mind',
    dimensionId: 'thought-patterns',
    facetId: 'catastrophizing',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_tp_catastrophe_2',
    text: 'I can maintain perspective about problems without blowing them out of proportion.',
    pillar: 'mind',
    dimensionId: 'thought-patterns',
    facetId: 'catastrophizing',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Self-Talk Quality
  {
    id: 'mind_tp_selftalk_1',
    text: 'The way I talk to myself is kind and supportive.',
    pillar: 'mind',
    dimensionId: 'thought-patterns',
    facetId: 'self-talk',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_tp_selftalk_2',
    text: 'I am harsh and critical with myself when I make mistakes.',
    pillar: 'mind',
    dimensionId: 'thought-patterns',
    facetId: 'self-talk',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_tp_selftalk_3',
    text: 'I would speak to myself the way I speak to a good friend.',
    pillar: 'mind',
    dimensionId: 'thought-patterns',
    facetId: 'self-talk',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 6: PSYCHOLOGICAL SAFETY (6 questions)
  // ==========================================================================

  // Facet: Nervous System State
  {
    id: 'mind_ps_nervous_1',
    text: 'My baseline state feels calm and grounded.',
    pillar: 'mind',
    dimensionId: 'psychological-safety',
    facetId: 'nervous-system-state',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_ps_nervous_2',
    text: 'I feel on edge or anxious even when there is no apparent threat.',
    pillar: 'mind',
    dimensionId: 'psychological-safety',
    facetId: 'nervous-system-state',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_ps_nervous_3',
    text: 'I can return to a calm state after experiencing stress.',
    pillar: 'mind',
    dimensionId: 'psychological-safety',
    facetId: 'nervous-system-state',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Safety Signals
  {
    id: 'mind_ps_safety_1',
    text: 'I can feel safe when I am in genuinely safe situations.',
    pillar: 'mind',
    dimensionId: 'psychological-safety',
    facetId: 'safety-signals',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_ps_safety_2',
    text: 'I have difficulty relaxing and letting my guard down.',
    pillar: 'mind',
    dimensionId: 'psychological-safety',
    facetId: 'safety-signals',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_ps_safety_3',
    text: 'My sense of safety matches the reality of my situation.',
    pillar: 'mind',
    dimensionId: 'psychological-safety',
    facetId: 'safety-signals',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 7: SELF-RELATIONSHIP (7 questions)
  // ==========================================================================

  // Facet: Self-Compassion
  {
    id: 'mind_sr_compassion_1',
    text: 'I treat myself with kindness when I am going through a difficult time.',
    pillar: 'mind',
    dimensionId: 'self-relationship',
    facetId: 'self-compassion',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'mind_sr_compassion_2',
    text: 'When I fail at something, I am understanding with myself rather than self-critical.',
    pillar: 'mind',
    dimensionId: 'self-relationship',
    facetId: 'self-compassion',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Self-Acceptance
  {
    id: 'mind_sr_acceptance_1',
    text: 'I accept all parts of myself, including my flaws and weaknesses.',
    pillar: 'mind',
    dimensionId: 'self-relationship',
    facetId: 'self-acceptance',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_sr_acceptance_2',
    text: 'There are parts of myself I try to hide or deny.',
    pillar: 'mind',
    dimensionId: 'self-relationship',
    facetId: 'self-acceptance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'mind_sr_acceptance_3',
    text: 'I feel at peace with who I am.',
    pillar: 'mind',
    dimensionId: 'self-relationship',
    facetId: 'self-acceptance',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Self-Trust
  {
    id: 'mind_sr_trust_1',
    text: 'I trust my own judgment when making important decisions.',
    pillar: 'mind',
    dimensionId: 'self-relationship',
    facetId: 'self-trust',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_sr_trust_2',
    text: 'I second-guess myself and seek external validation for my choices.',
    pillar: 'mind',
    dimensionId: 'self-relationship',
    facetId: 'self-trust',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 8: MEANING & PURPOSE (6 questions)
  // ==========================================================================

  // Facet: Values Clarity
  {
    id: 'mind_mp_values_1',
    text: 'I have a clear sense of what I value most in life.',
    pillar: 'mind',
    dimensionId: 'meaning-purpose',
    facetId: 'values-clarity',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_mp_values_2',
    text: 'My daily actions are aligned with my core values.',
    pillar: 'mind',
    dimensionId: 'meaning-purpose',
    facetId: 'values-clarity',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'mind_mp_values_3',
    text: 'I know what truly matters to me beyond external expectations.',
    pillar: 'mind',
    dimensionId: 'meaning-purpose',
    facetId: 'values-clarity',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Purpose & Direction
  {
    id: 'mind_mp_purpose_1',
    text: 'I have a sense of purpose that guides my life.',
    pillar: 'mind',
    dimensionId: 'meaning-purpose',
    facetId: 'purpose-direction',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_mp_purpose_2',
    text: 'I feel like I am moving toward something meaningful.',
    pillar: 'mind',
    dimensionId: 'meaning-purpose',
    facetId: 'purpose-direction',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'mind_mp_purpose_3',
    text: 'I often feel aimless or uncertain about my direction in life.',
    pillar: 'mind',
    dimensionId: 'meaning-purpose',
    facetId: 'purpose-direction',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
];

export const MIND_QUESTION_COUNT = MIND_QUESTIONS.length;
