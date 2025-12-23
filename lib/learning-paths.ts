/**
 * Learning Paths System
 * Curated journeys combining courses, articles, and practices
 * Paths are personalized based on health state and goals
 */

import { type Pillar, type SpectrumStage, PILLAR_INFO } from './integration-health';

export interface PathStep {
  type: 'course' | 'article' | 'practice' | 'assessment' | 'milestone';
  slug: string;
  title: string;
  description: string;
  duration?: string; // e.g., "15 min", "1 hour"
  optional?: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  pillar: Pillar;
  stages: SpectrumStage[]; // Which stages this path is appropriate for
  estimatedDuration: string; // e.g., "2 weeks", "1 month"
  steps: PathStep[];
  outcomes: string[];
  icon: string; // SVG path or emoji
}

// Curated learning paths
export const LEARNING_PATHS: LearningPath[] = [
  // MIND PILLAR PATHS
  {
    id: 'shadow-integration',
    title: 'Shadow Integration',
    subtitle: 'Making peace with the hidden parts',
    description:
      'A deep dive into shadow work - understanding, befriending, and integrating the parts of yourself you\'ve pushed away. This path combines psychological understanding with practical exercises.',
    pillar: 'mind',
    stages: ['regulation', 'integration', 'embodiment'],
    estimatedDuration: '3-4 weeks',
    steps: [
      {
        type: 'article',
        slug: 'what-is-shadow-work',
        title: 'Understanding the Shadow',
        description: 'Learn what the shadow is and why it matters',
        duration: '10 min',
      },
      {
        type: 'practice',
        slug: 'shadow-journaling',
        title: 'Shadow Journaling',
        description: 'Begin identifying your shadow patterns',
        duration: '20 min',
      },
      {
        type: 'course',
        slug: 'shadow-work-essentials',
        title: 'Shadow Work Essentials',
        description: 'Complete course on shadow integration',
        duration: '2-3 hours',
      },
      {
        type: 'practice',
        slug: 'parts-dialogue',
        title: 'Parts Dialogue Practice',
        description: 'Speak with your shadow parts',
        duration: '30 min',
        optional: true,
      },
      {
        type: 'milestone',
        slug: 'shadow-integration-complete',
        title: 'Integration Milestone',
        description: 'Reflect on your shadow work journey',
        duration: '15 min',
      },
    ],
    outcomes: [
      'Understand what your shadow contains',
      'Develop compassion for rejected parts',
      'Reduce reactivity to triggers',
      'Greater self-acceptance',
    ],
    icon: 'moon',
  },
  {
    id: 'inner-critic-healing',
    title: 'Healing the Inner Critic',
    subtitle: 'From harsh judgment to compassionate guidance',
    description:
      'Transform your relationship with your inner critic. Learn to recognize critical voices, understand their origins, and develop a more compassionate inner dialogue.',
    pillar: 'mind',
    stages: ['collapse', 'regulation', 'integration'],
    estimatedDuration: '2 weeks',
    steps: [
      {
        type: 'article',
        slug: 'understanding-inner-critic',
        title: 'Understanding Your Inner Critic',
        description: 'Where does that harsh voice come from?',
        duration: '8 min',
      },
      {
        type: 'practice',
        slug: 'self-compassion-pause',
        title: 'Self-Compassion Pause',
        description: 'A gentle practice for difficult moments',
        duration: '5 min',
      },
      {
        type: 'practice',
        slug: 'loving-kindness-self',
        title: 'Loving-Kindness for Self',
        description: 'Build a foundation of self-compassion',
        duration: '15 min',
      },
      {
        type: 'milestone',
        slug: 'inner-critic-awareness',
        title: 'Awareness Check-In',
        description: 'Notice shifts in your inner dialogue',
        duration: '10 min',
      },
    ],
    outcomes: [
      'Recognize inner critic patterns',
      'Respond with self-compassion',
      'Softer inner dialogue',
      'Less self-judgment',
    ],
    icon: 'heart',
  },

  // BODY PILLAR PATHS
  {
    id: 'nervous-system-regulation',
    title: 'Nervous System Mastery',
    subtitle: 'Finding your way back to calm',
    description:
      'Learn to understand and regulate your nervous system. This path teaches you to recognize dysregulation and provides practical tools for returning to a grounded, safe state.',
    pillar: 'body',
    stages: ['collapse', 'regulation', 'integration'],
    estimatedDuration: '2-3 weeks',
    steps: [
      {
        type: 'assessment',
        slug: 'nervous-system',
        title: 'Nervous System Assessment',
        description: 'Discover your current nervous system patterns',
        duration: '5 min',
      },
      {
        type: 'article',
        slug: 'understanding-nervous-system',
        title: 'Your Nervous System Explained',
        description: 'Learn how your body responds to stress',
        duration: '12 min',
      },
      {
        type: 'practice',
        slug: 'grounding-5-4-3-2-1',
        title: '5-4-3-2-1 Grounding',
        description: 'A quick sensory grounding technique',
        duration: '3 min',
      },
      {
        type: 'practice',
        slug: 'box-breathing',
        title: 'Box Breathing',
        description: 'Calm your nervous system with breath',
        duration: '5 min',
      },
      {
        type: 'practice',
        slug: 'vagal-toning',
        title: 'Vagal Toning Exercises',
        description: 'Activate your parasympathetic response',
        duration: '10 min',
      },
      {
        type: 'milestone',
        slug: 'regulation-toolkit',
        title: 'Your Regulation Toolkit',
        description: 'Identify your go-to regulation practices',
        duration: '10 min',
      },
    ],
    outcomes: [
      'Recognize signs of dysregulation',
      'Quick calming techniques',
      'Greater body awareness',
      'Faster recovery from stress',
    ],
    icon: 'wave',
  },
  {
    id: 'embodiment-practice',
    title: 'Coming Home to Your Body',
    subtitle: 'Reconnecting with somatic wisdom',
    description:
      'For those who feel disconnected from their bodies. This gentle path helps you rebuild a loving relationship with your physical self through somatic practices.',
    pillar: 'body',
    stages: ['regulation', 'integration', 'embodiment'],
    estimatedDuration: '3-4 weeks',
    steps: [
      {
        type: 'article',
        slug: 'body-disconnection',
        title: 'Why We Disconnect from Our Bodies',
        description: 'Understanding protective dissociation',
        duration: '10 min',
      },
      {
        type: 'practice',
        slug: 'body-scan-gentle',
        title: 'Gentle Body Scan',
        description: 'A non-invasive way to sense your body',
        duration: '15 min',
      },
      {
        type: 'practice',
        slug: 'mindful-movement',
        title: 'Mindful Movement',
        description: 'Move with awareness and pleasure',
        duration: '20 min',
      },
      {
        type: 'practice',
        slug: 'somatic-tracking',
        title: 'Somatic Tracking',
        description: 'Follow sensations with curiosity',
        duration: '10 min',
      },
      {
        type: 'milestone',
        slug: 'body-relationship',
        title: 'Body Relationship Reflection',
        description: 'Notice how your body connection has shifted',
        duration: '15 min',
      },
    ],
    outcomes: [
      'Feel safer in your body',
      'Recognize body signals',
      'More present in physical experience',
      'Reduced dissociation',
    ],
    icon: 'body',
  },

  // SOUL PILLAR PATHS
  {
    id: 'meaning-purpose',
    title: 'Discovering Your Purpose',
    subtitle: 'Connecting to what truly matters',
    description:
      'Explore your deeper purpose and values. This contemplative path helps you uncover what gives your life meaning and align your actions with your soul\'s calling.',
    pillar: 'soul',
    stages: ['integration', 'embodiment', 'optimization'],
    estimatedDuration: '2-3 weeks',
    steps: [
      {
        type: 'practice',
        slug: 'values-exploration',
        title: 'Values Exploration',
        description: 'Discover what truly matters to you',
        duration: '30 min',
      },
      {
        type: 'article',
        slug: 'finding-purpose',
        title: 'The Search for Purpose',
        description: 'Different approaches to meaning-making',
        duration: '12 min',
      },
      {
        type: 'practice',
        slug: 'future-self-visualization',
        title: 'Future Self Visualization',
        description: 'Connect with who you\'re becoming',
        duration: '20 min',
      },
      {
        type: 'practice',
        slug: 'purpose-journaling',
        title: 'Purpose Journaling',
        description: 'Deep questions about your calling',
        duration: '25 min',
        optional: true,
      },
      {
        type: 'milestone',
        slug: 'purpose-statement',
        title: 'Your Purpose Statement',
        description: 'Articulate your emerging sense of purpose',
        duration: '20 min',
      },
    ],
    outcomes: [
      'Clarity on core values',
      'Sense of direction',
      'Aligned decision-making',
      'Deeper life satisfaction',
    ],
    icon: 'compass',
  },
  {
    id: 'stillness-practice',
    title: 'The Art of Stillness',
    subtitle: 'Finding peace in being',
    description:
      'In a world of constant doing, learn the radical practice of simply being. This path introduces meditation and contemplative practices for inner peace.',
    pillar: 'soul',
    stages: ['regulation', 'integration', 'embodiment', 'optimization'],
    estimatedDuration: '2 weeks',
    steps: [
      {
        type: 'article',
        slug: 'why-stillness-matters',
        title: 'Why Stillness Matters',
        description: 'The case for doing nothing',
        duration: '8 min',
      },
      {
        type: 'practice',
        slug: 'basic-meditation',
        title: 'Basic Sitting Meditation',
        description: 'Start with 5 minutes of stillness',
        duration: '5 min',
      },
      {
        type: 'practice',
        slug: 'breath-awareness',
        title: 'Breath Awareness',
        description: 'Use breath as an anchor',
        duration: '10 min',
      },
      {
        type: 'practice',
        slug: 'open-awareness',
        title: 'Open Awareness',
        description: 'Rest in choiceless awareness',
        duration: '15 min',
      },
      {
        type: 'milestone',
        slug: 'stillness-integration',
        title: 'Integrating Stillness',
        description: 'Bring stillness into daily life',
        duration: '10 min',
      },
    ],
    outcomes: [
      'Comfortable with silence',
      'Reduced mental chatter',
      'Greater presence',
      'Access to inner peace',
    ],
    icon: 'lotus',
  },

  // RELATIONSHIPS PILLAR PATHS
  {
    id: 'attachment-healing',
    title: 'Attachment Healing',
    subtitle: 'Creating secure connection',
    description:
      'Understand your attachment patterns and learn to develop more secure ways of relating. This path combines self-understanding with practical relational skills.',
    pillar: 'relationships',
    stages: ['regulation', 'integration', 'embodiment'],
    estimatedDuration: '4-6 weeks',
    steps: [
      {
        type: 'assessment',
        slug: 'attachment',
        title: 'Attachment Style Assessment',
        description: 'Discover your attachment patterns',
        duration: '10 min',
      },
      {
        type: 'article',
        slug: 'attachment-styles-explained',
        title: 'Understanding Attachment',
        description: 'The four attachment styles',
        duration: '15 min',
      },
      {
        type: 'course',
        slug: 'attachment-healing',
        title: 'Attachment Healing Course',
        description: 'Deep dive into secure attachment',
        duration: '3-4 hours',
      },
      {
        type: 'practice',
        slug: 'self-soothing',
        title: 'Self-Soothing Practice',
        description: 'Build internal security',
        duration: '15 min',
      },
      {
        type: 'milestone',
        slug: 'attachment-progress',
        title: 'Attachment Progress Check',
        description: 'Notice shifts in your relating patterns',
        duration: '15 min',
      },
    ],
    outcomes: [
      'Understand your patterns',
      'Reduced anxious/avoidant behaviors',
      'More secure relationships',
      'Better self-soothing',
    ],
    icon: 'link',
  },
  {
    id: 'healthy-boundaries',
    title: 'Healthy Boundaries',
    subtitle: 'Honoring yourself in relationship',
    description:
      'Learn to set and maintain boundaries with compassion. This path helps you protect your energy while staying connected to others.',
    pillar: 'relationships',
    stages: ['regulation', 'integration', 'embodiment'],
    estimatedDuration: '2 weeks',
    steps: [
      {
        type: 'article',
        slug: 'what-are-boundaries',
        title: 'Understanding Boundaries',
        description: 'What boundaries really are',
        duration: '10 min',
      },
      {
        type: 'practice',
        slug: 'boundary-inventory',
        title: 'Boundary Inventory',
        description: 'Assess your current boundaries',
        duration: '20 min',
      },
      {
        type: 'article',
        slug: 'setting-boundaries',
        title: 'How to Set Boundaries',
        description: 'Practical boundary-setting skills',
        duration: '12 min',
      },
      {
        type: 'practice',
        slug: 'boundary-scripts',
        title: 'Boundary Scripts',
        description: 'Practice what to say',
        duration: '15 min',
      },
      {
        type: 'milestone',
        slug: 'boundary-wins',
        title: 'Celebrating Boundary Wins',
        description: 'Acknowledge your growth',
        duration: '10 min',
      },
    ],
    outcomes: [
      'Clear sense of limits',
      'Confidence saying no',
      'Less resentment',
      'Healthier relationships',
    ],
    icon: 'shield',
  },
];

/**
 * Get all learning paths
 */
export function getAllPaths(): LearningPath[] {
  return LEARNING_PATHS;
}

/**
 * Get a specific path by ID
 */
export function getPathById(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === id);
}

/**
 * Get paths for a specific pillar
 */
export function getPathsByPillar(pillar: Pillar): LearningPath[] {
  return LEARNING_PATHS.filter((p) => p.pillar === pillar);
}

/**
 * Get paths appropriate for a specific stage
 */
export function getPathsForStage(stage: SpectrumStage): LearningPath[] {
  return LEARNING_PATHS.filter((p) => p.stages.includes(stage));
}

/**
 * Get recommended paths based on user's health state
 */
export function getRecommendedPaths(
  lowestPillar: Pillar,
  currentStage: SpectrumStage,
  limit: number = 3
): LearningPath[] {
  const allPaths = LEARNING_PATHS;

  const scoredPaths = allPaths.map((path) => {
    let score = 0;

    // Pillar match - highest priority
    if (path.pillar === lowestPillar) {
      score += 20;
    }

    // Stage appropriateness
    if (path.stages.includes(currentStage)) {
      score += 15;
    }

    // Penalize if path is too advanced for current stage
    const stageOrder: SpectrumStage[] = [
      'collapse',
      'regulation',
      'integration',
      'embodiment',
      'optimization',
    ];
    const currentStageIndex = stageOrder.indexOf(currentStage);
    const pathMinStageIndex = Math.min(...path.stages.map((s) => stageOrder.indexOf(s)));

    if (pathMinStageIndex > currentStageIndex) {
      score -= 10; // Path is too advanced
    }

    return { path, score };
  });

  return scoredPaths
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ path }) => path);
}

/**
 * Get pillar info with icon
 */
export function getPathPillarInfo(pillar: Pillar) {
  return PILLAR_INFO[pillar];
}
