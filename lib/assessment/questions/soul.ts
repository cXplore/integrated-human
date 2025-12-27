/**
 * SOUL PILLAR ASSESSMENT QUESTIONS
 *
 * 8 Dimensions, 49 Questions
 *
 * Dimensions:
 * 1. Authenticity (7 questions)
 * 2. Existential Grounding (7 questions)
 * 3. Transcendent Connection (6 questions)
 * 4. Shadow Integration (6 questions)
 * 5. Creative Expression (6 questions)
 * 6. Life Engagement (6 questions)
 * 7. Inner Wisdom Access (6 questions)
 * 8. Spiritual Practice (5 questions)
 */

import type { Question } from '../types';

export const SOUL_QUESTIONS: Question[] = [
  // ==========================================================================
  // DIMENSION 1: AUTHENTICITY (7 questions)
  // ==========================================================================

  // Facet: Authentic Self-Knowledge
  {
    id: 'soul_auth_know_1',
    text: 'I know who I am beyond the roles I play (parent, employee, friend, etc.).',
    pillar: 'soul',
    dimensionId: 'authenticity',
    facetId: 'self-knowledge',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_auth_know_2',
    text: 'I have a clear sense of my essential nature underneath all my conditioning.',
    pillar: 'soul',
    dimensionId: 'authenticity',
    facetId: 'self-knowledge',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Authentic Expression
  {
    id: 'soul_auth_expr_1',
    text: 'I express my true thoughts and feelings in my relationships.',
    pillar: 'soul',
    dimensionId: 'authenticity',
    facetId: 'authentic-expression',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_auth_expr_2',
    text: 'I hide who I really am to avoid rejection or judgment.',
    pillar: 'soul',
    dimensionId: 'authenticity',
    facetId: 'authentic-expression',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_auth_expr_3',
    text: 'People in my life know the real me.',
    pillar: 'soul',
    dimensionId: 'authenticity',
    facetId: 'authentic-expression',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Integrity Alignment
  {
    id: 'soul_auth_integ_1',
    text: 'My actions are aligned with my deepest values.',
    pillar: 'soul',
    dimensionId: 'authenticity',
    facetId: 'integrity-alignment',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_auth_integ_2',
    text: 'I compromise my values to fit in or please others.',
    pillar: 'soul',
    dimensionId: 'authenticity',
    facetId: 'integrity-alignment',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 2: EXISTENTIAL GROUNDING (7 questions)
  // ==========================================================================

  // Facet: Mortality Relationship
  {
    id: 'soul_exist_mort_1',
    text: 'I have made peace with the reality that life is temporary.',
    pillar: 'soul',
    dimensionId: 'existential-grounding',
    facetId: 'mortality-relationship',
    type: 'agreement',
    scale: 7,
    required: true,
    sensitive: true,
  },
  {
    id: 'soul_exist_mort_2',
    text: 'Awareness of death motivates me to live more fully.',
    pillar: 'soul',
    dimensionId: 'existential-grounding',
    facetId: 'mortality-relationship',
    type: 'agreement',
    scale: 7,
    required: true,
    sensitive: true,
  },

  // Facet: Uncertainty Tolerance
  {
    id: 'soul_exist_uncert_1',
    text: 'I am at peace with life\'s fundamental uncertainties.',
    pillar: 'soul',
    dimensionId: 'existential-grounding',
    facetId: 'uncertainty-tolerance',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_exist_uncert_2',
    text: 'I need to have everything figured out to feel secure.',
    pillar: 'soul',
    dimensionId: 'existential-grounding',
    facetId: 'uncertainty-tolerance',
    type: 'agreement',
    scale: 7,
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_exist_uncert_3',
    text: 'I can hold questions without needing immediate answers.',
    pillar: 'soul',
    dimensionId: 'existential-grounding',
    facetId: 'uncertainty-tolerance',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Meaning-Making
  {
    id: 'soul_exist_meaning_1',
    text: 'I can find or create meaning even in difficult circumstances.',
    pillar: 'soul',
    dimensionId: 'existential-grounding',
    facetId: 'meaning-making',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_exist_meaning_2',
    text: 'Suffering has helped me grow and deepen as a person.',
    pillar: 'soul',
    dimensionId: 'existential-grounding',
    facetId: 'meaning-making',
    type: 'agreement',
    scale: 7,
    required: true,
    sensitive: true,
  },

  // ==========================================================================
  // DIMENSION 3: TRANSCENDENT CONNECTION (6 questions)
  // ==========================================================================

  // Facet: Awe & Wonder
  {
    id: 'soul_trans_awe_1',
    text: 'I experience moments of awe, wonder, or deep appreciation.',
    pillar: 'soul',
    dimensionId: 'transcendence',
    facetId: 'awe-wonder',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_trans_awe_2',
    text: 'I am moved by beauty in nature, art, music, or other experiences.',
    pillar: 'soul',
    dimensionId: 'transcendence',
    facetId: 'awe-wonder',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_trans_awe_3',
    text: 'I have had experiences that felt larger than my ordinary self.',
    pillar: 'soul',
    dimensionId: 'transcendence',
    facetId: 'awe-wonder',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Connection to Larger Whole
  {
    id: 'soul_trans_connect_1',
    text: 'I feel connected to something larger than myself.',
    pillar: 'soul',
    dimensionId: 'transcendence',
    facetId: 'larger-connection',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_trans_connect_2',
    text: 'I feel isolated and separate from life around me.',
    pillar: 'soul',
    dimensionId: 'transcendence',
    facetId: 'larger-connection',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_trans_connect_3',
    text: 'I sense an underlying interconnection between all things.',
    pillar: 'soul',
    dimensionId: 'transcendence',
    facetId: 'larger-connection',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 4: SHADOW INTEGRATION (6 questions)
  // ==========================================================================

  // Facet: Shadow Awareness
  {
    id: 'soul_shadow_aware_1',
    text: 'I am aware of parts of myself I tend to hide or deny.',
    pillar: 'soul',
    dimensionId: 'shadow-integration',
    facetId: 'shadow-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_shadow_aware_2',
    text: 'I notice when I am projecting my own issues onto others.',
    pillar: 'soul',
    dimensionId: 'shadow-integration',
    facetId: 'shadow-awareness',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_shadow_aware_3',
    text: 'I can recognize my "dark side" or less admirable qualities.',
    pillar: 'soul',
    dimensionId: 'shadow-integration',
    facetId: 'shadow-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Shadow Acceptance
  {
    id: 'soul_shadow_accept_1',
    text: 'I have made peace with the less "acceptable" parts of myself.',
    pillar: 'soul',
    dimensionId: 'shadow-integration',
    facetId: 'shadow-acceptance',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_shadow_accept_2',
    text: 'I fight against or try to eliminate parts of myself I don\'t like.',
    pillar: 'soul',
    dimensionId: 'shadow-integration',
    facetId: 'shadow-acceptance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_shadow_accept_3',
    text: 'I can access power and wisdom from integrating my shadow.',
    pillar: 'soul',
    dimensionId: 'shadow-integration',
    facetId: 'shadow-acceptance',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 5: CREATIVE EXPRESSION (6 questions)
  // ==========================================================================

  // Facet: Creative Access
  {
    id: 'soul_create_access_1',
    text: 'I feel connected to my creative impulses and ideas.',
    pillar: 'soul',
    dimensionId: 'creative-expression',
    facetId: 'creative-access',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_create_access_2',
    text: 'Creative expression flows easily for me.',
    pillar: 'soul',
    dimensionId: 'creative-expression',
    facetId: 'creative-access',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_create_access_3',
    text: 'I consider myself "not creative."',
    pillar: 'soul',
    dimensionId: 'creative-expression',
    facetId: 'creative-access',
    type: 'agreement',
    scale: 7,
    reverseScored: true,
    required: true,
  },

  // Facet: Creative Courage
  {
    id: 'soul_create_courage_1',
    text: 'I share my creative work or ideas with others.',
    pillar: 'soul',
    dimensionId: 'creative-expression',
    facetId: 'creative-courage',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_create_courage_2',
    text: 'Fear of judgment holds me back from expressing myself creatively.',
    pillar: 'soul',
    dimensionId: 'creative-expression',
    facetId: 'creative-courage',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_create_courage_3',
    text: 'I am willing to create imperfectly rather than not create at all.',
    pillar: 'soul',
    dimensionId: 'creative-expression',
    facetId: 'creative-courage',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 6: LIFE ENGAGEMENT (6 questions)
  // ==========================================================================

  // Facet: Sense of Aliveness
  {
    id: 'soul_engage_alive_1',
    text: 'I feel truly alive and vital.',
    pillar: 'soul',
    dimensionId: 'life-engagement',
    facetId: 'aliveness',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_engage_alive_2',
    text: 'I feel like I am just going through the motions.',
    pillar: 'soul',
    dimensionId: 'life-engagement',
    facetId: 'aliveness',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_engage_alive_3',
    text: 'There is a spark of vitality in my daily life.',
    pillar: 'soul',
    dimensionId: 'life-engagement',
    facetId: 'aliveness',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Engagement Depth
  {
    id: 'soul_engage_depth_1',
    text: 'I engage deeply with the experiences in my life.',
    pillar: 'soul',
    dimensionId: 'life-engagement',
    facetId: 'engagement-depth',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_engage_depth_2',
    text: 'I skim the surface of life rather than diving deep.',
    pillar: 'soul',
    dimensionId: 'life-engagement',
    facetId: 'engagement-depth',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_engage_depth_3',
    text: 'I am fully present and engaged in what matters to me.',
    pillar: 'soul',
    dimensionId: 'life-engagement',
    facetId: 'engagement-depth',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 7: INNER WISDOM ACCESS (6 questions)
  // ==========================================================================

  // Facet: Intuition Access
  {
    id: 'soul_wisdom_intuit_1',
    text: 'I have access to an inner knowing that guides me.',
    pillar: 'soul',
    dimensionId: 'inner-wisdom',
    facetId: 'intuition-access',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_wisdom_intuit_2',
    text: 'I can sense what is right for me beyond logic and reasoning.',
    pillar: 'soul',
    dimensionId: 'inner-wisdom',
    facetId: 'intuition-access',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_wisdom_intuit_3',
    text: 'I feel disconnected from my intuition.',
    pillar: 'soul',
    dimensionId: 'inner-wisdom',
    facetId: 'intuition-access',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Inner Guidance Trust
  {
    id: 'soul_wisdom_trust_1',
    text: 'I trust and follow my inner guidance when making decisions.',
    pillar: 'soul',
    dimensionId: 'inner-wisdom',
    facetId: 'inner-guidance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'soul_wisdom_trust_2',
    text: 'I rely primarily on external sources for guidance in my life.',
    pillar: 'soul',
    dimensionId: 'inner-wisdom',
    facetId: 'inner-guidance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_wisdom_trust_3',
    text: 'My inner wisdom has proven reliable over time.',
    pillar: 'soul',
    dimensionId: 'inner-wisdom',
    facetId: 'inner-guidance',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 8: SPIRITUAL PRACTICE (5 questions)
  // ==========================================================================

  // Facet: Practice Consistency
  {
    id: 'soul_practice_consist_1',
    text: 'I have a regular spiritual, contemplative, or reflective practice.',
    pillar: 'soul',
    dimensionId: 'spiritual-practice',
    facetId: 'practice-consistency',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_practice_consist_2',
    text: 'I make time for practices that connect me to something deeper.',
    pillar: 'soul',
    dimensionId: 'spiritual-practice',
    facetId: 'practice-consistency',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Practice Depth
  {
    id: 'soul_practice_depth_1',
    text: 'My spiritual or contemplative practices feel meaningful and transformative.',
    pillar: 'soul',
    dimensionId: 'spiritual-practice',
    facetId: 'practice-depth',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'soul_practice_depth_2',
    text: 'My practices are just going through the motions rather than truly engaging.',
    pillar: 'soul',
    dimensionId: 'spiritual-practice',
    facetId: 'practice-depth',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'soul_practice_depth_3',
    text: 'I continue to deepen in my spiritual or contemplative journey.',
    pillar: 'soul',
    dimensionId: 'spiritual-practice',
    facetId: 'practice-depth',
    type: 'agreement',
    scale: 7,
    required: true,
  },
];

export const SOUL_QUESTION_COUNT = SOUL_QUESTIONS.length;
