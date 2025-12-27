/**
 * INTEGRATED HUMAN ASSESSMENT FRAMEWORK
 *
 * A research-grounded assessment system measuring development across
 * 4 pillars, 30 dimensions, and 75+ facets.
 *
 * Structure:
 * - Pillar: Major life domain (Mind, Body, Soul, Relationships)
 * - Dimension: Independently measurable psychological construct
 * - Facet: Sub-aspect of a dimension for nuanced feedback
 *
 * Each dimension maps to the 5-stage Development Spectrum:
 * - Collapse (0-20): Crisis state, survival mode
 * - Regulation (21-40): Building basic stability
 * - Integration (41-60): Connecting and synthesizing
 * - Embodiment (61-80): Natural expression, flow states
 * - Optimization (81-100): Refinement and mastery
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export interface Facet {
  id: string;
  name: string;
  description: string;
  lowEnd: string;    // What low scores indicate
  highEnd: string;   // What high scores indicate
}

export interface Dimension {
  id: string;
  name: string;
  description: string;
  researchBasis: string[];  // Research frameworks this draws from
  facets: Facet[];
  questionCount: number;    // Target questions for this dimension
}

export interface Pillar {
  id: 'mind' | 'body' | 'soul' | 'relationships';
  name: string;
  description: string;
  dimensions: Dimension[];
  estimatedMinutes: number;
}

export type DevelopmentStage =
  | 'collapse'
  | 'regulation'
  | 'integration'
  | 'embodiment'
  | 'optimization';

export interface StageInfo {
  id: DevelopmentStage;
  name: string;
  range: [number, number];
  description: string;
  characteristics: string[];
}

// =============================================================================
// DEVELOPMENT SPECTRUM
// =============================================================================

export const DEVELOPMENT_STAGES: StageInfo[] = [
  {
    id: 'collapse',
    name: 'Collapse',
    range: [0, 20],
    description: 'Crisis state requiring immediate stabilization',
    characteristics: [
      'Overwhelmed by daily demands',
      'Reactive rather than responsive',
      'Survival mode activated',
      'Disconnected from self and others',
      'Basic needs often unmet'
    ]
  },
  {
    id: 'regulation',
    name: 'Regulation',
    range: [21, 40],
    description: 'Building foundational stability and safety',
    characteristics: [
      'Learning to manage overwhelm',
      'Developing basic coping strategies',
      'Beginning to establish routines',
      'Awareness of patterns emerging',
      'Periods of stability between struggles'
    ]
  },
  {
    id: 'integration',
    name: 'Integration',
    range: [41, 60],
    description: 'Connecting disparate parts into coherent whole',
    characteristics: [
      'Understanding how pieces fit together',
      'Consistent practices taking root',
      'Growing self-awareness',
      'Handling challenges with more grace',
      'Identity becoming clearer'
    ]
  },
  {
    id: 'embodiment',
    name: 'Embodiment',
    range: [61, 80],
    description: 'Natural expression without conscious effort',
    characteristics: [
      'Skills feel automatic',
      'Living from values naturally',
      'Resilient under pressure',
      'Teaching and guiding others',
      'Flow states common'
    ]
  },
  {
    id: 'optimization',
    name: 'Optimization',
    range: [81, 100],
    description: 'Refinement, mastery, and subtle development',
    characteristics: [
      'Fine-tuning established capacities',
      'Exploring edge cases and nuances',
      'Contribution to collective wisdom',
      'Effortless excellence',
      'Continuous subtle growth'
    ]
  }
];

// =============================================================================
// MIND PILLAR
// =============================================================================

export const MIND_PILLAR: Pillar = {
  id: 'mind',
  name: 'Mind',
  description: 'Cognitive patterns, emotional processing, and psychological flexibility',
  estimatedMinutes: 18,
  dimensions: [
    {
      id: 'emotional-regulation',
      name: 'Emotional Regulation',
      description: 'Ability to understand, manage, and work with emotional states',
      researchBasis: [
        'Gross Emotion Regulation Model',
        'Dialectical Behavior Therapy (DBT)',
        'Polyvagal Theory'
      ],
      questionCount: 8,
      facets: [
        {
          id: 'emotional-awareness',
          name: 'Emotional Awareness',
          description: 'Ability to identify and label emotional states',
          lowEnd: 'Difficulty recognizing or naming emotions',
          highEnd: 'Nuanced awareness of emotional subtleties'
        },
        {
          id: 'distress-tolerance',
          name: 'Distress Tolerance',
          description: 'Capacity to withstand difficult emotions without destructive action',
          lowEnd: 'Overwhelmed by negative emotions, impulsive reactions',
          highEnd: 'Can sit with discomfort, choose responses wisely'
        },
        {
          id: 'emotional-modulation',
          name: 'Emotional Modulation',
          description: 'Ability to shift emotional intensity up or down as needed',
          lowEnd: 'Emotions feel fixed or out of control',
          highEnd: 'Skilled at adjusting emotional state to context'
        }
      ]
    },
    {
      id: 'cognitive-flexibility',
      name: 'Cognitive Flexibility',
      description: 'Mental agility, perspective-taking, and adaptive thinking',
      researchBasis: [
        'Acceptance and Commitment Therapy (ACT)',
        'Cognitive Behavioral Therapy (CBT)',
        'Growth Mindset Research (Dweck)'
      ],
      questionCount: 8,
      facets: [
        {
          id: 'perspective-shifting',
          name: 'Perspective Shifting',
          description: 'Ability to see situations from multiple viewpoints',
          lowEnd: 'Stuck in single viewpoint, rigid thinking',
          highEnd: 'Naturally considers multiple perspectives'
        },
        {
          id: 'cognitive-defusion',
          name: 'Cognitive Defusion',
          description: 'Ability to observe thoughts without being controlled by them',
          lowEnd: 'Fused with thoughts, believes all thinking',
          highEnd: 'Can step back and watch thoughts pass'
        },
        {
          id: 'adaptability',
          name: 'Adaptability',
          description: 'Adjusting strategies when circumstances change',
          lowEnd: 'Rigid adherence to plans despite evidence',
          highEnd: 'Fluidly adjusts approach based on feedback'
        }
      ]
    },
    {
      id: 'self-awareness',
      name: 'Self-Awareness',
      description: 'Understanding of own patterns, motivations, and inner workings',
      researchBasis: [
        'Metacognition Research',
        'Self-Determination Theory',
        'Insight Research (Eurich)'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'internal-awareness',
          name: 'Internal Awareness',
          description: 'Understanding of own thoughts, feelings, and motivations',
          lowEnd: 'Limited insight into inner experience',
          highEnd: 'Deep understanding of internal landscape'
        },
        {
          id: 'external-awareness',
          name: 'External Awareness',
          description: 'Understanding how others perceive you',
          lowEnd: 'Blind spots about impact on others',
          highEnd: 'Accurate sense of how you come across'
        },
        {
          id: 'pattern-recognition',
          name: 'Pattern Recognition',
          description: 'Noticing recurring themes in behavior and choices',
          lowEnd: 'Same patterns repeat without recognition',
          highEnd: 'Quickly spots patterns and their origins'
        }
      ]
    },
    {
      id: 'present-moment',
      name: 'Present-Moment Awareness',
      description: 'Capacity for mindful attention and engagement with now',
      researchBasis: [
        'Mindfulness-Based Stress Reduction (MBSR)',
        'Contemplative Neuroscience',
        'Flow Research (Csikszentmihalyi)'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'attention-stability',
          name: 'Attention Stability',
          description: 'Ability to maintain focus on chosen object',
          lowEnd: 'Scattered attention, easily distracted',
          highEnd: 'Can sustain attention at will'
        },
        {
          id: 'present-engagement',
          name: 'Present Engagement',
          description: 'Being fully here rather than lost in past/future',
          lowEnd: 'Often lost in rumination or worry',
          highEnd: 'Naturally present and engaged'
        }
      ]
    },
    {
      id: 'thought-patterns',
      name: 'Thought Patterns',
      description: 'Quality and tendencies of habitual thinking',
      researchBasis: [
        'Cognitive Behavioral Therapy (CBT)',
        'Rumination Research (Nolen-Hoeksema)',
        'Learned Optimism (Seligman)'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'rumination',
          name: 'Rumination Tendency',
          description: 'Getting stuck in repetitive negative thinking',
          lowEnd: 'Frequent rumination loops',
          highEnd: 'Rarely gets stuck in repetitive thinking'
        },
        {
          id: 'catastrophizing',
          name: 'Catastrophizing',
          description: 'Tendency to expect worst-case outcomes',
          lowEnd: 'Often expects disaster',
          highEnd: 'Realistic assessment of outcomes'
        },
        {
          id: 'self-talk',
          name: 'Self-Talk Quality',
          description: 'Tone of internal dialogue',
          lowEnd: 'Harsh, critical inner voice',
          highEnd: 'Supportive, balanced self-talk'
        }
      ]
    },
    {
      id: 'psychological-safety',
      name: 'Psychological Safety',
      description: 'Internal sense of security and groundedness',
      researchBasis: [
        'Polyvagal Theory (Porges)',
        'Attachment Theory',
        'Window of Tolerance (Siegel)'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'nervous-system-state',
          name: 'Nervous System State',
          description: 'Baseline activation of stress response',
          lowEnd: 'Chronically activated fight/flight/freeze',
          highEnd: 'Regulated, ventral vagal baseline'
        },
        {
          id: 'safety-signals',
          name: 'Safety Signal Reception',
          description: 'Ability to receive and respond to cues of safety',
          lowEnd: 'Difficulty feeling safe even in safe situations',
          highEnd: 'Accurately reads and responds to safety cues'
        }
      ]
    },
    {
      id: 'self-relationship',
      name: 'Self-Relationship',
      description: 'Quality of relationship with oneself',
      researchBasis: [
        'Self-Compassion Research (Neff)',
        'Internal Family Systems (IFS)',
        'Self-Acceptance Research'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'self-compassion',
          name: 'Self-Compassion',
          description: 'Treating oneself with kindness in difficulty',
          lowEnd: 'Self-critical, unforgiving toward self',
          highEnd: 'Naturally compassionate toward own struggles'
        },
        {
          id: 'self-acceptance',
          name: 'Self-Acceptance',
          description: 'Embracing all parts of self, including flaws',
          lowEnd: 'Rejecting parts of self, inner conflict',
          highEnd: 'Integrated acceptance of whole self'
        },
        {
          id: 'self-trust',
          name: 'Self-Trust',
          description: 'Confidence in own judgment and capabilities',
          lowEnd: 'Second-guessing, seeking external validation',
          highEnd: 'Trusts own inner knowing'
        }
      ]
    },
    {
      id: 'meaning-purpose',
      name: 'Meaning & Purpose',
      description: 'Sense of direction and significance in life',
      researchBasis: [
        'Logotherapy (Frankl)',
        'Self-Determination Theory',
        'Values Research (ACT)'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'values-clarity',
          name: 'Values Clarity',
          description: 'Knowing what truly matters',
          lowEnd: 'Unclear about personal values',
          highEnd: 'Crystal clear on core values'
        },
        {
          id: 'purpose-direction',
          name: 'Purpose & Direction',
          description: 'Sense of meaningful direction in life',
          lowEnd: 'Feeling aimless or lost',
          highEnd: 'Clear sense of purpose and direction'
        }
      ]
    }
  ]
};

// =============================================================================
// BODY PILLAR
// =============================================================================

export const BODY_PILLAR: Pillar = {
  id: 'body',
  name: 'Body',
  description: 'Physical health, somatic awareness, and embodied living',
  estimatedMinutes: 15,
  dimensions: [
    {
      id: 'interoception',
      name: 'Interoceptive Awareness',
      description: 'Ability to sense and interpret internal body signals',
      researchBasis: [
        'Interoception Research (Craig)',
        'Somatic Psychology',
        'Embodied Cognition'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'body-signal-detection',
          name: 'Signal Detection',
          description: 'Noticing internal body sensations',
          lowEnd: 'Disconnected from body signals',
          highEnd: 'Highly attuned to subtle body cues'
        },
        {
          id: 'body-signal-interpretation',
          name: 'Signal Interpretation',
          description: 'Understanding what body sensations mean',
          lowEnd: 'Confused by body signals',
          highEnd: 'Accurate interpretation of body wisdom'
        },
        {
          id: 'soma-trust',
          name: 'Somatic Trust',
          description: 'Trusting the body as source of information',
          lowEnd: 'Ignores or distrusts body signals',
          highEnd: 'Uses body as trusted guidance system'
        }
      ]
    },
    {
      id: 'stress-physiology',
      name: 'Stress Physiology',
      description: 'How the body responds to and recovers from stress',
      researchBasis: [
        'Allostatic Load Research',
        'HPA Axis Research',
        'Recovery Science'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'stress-response',
          name: 'Stress Response',
          description: 'How body activates under pressure',
          lowEnd: 'Excessive or prolonged stress activation',
          highEnd: 'Proportionate, adaptive stress response'
        },
        {
          id: 'recovery-capacity',
          name: 'Recovery Capacity',
          description: 'How quickly body returns to baseline after stress',
          lowEnd: 'Slow recovery, lingering activation',
          highEnd: 'Rapid return to baseline'
        },
        {
          id: 'chronic-tension',
          name: 'Chronic Tension Patterns',
          description: 'Habitual holding in the body',
          lowEnd: 'Significant chronic tension, pain',
          highEnd: 'Body generally relaxed and fluid'
        }
      ]
    },
    {
      id: 'sleep-restoration',
      name: 'Sleep & Restoration',
      description: 'Quality of sleep and restorative processes',
      researchBasis: [
        'Sleep Science (Walker)',
        'Circadian Research',
        'Recovery Optimization'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'sleep-quality',
          name: 'Sleep Quality',
          description: 'Depth and restfulness of sleep',
          lowEnd: 'Poor, fragmented, unrefreshing sleep',
          highEnd: 'Deep, restorative, consistent sleep'
        },
        {
          id: 'circadian-alignment',
          name: 'Circadian Alignment',
          description: 'Alignment with natural sleep-wake rhythms',
          lowEnd: 'Misaligned, irregular patterns',
          highEnd: 'Well-aligned with natural rhythms'
        }
      ]
    },
    {
      id: 'energy-vitality',
      name: 'Energy & Vitality',
      description: 'Available energy and sense of aliveness',
      researchBasis: [
        'Mitochondrial Health Research',
        'Vitality Research',
        'Energy Management Science'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'baseline-energy',
          name: 'Baseline Energy',
          description: 'Typical available energy levels',
          lowEnd: 'Chronically fatigued, depleted',
          highEnd: 'Abundant, sustainable energy'
        },
        {
          id: 'energy-stability',
          name: 'Energy Stability',
          description: 'Consistency of energy throughout day',
          lowEnd: 'Dramatic crashes and spikes',
          highEnd: 'Stable, predictable energy'
        }
      ]
    },
    {
      id: 'movement-capacity',
      name: 'Movement & Physical Capacity',
      description: 'Body\'s ability to move and function',
      researchBasis: [
        'Functional Movement Research',
        'Physical Literacy',
        'Mobility Science'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'movement-quality',
          name: 'Movement Quality',
          description: 'How well and freely body moves',
          lowEnd: 'Restricted, painful movement',
          highEnd: 'Fluid, capable movement'
        },
        {
          id: 'physical-confidence',
          name: 'Physical Confidence',
          description: 'Trust in physical capabilities',
          lowEnd: 'Doubt in physical abilities',
          highEnd: 'Confident in body\'s capacities'
        }
      ]
    },
    {
      id: 'nourishment',
      name: 'Nourishment Relationship',
      description: 'Relationship with food and eating',
      researchBasis: [
        'Intuitive Eating Research',
        'Mindful Eating',
        'Nutritional Psychology'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'hunger-satiety',
          name: 'Hunger-Satiety Attunement',
          description: 'Connection to hunger and fullness signals',
          lowEnd: 'Disconnected from hunger/fullness',
          highEnd: 'Clear attunement to body\'s needs'
        },
        {
          id: 'food-relationship',
          name: 'Food Relationship Quality',
          description: 'Emotional relationship with eating',
          lowEnd: 'Conflicted, anxious relationship with food',
          highEnd: 'Peaceful, nourishing relationship'
        }
      ]
    },
    {
      id: 'embodied-presence',
      name: 'Embodied Presence',
      description: 'Being present in and through the body',
      researchBasis: [
        'Embodiment Research',
        'Somatic Experiencing',
        'Body Psychotherapy'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'body-inhabitation',
          name: 'Body Inhabitation',
          description: 'Degree of presence in physical form',
          lowEnd: 'Living "from the neck up"',
          highEnd: 'Fully inhabiting the body'
        },
        {
          id: 'body-expression',
          name: 'Physical Expression',
          description: 'Using body for authentic expression',
          lowEnd: 'Disconnected from physical expression',
          highEnd: 'Body as vehicle for authentic expression'
        }
      ]
    }
  ]
};

// =============================================================================
// SOUL PILLAR
// =============================================================================

export const SOUL_PILLAR: Pillar = {
  id: 'soul',
  name: 'Soul',
  description: 'Existential depth, authenticity, and transcendent connection',
  estimatedMinutes: 18,
  dimensions: [
    {
      id: 'authenticity',
      name: 'Authenticity',
      description: 'Living in alignment with true self',
      researchBasis: [
        'Authenticity Research (Kernis & Goldman)',
        'True Self Research',
        'Humanistic Psychology'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'self-knowledge',
          name: 'Authentic Self-Knowledge',
          description: 'Knowing who you really are beneath roles',
          lowEnd: 'Unclear about authentic self',
          highEnd: 'Deep knowing of essential self'
        },
        {
          id: 'authentic-expression',
          name: 'Authentic Expression',
          description: 'Expressing true self in the world',
          lowEnd: 'Hiding true self, wearing masks',
          highEnd: 'Naturally expressing authentic self'
        },
        {
          id: 'integrity-alignment',
          name: 'Integrity Alignment',
          description: 'Alignment between inner truth and outer action',
          lowEnd: 'Frequent compromise of values',
          highEnd: 'Living in full integrity'
        }
      ]
    },
    {
      id: 'existential-grounding',
      name: 'Existential Grounding',
      description: 'Relationship with fundamental life questions',
      researchBasis: [
        'Existential Psychology (Yalom)',
        'Terror Management Theory',
        'Meaning-Making Research'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'mortality-relationship',
          name: 'Mortality Relationship',
          description: 'How you relate to impermanence and death',
          lowEnd: 'Death anxiety, avoidance of mortality',
          highEnd: 'Mortality as teacher and motivator'
        },
        {
          id: 'uncertainty-tolerance',
          name: 'Existential Uncertainty Tolerance',
          description: 'Comfort with life\'s fundamental unknowns',
          lowEnd: 'Need for certainty, existential anxiety',
          highEnd: 'At peace with mystery and uncertainty'
        },
        {
          id: 'meaning-making',
          name: 'Meaning-Making Capacity',
          description: 'Ability to create meaning from experience',
          lowEnd: 'Struggle to find meaning in difficulty',
          highEnd: 'Can find/create meaning in any circumstance'
        }
      ]
    },
    {
      id: 'transcendence',
      name: 'Transcendent Connection',
      description: 'Connection to something larger than self',
      researchBasis: [
        'Transpersonal Psychology',
        'Spiritual Intelligence Research',
        'Self-Transcendence Research'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'awe-wonder',
          name: 'Awe & Wonder',
          description: 'Capacity for experiences of awe',
          lowEnd: 'Rarely experiences awe or wonder',
          highEnd: 'Regular experiences of transcendent awe'
        },
        {
          id: 'larger-connection',
          name: 'Connection to Larger Whole',
          description: 'Sense of being part of something greater',
          lowEnd: 'Isolated, disconnected from larger meaning',
          highEnd: 'Deep felt sense of interconnection'
        }
      ]
    },
    {
      id: 'shadow-integration',
      name: 'Shadow Integration',
      description: 'Relationship with disowned parts of self',
      researchBasis: [
        'Jungian Psychology',
        'Internal Family Systems',
        'Parts Work'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'shadow-awareness',
          name: 'Shadow Awareness',
          description: 'Recognition of disowned aspects',
          lowEnd: 'Blind to shadow, projects onto others',
          highEnd: 'Clear awareness of shadow patterns'
        },
        {
          id: 'shadow-acceptance',
          name: 'Shadow Acceptance',
          description: 'Embracing rather than rejecting shadow',
          lowEnd: 'Fights or hides from shadow aspects',
          highEnd: 'Shadow integrated as source of power'
        }
      ]
    },
    {
      id: 'creative-expression',
      name: 'Creative Expression',
      description: 'Capacity for creative and generative expression',
      researchBasis: [
        'Creativity Research',
        'Generativity (Erikson)',
        'Self-Actualization (Maslow)'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'creative-access',
          name: 'Creative Access',
          description: 'Connection to creative impulse',
          lowEnd: '"Not creative," blocked from creativity',
          highEnd: 'Easy access to creative flow'
        },
        {
          id: 'creative-courage',
          name: 'Creative Courage',
          description: 'Willingness to express and share creation',
          lowEnd: 'Fears judgment, hides creative work',
          highEnd: 'Courageously shares creative expression'
        }
      ]
    },
    {
      id: 'life-engagement',
      name: 'Life Engagement',
      description: 'Active participation in fully living',
      researchBasis: [
        'PERMA Model (Seligman)',
        'Eudaimonic Well-Being',
        'Vitality Research'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'aliveness',
          name: 'Sense of Aliveness',
          description: 'Feeling truly alive and engaged',
          lowEnd: 'Going through motions, numb',
          highEnd: 'Vibrant sense of being alive'
        },
        {
          id: 'engagement-depth',
          name: 'Engagement Depth',
          description: 'How fully you engage with life experiences',
          lowEnd: 'Surface-level engagement',
          highEnd: 'Deep, full engagement with life'
        }
      ]
    },
    {
      id: 'inner-wisdom',
      name: 'Inner Wisdom Access',
      description: 'Connection to intuitive knowing',
      researchBasis: [
        'Intuition Research',
        'Wisdom Research',
        'Contemplative Traditions'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'intuition-access',
          name: 'Intuition Access',
          description: 'Ability to access intuitive knowing',
          lowEnd: 'Disconnected from intuition',
          highEnd: 'Clear channel to intuitive wisdom'
        },
        {
          id: 'inner-guidance',
          name: 'Inner Guidance Trust',
          description: 'Trusting inner wisdom for decisions',
          lowEnd: 'Relies entirely on external guidance',
          highEnd: 'Trusts and follows inner guidance'
        }
      ]
    },
    {
      id: 'spiritual-practice',
      name: 'Spiritual Practice',
      description: 'Engagement with contemplative or spiritual practices',
      researchBasis: [
        'Contemplative Science',
        'Spiritual Development Research',
        'Meditation Research'
      ],
      questionCount: 5,
      facets: [
        {
          id: 'practice-consistency',
          name: 'Practice Consistency',
          description: 'Regular engagement with spiritual/contemplative practice',
          lowEnd: 'No regular practice',
          highEnd: 'Consistent, deep practice'
        },
        {
          id: 'practice-depth',
          name: 'Practice Depth',
          description: 'Depth of engagement with practice',
          lowEnd: 'Surface-level or mechanical practice',
          highEnd: 'Deep, transformative engagement'
        }
      ]
    }
  ]
};

// =============================================================================
// RELATIONSHIPS PILLAR
// =============================================================================

export const RELATIONSHIPS_PILLAR: Pillar = {
  id: 'relationships',
  name: 'Relationships',
  description: 'Connection with others, relational patterns, and social well-being',
  estimatedMinutes: 18,
  dimensions: [
    {
      id: 'attachment-patterns',
      name: 'Attachment Patterns',
      description: 'Foundational patterns in how you bond and connect',
      researchBasis: [
        'Attachment Theory (Bowlby, Ainsworth)',
        'Adult Attachment Research',
        'Attachment Styles (Bartholomew)'
      ],
      questionCount: 8,
      facets: [
        {
          id: 'attachment-security',
          name: 'Security in Connection',
          description: 'Baseline sense of security in relationships',
          lowEnd: 'Chronic insecurity in relationships',
          highEnd: 'Secure, trusting foundation'
        },
        {
          id: 'abandonment-patterns',
          name: 'Abandonment Response',
          description: 'How you respond to perceived threat of loss',
          lowEnd: 'Intense fear/anxiety around abandonment',
          highEnd: 'Trusts relationship continuity'
        },
        {
          id: 'avoidance-patterns',
          name: 'Avoidance Patterns',
          description: 'Tendency to distance when intimacy increases',
          lowEnd: 'Withdraws from closeness, shuts down',
          highEnd: 'Comfortable with deepening intimacy'
        }
      ]
    },
    {
      id: 'communication',
      name: 'Relational Communication',
      description: 'How effectively you communicate in relationships',
      researchBasis: [
        'Nonviolent Communication (Rosenberg)',
        'Gottman Research',
        'Interpersonal Communication Research'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'expression-clarity',
          name: 'Expression Clarity',
          description: 'Ability to clearly express needs and feelings',
          lowEnd: 'Difficulty articulating inner experience',
          highEnd: 'Clear, direct, kind expression'
        },
        {
          id: 'receptive-listening',
          name: 'Receptive Listening',
          description: 'Ability to truly hear and understand others',
          lowEnd: 'Listening to respond, not understand',
          highEnd: 'Deep, empathic listening'
        },
        {
          id: 'difficult-conversations',
          name: 'Difficult Conversations',
          description: 'Handling challenging relational discussions',
          lowEnd: 'Avoids or escalates difficult talks',
          highEnd: 'Navigates hard conversations skillfully'
        }
      ]
    },
    {
      id: 'boundaries',
      name: 'Boundary Health',
      description: 'Ability to set and maintain healthy limits',
      researchBasis: [
        'Boundary Research',
        'Codependency Research',
        'Assertiveness Training'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'boundary-awareness',
          name: 'Boundary Awareness',
          description: 'Knowing where your limits are',
          lowEnd: 'Unclear about own boundaries',
          highEnd: 'Clear awareness of personal limits'
        },
        {
          id: 'boundary-communication',
          name: 'Boundary Communication',
          description: 'Expressing boundaries to others',
          lowEnd: 'Difficulty saying no or setting limits',
          highEnd: 'Clearly communicates boundaries'
        },
        {
          id: 'boundary-maintenance',
          name: 'Boundary Maintenance',
          description: 'Holding boundaries when challenged',
          lowEnd: 'Collapses under pressure',
          highEnd: 'Maintains boundaries with compassion'
        }
      ]
    },
    {
      id: 'conflict-repair',
      name: 'Conflict & Repair',
      description: 'Handling disagreements and healing ruptures',
      researchBasis: [
        'Gottman Research',
        'Rupture-Repair Research',
        'Conflict Resolution Research'
      ],
      questionCount: 7,
      facets: [
        {
          id: 'conflict-style',
          name: 'Conflict Style',
          description: 'How you engage with disagreement',
          lowEnd: 'Avoids, attacks, or shuts down',
          highEnd: 'Engages constructively with conflict'
        },
        {
          id: 'repair-initiation',
          name: 'Repair Initiation',
          description: 'Willingness to initiate healing after rupture',
          lowEnd: 'Waits for other to repair',
          highEnd: 'Takes initiative to repair'
        },
        {
          id: 'repair-reception',
          name: 'Repair Reception',
          description: 'Ability to receive and accept repair attempts',
          lowEnd: 'Rejects repair attempts, holds grudges',
          highEnd: 'Graciously accepts repair'
        }
      ]
    },
    {
      id: 'trust-vulnerability',
      name: 'Trust & Vulnerability',
      description: 'Capacity for trust and emotional openness',
      researchBasis: [
        'Vulnerability Research (Brown)',
        'Trust Research',
        'Intimacy Research'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'trust-capacity',
          name: 'Trust Capacity',
          description: 'Ability to trust others',
          lowEnd: 'Difficulty trusting, hypervigilant',
          highEnd: 'Appropriate, calibrated trust'
        },
        {
          id: 'vulnerability-tolerance',
          name: 'Vulnerability Tolerance',
          description: 'Comfort with emotional exposure',
          lowEnd: 'Armored, protective',
          highEnd: 'Can be appropriately vulnerable'
        }
      ]
    },
    {
      id: 'empathy-attunement',
      name: 'Empathy & Attunement',
      description: 'Connecting with others\' emotional experience',
      researchBasis: [
        'Empathy Research',
        'Emotional Intelligence (Goleman)',
        'Attunement Research'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'empathic-accuracy',
          name: 'Empathic Accuracy',
          description: 'Accurately reading others\' emotions',
          lowEnd: 'Often misreads others\' states',
          highEnd: 'Accurate sense of others\' experience'
        },
        {
          id: 'empathic-response',
          name: 'Empathic Response',
          description: 'Responding helpfully to others\' emotions',
          lowEnd: 'Unsure how to respond to emotions',
          highEnd: 'Naturally helpful, attuned response'
        }
      ]
    },
    {
      id: 'intimacy-depth',
      name: 'Intimacy & Depth',
      description: 'Capacity for deep, meaningful connection',
      researchBasis: [
        'Intimacy Research',
        'Relationship Depth Research',
        'Close Relationships Research'
      ],
      questionCount: 6,
      facets: [
        {
          id: 'intimacy-capacity',
          name: 'Intimacy Capacity',
          description: 'Ability to create and sustain deep connection',
          lowEnd: 'Keeps relationships surface-level',
          highEnd: 'Creates profound depth of connection'
        },
        {
          id: 'intimacy-comfort',
          name: 'Intimacy Comfort',
          description: 'Comfort with increasing closeness',
          lowEnd: 'Uncomfortable as intimacy deepens',
          highEnd: 'At ease with deep intimacy'
        }
      ]
    },
    {
      id: 'social-connection',
      name: 'Social Connection',
      description: 'Quality and breadth of social network',
      researchBasis: [
        'Social Support Research',
        'Loneliness Research (Cacioppo)',
        'Social Network Research'
      ],
      questionCount: 5,
      facets: [
        {
          id: 'social-belonging',
          name: 'Sense of Belonging',
          description: 'Feeling part of communities and groups',
          lowEnd: 'Isolated, doesn\'t belong anywhere',
          highEnd: 'Strong sense of belonging'
        },
        {
          id: 'connection-quality',
          name: 'Connection Quality',
          description: 'Depth and quality of social connections',
          lowEnd: 'Few meaningful connections',
          highEnd: 'Rich network of quality connections'
        }
      ]
    },
    {
      id: 'relational-patterns',
      name: 'Relational Self-Awareness',
      description: 'Understanding your patterns in relationships',
      researchBasis: [
        'Relational Psychoanalysis',
        'Interpersonal Patterns Research',
        'Relationship Self-Awareness'
      ],
      questionCount: 5,
      facets: [
        {
          id: 'pattern-awareness',
          name: 'Pattern Awareness',
          description: 'Recognizing your relational tendencies',
          lowEnd: 'Blind to relationship patterns',
          highEnd: 'Clear awareness of relational patterns'
        },
        {
          id: 'origin-understanding',
          name: 'Origin Understanding',
          description: 'Understanding where patterns come from',
          lowEnd: 'No insight into pattern origins',
          highEnd: 'Understands how patterns developed'
        }
      ]
    }
  ]
};

// =============================================================================
// COMPLETE FRAMEWORK
// =============================================================================

export const ASSESSMENT_FRAMEWORK = {
  pillars: [MIND_PILLAR, BODY_PILLAR, SOUL_PILLAR, RELATIONSHIPS_PILLAR],
  stages: DEVELOPMENT_STAGES,
  version: '1.0.0',
  lastUpdated: '2024-12-26'
};

// Helper functions
export function getPillarById(id: string): Pillar | undefined {
  return ASSESSMENT_FRAMEWORK.pillars.find(p => p.id === id);
}

export function getDimensionById(pillarId: string, dimensionId: string): Dimension | undefined {
  const pillar = getPillarById(pillarId);
  return pillar?.dimensions.find(d => d.id === dimensionId);
}

export function getStageForScore(score: number): StageInfo {
  return DEVELOPMENT_STAGES.find(s => score >= s.range[0] && score <= s.range[1])
    || DEVELOPMENT_STAGES[2]; // Default to integration
}

export function getTotalQuestions(pillar: Pillar): number {
  return pillar.dimensions.reduce((sum, d) => sum + d.questionCount, 0);
}

export function getTotalDimensions(): number {
  return ASSESSMENT_FRAMEWORK.pillars.reduce((sum, p) => sum + p.dimensions.length, 0);
}

export function getTotalFacets(): number {
  return ASSESSMENT_FRAMEWORK.pillars.reduce((sum, p) =>
    sum + p.dimensions.reduce((dSum, d) => dSum + d.facets.length, 0), 0);
}

// Framework statistics
export const FRAMEWORK_STATS = {
  pillars: 4,
  dimensions: getTotalDimensions(),
  facets: getTotalFacets(),
  totalQuestions: ASSESSMENT_FRAMEWORK.pillars.reduce((sum, p) => sum + getTotalQuestions(p), 0),
  estimatedMinutesTotal: ASSESSMENT_FRAMEWORK.pillars.reduce((sum, p) => sum + p.estimatedMinutes, 0)
};
