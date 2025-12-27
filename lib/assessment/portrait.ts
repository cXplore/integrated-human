/**
 * Assessment Portrait Generator
 *
 * Converts raw assessment results into a meaningful, human-readable portrait
 * that the user can understand and that informs content recommendations.
 *
 * This is what the user sees after completing the assessment - not just numbers,
 * but a thoughtful reflection of where they are and what might serve them.
 */

import type {
  PillarId,
  DevelopmentStage,
  DimensionScore,
  PillarAssessmentResult,
  IntegrationAssessmentResult,
} from './types';
import { DEVELOPMENT_STAGES, getPillarById } from './framework';

// ============================================================================
// PORTRAIT TYPES
// ============================================================================

export interface PillarPortrait {
  // Core info
  pillarId: PillarId;
  pillarName: string;
  icon: string;

  // Scores
  score: number;
  stage: DevelopmentStage;
  stageName: string;
  stageDescription: string;
  stageColor: string;

  // Headline
  headline: string;

  // Narrative
  narrative: string;

  // Dimension breakdown
  dimensions: DimensionPortrait[];

  // Strengths
  strengths: {
    dimension: string;
    insight: string;
  }[];

  // Growth areas
  growthAreas: {
    dimension: string;
    recommendation: string;
  }[];

  // Recommendations
  recommendations: Recommendation[];

  // Safety note (if applicable)
  safetyNote?: SafetyNote;
}

export interface DimensionPortrait {
  dimensionId: string;
  dimensionName: string;
  score: number;
  stage: DevelopmentStage;
  stageName: string;
  insight: string;
  facets: {
    name: string;
    score: number;
  }[];
}

export interface IntegrationPortrait {
  // Overall
  integrationScore: number;
  integrationStage: DevelopmentStage;
  integrationStageName: string;
  stageDescription: string;
  stageColor: string;

  // Headline
  headline: string;

  // Narrative
  narrative: string;

  // Pillar summaries
  pillarSummaries: {
    pillarId: PillarId;
    pillarName: string;
    icon: string;
    score: number;
    stage: DevelopmentStage;
    stageName: string;
    summary: string;
  }[];

  // Cross-pillar insights
  strongestPillar: {
    id: PillarId;
    name: string;
    insight: string;
  };

  priorityPillar: {
    id: PillarId;
    name: string;
    recommendation: string;
  };

  // Balance analysis
  balance: {
    isBalanced: boolean;
    description: string;
  };

  // Top recommendations
  recommendations: Recommendation[];

  // Safety notes
  safetyNote?: SafetyNote;
}

export interface Recommendation {
  type: 'course' | 'article' | 'practice' | 'action';
  title: string;
  description: string;
  priority: 'primary' | 'secondary' | 'when-ready';
  pillar?: PillarId;
  link?: string;
}

export interface SafetyNote {
  message: string;
  severity: 'gentle' | 'moderate' | 'urgent';
  resources?: string[];
}

// ============================================================================
// STAGE DESCRIPTIONS
// ============================================================================

const STAGE_INFO: Record<DevelopmentStage, {
  name: string;
  description: string;
  color: string;
  focus: string;
}> = {
  collapse: {
    name: 'Collapse',
    description: 'You are in a challenging place right now. This is not a judgment - it is simply where you are. The priority is stabilization and finding ground.',
    color: '#ef4444',
    focus: 'Finding safety, stabilization, and basic regulation',
  },
  regulation: {
    name: 'Regulation',
    description: 'You are working on building your capacity to handle what life brings. This is foundational work - learning to regulate your nervous system and emotional states.',
    color: '#f97316',
    focus: 'Building regulation capacity and resilience',
  },
  integration: {
    name: 'Integration',
    description: 'You are in the midst of the core work - integrating different aspects of yourself, processing patterns, and developing deeper awareness. This is where real transformation happens.',
    color: '#eab308',
    focus: 'Pattern recognition, integration, and emotional processing',
  },
  embodiment: {
    name: 'Embodiment',
    description: 'You are learning to live what you know. The insights are becoming embodied wisdom. Your practice is becoming who you are.',
    color: '#22c55e',
    focus: 'Living your values, sustainable practice, and authentic expression',
  },
  optimization: {
    name: 'Optimization',
    description: 'You have solid foundations and are now refining and deepening. This is about mastery, contribution, and helping others on the path.',
    color: '#3b82f6',
    focus: 'Mastery, flow states, and service to others',
  },
};

// ============================================================================
// PILLAR INFO
// ============================================================================

const PILLAR_INFO: Record<PillarId, { name: string; icon: string }> = {
  mind: { name: 'Mind', icon: '🧠' },
  body: { name: 'Body', icon: '💪' },
  soul: { name: 'Soul', icon: '✨' },
  relationships: { name: 'Relationships', icon: '💚' },
};

// ============================================================================
// PILLAR PORTRAIT GENERATION
// ============================================================================

/**
 * Generate a complete portrait for a single pillar assessment
 */
export function generatePillarPortrait(result: PillarAssessmentResult): PillarPortrait {
  const pillarInfo = PILLAR_INFO[result.pillarId];
  const stageInfo = STAGE_INFO[result.overallStage];

  // Generate dimension portraits
  const dimensions = result.dimensionScores.map(dim =>
    generateDimensionPortrait(dim)
  );

  // Generate headline
  const headline = generatePillarHeadline(result);

  // Generate narrative
  const narrative = generatePillarNarrative(result);

  // Format strengths
  const strengths = result.topStrengths.map(s => ({
    dimension: s.dimension.dimensionName,
    insight: s.insight,
  }));

  // Format growth areas
  const growthAreas = result.primaryGrowthAreas.map(g => ({
    dimension: g.dimension.dimensionName,
    recommendation: g.recommendation,
  }));

  // Generate recommendations
  const recommendations = generatePillarRecommendations(result);

  // Check for safety concerns
  const safetyNote = generateSafetyNote(result.overallScore, result.overallStage);

  return {
    pillarId: result.pillarId,
    pillarName: pillarInfo.name,
    icon: pillarInfo.icon,
    score: result.overallScore,
    stage: result.overallStage,
    stageName: stageInfo.name,
    stageDescription: stageInfo.description,
    stageColor: stageInfo.color,
    headline,
    narrative,
    dimensions,
    strengths,
    growthAreas,
    recommendations,
    safetyNote,
  };
}

function generateDimensionPortrait(dim: DimensionScore): DimensionPortrait {
  const stageInfo = STAGE_INFO[dim.stage];

  return {
    dimensionId: dim.dimensionId,
    dimensionName: dim.dimensionName,
    score: dim.score,
    stage: dim.stage,
    stageName: stageInfo.name,
    insight: generateDimensionInsight(dim),
    facets: dim.facetScores.map(f => ({
      name: f.facetName,
      score: f.score,
    })),
  };
}

function generateDimensionInsight(dim: DimensionScore): string {
  const stage = dim.stage;
  const name = dim.dimensionName;

  if (stage === 'collapse') {
    return `${name} is in a challenging state and needs immediate, gentle attention.`;
  } else if (stage === 'regulation') {
    return `${name} is developing. Focus on building foundational stability here.`;
  } else if (stage === 'integration') {
    return `${name} shows solid development. Continue the work of integration.`;
  } else if (stage === 'embodiment') {
    return `${name} is well-developed and becoming naturally expressed.`;
  } else {
    return `${name} is strong. This is a foundation you can build on and share.`;
  }
}

function generatePillarHeadline(result: PillarAssessmentResult): string {
  const stage = result.overallStage;
  const name = result.pillarName;

  const headlines: Record<DevelopmentStage, string> = {
    collapse: `Your ${name} pillar needs immediate attention and support.`,
    regulation: `Your ${name} pillar is building foundations.`,
    integration: `Your ${name} pillar is actively developing.`,
    embodiment: `Your ${name} pillar is becoming naturally expressed.`,
    optimization: `Your ${name} pillar is well-developed and refined.`,
  };

  return headlines[stage];
}

function generatePillarNarrative(result: PillarAssessmentResult): string {
  const stage = result.overallStage;
  const name = result.pillarName.toLowerCase();
  const stageInfo = STAGE_INFO[stage];

  let narrative = stageInfo.description + '\n\n';

  // Add specific pillar context
  if (result.pillarId === 'mind') {
    narrative += `Your ${name} dimension encompasses how you relate to your thoughts, emotions, and inner psychological landscape. `;
  } else if (result.pillarId === 'body') {
    narrative += `Your ${name} dimension reflects your relationship with physical sensation, energy, and embodied presence. `;
  } else if (result.pillarId === 'soul') {
    narrative += `Your ${name} dimension speaks to your sense of meaning, authenticity, and connection to something larger. `;
  } else {
    narrative += `Your ${name} dimension reveals your patterns in connecting with others and navigating intimacy. `;
  }

  // Add strength/growth context
  if (result.topStrengths.length > 0) {
    const topStrength = result.topStrengths[0].dimension;
    narrative += `Your ${topStrength.dimensionName} stands out as a particular strength. `;
  }

  if (result.primaryGrowthAreas.length > 0) {
    const topGrowth = result.primaryGrowthAreas[0].dimension;
    narrative += `${topGrowth.dimensionName} offers the most opportunity for growth.`;
  }

  return narrative;
}

function generatePillarRecommendations(result: PillarAssessmentResult): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const stage = result.overallStage;

  // Stage-based recommendations
  if (stage === 'collapse' || stage === 'regulation') {
    recommendations.push({
      type: 'course',
      title: 'Foundation Building',
      description: `Start with foundational practices for your ${result.pillarName} pillar`,
      priority: 'primary',
      pillar: result.pillarId,
    });
  } else if (stage === 'integration') {
    recommendations.push({
      type: 'course',
      title: 'Deepening Work',
      description: `Engage with integration practices for ${result.pillarName}`,
      priority: 'primary',
      pillar: result.pillarId,
    });
  } else {
    recommendations.push({
      type: 'practice',
      title: 'Advanced Practices',
      description: `Continue refining your ${result.pillarName} development`,
      priority: 'secondary',
      pillar: result.pillarId,
    });
  }

  // Growth area recommendation
  if (result.primaryGrowthAreas.length > 0) {
    const topGrowth = result.primaryGrowthAreas[0];
    recommendations.push({
      type: 'article',
      title: `Understanding ${topGrowth.dimension.dimensionName}`,
      description: topGrowth.recommendation,
      priority: 'primary',
      pillar: result.pillarId,
    });
  }

  return recommendations;
}

// ============================================================================
// INTEGRATION PORTRAIT GENERATION
// ============================================================================

/**
 * Generate a complete portrait for the full integration assessment
 */
export function generateIntegrationPortrait(
  result: IntegrationAssessmentResult
): IntegrationPortrait {
  const stageInfo = STAGE_INFO[result.integrationStage];

  // Generate pillar summaries
  const pillarSummaries = result.pillarResults.map(pr => {
    const pillarInfo = PILLAR_INFO[pr.pillarId];
    const pillarStageInfo = STAGE_INFO[pr.overallStage];

    return {
      pillarId: pr.pillarId,
      pillarName: pillarInfo.name,
      icon: pillarInfo.icon,
      score: pr.overallScore,
      stage: pr.overallStage,
      stageName: pillarStageInfo.name,
      summary: generatePillarSummary(pr),
    };
  });

  // Strongest pillar insight
  const strongestResult = result.pillarResults.find(
    p => p.pillarId === result.strongestPillar
  );
  const strongestInfo = PILLAR_INFO[result.strongestPillar];
  const strongestPillar = {
    id: result.strongestPillar,
    name: strongestInfo.name,
    insight: strongestResult
      ? `Your ${strongestInfo.name} pillar (${strongestResult.overallScore}) is a foundation to build on.`
      : `Your ${strongestInfo.name} pillar shows relative strength.`,
  };

  // Priority pillar recommendation
  const priorityResult = result.pillarResults.find(
    p => p.pillarId === result.priorityPillar
  );
  const priorityInfo = PILLAR_INFO[result.priorityPillar];
  const priorityPillar = {
    id: result.priorityPillar,
    name: priorityInfo.name,
    recommendation: priorityResult
      ? `Focus on ${priorityInfo.name} (${priorityResult.overallScore}) for the greatest impact.`
      : `Consider directing attention to ${priorityInfo.name} for balanced growth.`,
  };

  // Balance analysis
  const balance = {
    isBalanced: result.pillarBalance.isBalanced,
    description: result.pillarBalance.isBalanced
      ? 'Your development is well-balanced across all pillars.'
      : result.pillarBalance.imbalanceDescription || 'Some pillars need more attention than others.',
  };

  // Generate recommendations
  const recommendations = generateIntegrationRecommendations(result);

  // Check for safety
  const safetyNote = generateIntegrationSafetyNote(result);

  // Generate headline and narrative
  const headline = generateIntegrationHeadline(result);
  const narrative = generateIntegrationNarrative(result);

  return {
    integrationScore: result.integrationScore,
    integrationStage: result.integrationStage,
    integrationStageName: stageInfo.name,
    stageDescription: stageInfo.description,
    stageColor: stageInfo.color,
    headline,
    narrative,
    pillarSummaries,
    strongestPillar,
    priorityPillar,
    balance,
    recommendations,
    safetyNote,
  };
}

function generatePillarSummary(result: PillarAssessmentResult): string {
  const stage = result.overallStage;
  const name = result.pillarName.toLowerCase();

  if (stage === 'collapse') {
    return `Your ${name} dimension is in a challenging place and would benefit from focused attention.`;
  } else if (stage === 'regulation') {
    return `Your ${name} dimension is building foundations. Basic stability practices would help.`;
  } else if (stage === 'integration') {
    return `Your ${name} dimension is in active development. Good territory for deeper work.`;
  } else if (stage === 'embodiment') {
    return `Your ${name} dimension is well-developed. Focus on sustaining what's working.`;
  } else {
    return `Your ${name} dimension is strong. This can be a resource for other areas.`;
  }
}

function generateIntegrationHeadline(result: IntegrationAssessmentResult): string {
  const stage = result.integrationStage;
  const priorityName = PILLAR_INFO[result.priorityPillar].name;

  const headlines: Record<DevelopmentStage, string> = {
    collapse: `You're in a difficult place. Support is available.`,
    regulation: `You're building foundations. ${priorityName} is calling for attention.`,
    integration: `You're in the transformation zone. ${priorityName} is your growing edge.`,
    embodiment: `You're learning to live what you know. Keep deepening.`,
    optimization: `Strong foundations across the board. What's next for you?`,
  };

  return headlines[stage];
}

function generateIntegrationNarrative(result: IntegrationAssessmentResult): string {
  const stage = result.integrationStage;
  const stageInfo = STAGE_INFO[stage];

  let narrative = stageInfo.description + '\n\n';

  // Add balance context
  if (result.pillarBalance.isBalanced) {
    narrative += 'Your development is relatively balanced across all four pillars, which provides a stable foundation for continued growth. ';
  } else {
    narrative += `There's some variation in your development across pillars. `;
    narrative += `${PILLAR_INFO[result.strongestPillar].name} shows particular strength, `;
    narrative += `while ${PILLAR_INFO[result.priorityPillar].name} offers the most opportunity for growth. `;
  }

  // Add stage-specific guidance
  narrative += '\n\n';
  if (stage === 'collapse' || stage === 'regulation') {
    narrative += 'Right now, the focus should be on stabilization and building capacity. Everything else can wait until the foundation is solid.';
  } else if (stage === 'integration') {
    narrative += 'This is where the real work of transformation happens. Stay engaged with the process and trust that change is happening, even when it doesn\'t feel that way.';
  } else {
    narrative += 'Continue tending what\'s working while staying curious about growing edges. Consider how you might share what you\'ve learned with others.';
  }

  return narrative;
}

function generateIntegrationRecommendations(
  result: IntegrationAssessmentResult
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const stage = result.integrationStage;
  const priorityPillar = result.priorityPillar;

  // Primary recommendation based on priority pillar
  recommendations.push({
    type: 'course',
    title: `${PILLAR_INFO[priorityPillar].name} Development`,
    description: `Focus on building your ${PILLAR_INFO[priorityPillar].name.toLowerCase()} pillar for balanced growth.`,
    priority: 'primary',
    pillar: priorityPillar,
  });

  // Stage-based recommendation
  if (stage === 'collapse' || stage === 'regulation') {
    recommendations.push({
      type: 'practice',
      title: 'Daily Grounding Practice',
      description: 'Simple practices to build stability and regulation capacity.',
      priority: 'primary',
    });
  } else if (stage === 'integration') {
    recommendations.push({
      type: 'article',
      title: 'Understanding Your Patterns',
      description: 'Learn to recognize and work with your recurring patterns.',
      priority: 'secondary',
    });
  }

  // Balance recommendation
  if (!result.pillarBalance.isBalanced) {
    recommendations.push({
      type: 'action',
      title: 'Balance Your Development',
      description: result.pillarBalance.recommendations[0] || 'Consider focusing on less-developed areas.',
      priority: 'secondary',
    });
  }

  return recommendations;
}

function generateSafetyNote(
  score: number,
  stage: DevelopmentStage
): SafetyNote | undefined {
  if (score <= 20 || stage === 'collapse') {
    return {
      message: 'Based on your responses, you may benefit from professional support. This platform can complement but not replace the care of a qualified mental health professional.',
      severity: 'urgent',
      resources: [
        'Consider reaching out to a therapist or counselor',
        'If in crisis, contact a crisis helpline in your area',
      ],
    };
  }

  if (score <= 35) {
    return {
      message: 'Some areas of your assessment indicate significant challenge. Please be gentle with yourself and consider seeking support.',
      severity: 'moderate',
      resources: [
        'Talking to a trusted friend or professional could help',
        'Focus on stabilization before deep work',
      ],
    };
  }

  return undefined;
}

function generateIntegrationSafetyNote(
  result: IntegrationAssessmentResult
): SafetyNote | undefined {
  // Check for critical flags
  if (result.criticalFlags.length > 0) {
    const hasUrgent = result.criticalFlags.some(f => f.severity === 'high');

    if (hasUrgent) {
      return {
        message: 'Based on your responses, some areas indicate significant difficulty. Please consider reaching out for professional support.',
        severity: 'urgent',
        resources: [
          'Consider reaching out to a therapist or counselor',
          'If in crisis, contact a crisis helpline in your area',
        ],
      };
    }

    return {
      message: 'Some areas of your assessment indicate challenge. Please be gentle with yourself.',
      severity: 'moderate',
      resources: [
        'Focus on stabilization before deep work',
        'Consider professional support if needed',
      ],
    };
  }

  // Check overall score
  return generateSafetyNote(result.integrationScore, result.integrationStage);
}
