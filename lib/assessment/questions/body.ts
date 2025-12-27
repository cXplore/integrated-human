/**
 * BODY PILLAR ASSESSMENT QUESTIONS
 *
 * 7 Dimensions, 44 Questions
 *
 * Dimensions:
 * 1. Interoceptive Awareness (7 questions)
 * 2. Stress Physiology (7 questions)
 * 3. Sleep & Restoration (6 questions)
 * 4. Energy & Vitality (6 questions)
 * 5. Movement & Physical Capacity (6 questions)
 * 6. Nourishment Relationship (6 questions)
 * 7. Embodied Presence (6 questions)
 */

import type { Question } from '../types';

export const BODY_QUESTIONS: Question[] = [
  // ==========================================================================
  // DIMENSION 1: INTEROCEPTIVE AWARENESS (7 questions)
  // ==========================================================================

  // Facet: Signal Detection
  {
    id: 'body_ia_detect_1',
    text: 'I notice subtle sensations in my body (like my heartbeat, breathing, or muscle tension).',
    pillar: 'body',
    dimensionId: 'interoception',
    facetId: 'body-signal-detection',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'body_ia_detect_2',
    text: 'I am aware of physical sensations before they become overwhelming.',
    pillar: 'body',
    dimensionId: 'interoception',
    facetId: 'body-signal-detection',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Signal Interpretation
  {
    id: 'body_ia_interpret_1',
    text: 'I understand what my body sensations are trying to tell me.',
    pillar: 'body',
    dimensionId: 'interoception',
    facetId: 'body-signal-interpretation',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_ia_interpret_2',
    text: 'I can tell the difference between physical hunger and emotional hunger.',
    pillar: 'body',
    dimensionId: 'interoception',
    facetId: 'body-signal-interpretation',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_ia_interpret_3',
    text: 'I recognize when tension in my body is related to stress or emotions.',
    pillar: 'body',
    dimensionId: 'interoception',
    facetId: 'body-signal-interpretation',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Somatic Trust
  {
    id: 'body_ia_trust_1',
    text: 'I trust my body as a source of important information.',
    pillar: 'body',
    dimensionId: 'interoception',
    facetId: 'soma-trust',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_ia_trust_2',
    text: 'I ignore what my body is telling me.',
    pillar: 'body',
    dimensionId: 'interoception',
    facetId: 'soma-trust',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 2: STRESS PHYSIOLOGY (7 questions)
  // ==========================================================================

  // Facet: Stress Response
  {
    id: 'body_sp_response_1',
    text: 'My body responds proportionately to stressful situations (not over- or under-reacting).',
    pillar: 'body',
    dimensionId: 'stress-physiology',
    facetId: 'stress-response',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_sp_response_2',
    text: 'Minor stressors cause significant physical reactions in me.',
    pillar: 'body',
    dimensionId: 'stress-physiology',
    facetId: 'stress-response',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Recovery Capacity
  {
    id: 'body_sp_recovery_1',
    text: 'After a stressful event, my body returns to a relaxed state fairly quickly.',
    pillar: 'body',
    dimensionId: 'stress-physiology',
    facetId: 'recovery-capacity',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_sp_recovery_2',
    text: 'I continue to feel physically activated long after a stressful situation has passed.',
    pillar: 'body',
    dimensionId: 'stress-physiology',
    facetId: 'recovery-capacity',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Chronic Tension
  {
    id: 'body_sp_tension_1',
    text: 'I carry chronic tension in my body (neck, shoulders, jaw, etc.).',
    pillar: 'body',
    dimensionId: 'stress-physiology',
    facetId: 'chronic-tension',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'body_sp_tension_2',
    text: 'My body generally feels relaxed and at ease.',
    pillar: 'body',
    dimensionId: 'stress-physiology',
    facetId: 'chronic-tension',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_sp_tension_3',
    text: 'I experience unexplained physical pain or discomfort.',
    pillar: 'body',
    dimensionId: 'stress-physiology',
    facetId: 'chronic-tension',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 3: SLEEP & RESTORATION (6 questions)
  // ==========================================================================

  // Facet: Sleep Quality
  {
    id: 'body_sr_quality_1',
    text: 'I wake up feeling rested and refreshed.',
    pillar: 'body',
    dimensionId: 'sleep-restoration',
    facetId: 'sleep-quality',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'body_sr_quality_2',
    text: 'I have trouble falling asleep or staying asleep.',
    pillar: 'body',
    dimensionId: 'sleep-restoration',
    facetId: 'sleep-quality',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'body_sr_quality_3',
    text: 'My sleep is deep and uninterrupted.',
    pillar: 'body',
    dimensionId: 'sleep-restoration',
    facetId: 'sleep-quality',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Circadian Alignment
  {
    id: 'body_sr_circadian_1',
    text: 'I go to sleep and wake up at consistent times.',
    pillar: 'body',
    dimensionId: 'sleep-restoration',
    facetId: 'circadian-alignment',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'body_sr_circadian_2',
    text: 'My energy levels follow a natural rhythm throughout the day.',
    pillar: 'body',
    dimensionId: 'sleep-restoration',
    facetId: 'circadian-alignment',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_sr_circadian_3',
    text: 'I feel sleepy at appropriate times and alert when I need to be.',
    pillar: 'body',
    dimensionId: 'sleep-restoration',
    facetId: 'circadian-alignment',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 4: ENERGY & VITALITY (6 questions)
  // ==========================================================================

  // Facet: Baseline Energy
  {
    id: 'body_ev_baseline_1',
    text: 'I have enough energy to do what I want and need to do each day.',
    pillar: 'body',
    dimensionId: 'energy-vitality',
    facetId: 'baseline-energy',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_ev_baseline_2',
    text: 'I feel physically depleted or exhausted.',
    pillar: 'body',
    dimensionId: 'energy-vitality',
    facetId: 'baseline-energy',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'body_ev_baseline_3',
    text: 'I have abundant physical energy.',
    pillar: 'body',
    dimensionId: 'energy-vitality',
    facetId: 'baseline-energy',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Energy Stability
  {
    id: 'body_ev_stability_1',
    text: 'My energy levels are stable throughout the day.',
    pillar: 'body',
    dimensionId: 'energy-vitality',
    facetId: 'energy-stability',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_ev_stability_2',
    text: 'I experience significant energy crashes during the day.',
    pillar: 'body',
    dimensionId: 'energy-vitality',
    facetId: 'energy-stability',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'body_ev_stability_3',
    text: 'My energy is predictable and reliable.',
    pillar: 'body',
    dimensionId: 'energy-vitality',
    facetId: 'energy-stability',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 5: MOVEMENT & PHYSICAL CAPACITY (6 questions)
  // ==========================================================================

  // Facet: Movement Quality
  {
    id: 'body_mc_quality_1',
    text: 'My body moves freely without restriction or pain.',
    pillar: 'body',
    dimensionId: 'movement-capacity',
    facetId: 'movement-quality',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_mc_quality_2',
    text: 'I enjoy moving my body.',
    pillar: 'body',
    dimensionId: 'movement-capacity',
    facetId: 'movement-quality',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_mc_quality_3',
    text: 'Physical activity feels natural and accessible to me.',
    pillar: 'body',
    dimensionId: 'movement-capacity',
    facetId: 'movement-quality',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Physical Confidence
  {
    id: 'body_mc_confidence_1',
    text: 'I feel confident in my body\'s physical abilities.',
    pillar: 'body',
    dimensionId: 'movement-capacity',
    facetId: 'physical-confidence',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_mc_confidence_2',
    text: 'I trust my body to handle physical challenges.',
    pillar: 'body',
    dimensionId: 'movement-capacity',
    facetId: 'physical-confidence',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_mc_confidence_3',
    text: 'I avoid physical activities because I don\'t think my body can handle them.',
    pillar: 'body',
    dimensionId: 'movement-capacity',
    facetId: 'physical-confidence',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 6: NOURISHMENT RELATIONSHIP (6 questions)
  // ==========================================================================

  // Facet: Hunger-Satiety Attunement
  {
    id: 'body_nr_attune_1',
    text: 'I eat when I am physically hungry and stop when I am satisfied.',
    pillar: 'body',
    dimensionId: 'nourishment',
    facetId: 'hunger-satiety',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'body_nr_attune_2',
    text: 'I can tell when my body needs food versus when I want to eat for other reasons.',
    pillar: 'body',
    dimensionId: 'nourishment',
    facetId: 'hunger-satiety',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_nr_attune_3',
    text: 'I notice and respond to my body\'s signals of fullness.',
    pillar: 'body',
    dimensionId: 'nourishment',
    facetId: 'hunger-satiety',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Food Relationship Quality
  {
    id: 'body_nr_relation_1',
    text: 'My relationship with food feels peaceful and uncomplicated.',
    pillar: 'body',
    dimensionId: 'nourishment',
    facetId: 'food-relationship',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_nr_relation_2',
    text: 'I experience guilt, shame, or anxiety around eating.',
    pillar: 'body',
    dimensionId: 'nourishment',
    facetId: 'food-relationship',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'body_nr_relation_3',
    text: 'I nourish my body without rigid rules or restriction.',
    pillar: 'body',
    dimensionId: 'nourishment',
    facetId: 'food-relationship',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 7: EMBODIED PRESENCE (6 questions)
  // ==========================================================================

  // Facet: Body Inhabitation
  {
    id: 'body_ep_inhabit_1',
    text: 'I feel fully present in my body.',
    pillar: 'body',
    dimensionId: 'embodied-presence',
    facetId: 'body-inhabitation',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_ep_inhabit_2',
    text: 'I feel disconnected from my physical body.',
    pillar: 'body',
    dimensionId: 'embodied-presence',
    facetId: 'body-inhabitation',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'body_ep_inhabit_3',
    text: 'I live "from the neck up," primarily in my head.',
    pillar: 'body',
    dimensionId: 'embodied-presence',
    facetId: 'body-inhabitation',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Physical Expression
  {
    id: 'body_ep_express_1',
    text: 'I express myself through my body (posture, movement, gesture).',
    pillar: 'body',
    dimensionId: 'embodied-presence',
    facetId: 'body-expression',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'body_ep_express_2',
    text: 'My physical presence reflects who I truly am.',
    pillar: 'body',
    dimensionId: 'embodied-presence',
    facetId: 'body-expression',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'body_ep_express_3',
    text: 'I feel comfortable expressing myself physically.',
    pillar: 'body',
    dimensionId: 'embodied-presence',
    facetId: 'body-expression',
    type: 'agreement',
    scale: 7,
    required: true,
  },
];

export const BODY_QUESTION_COUNT = BODY_QUESTIONS.length;
