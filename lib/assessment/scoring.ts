/**
 * ASSESSMENT SCORING SYSTEM
 *
 * Calculates scores at multiple levels:
 * - Facet scores (most granular)
 * - Dimension scores (aggregate of facets)
 * - Pillar scores (aggregate of dimensions)
 * - Integration score (aggregate of pillars)
 *
 * All scores are normalized to 0-100 scale.
 */

import type {
  Question,
  Answer,
  PillarId,
  DimensionScore,
  FacetScore,
  PillarScore,
  DevelopmentStage,
  PillarAssessmentResult,
  IntegrationAssessmentResult,
} from './types';
import {
  ASSESSMENT_FRAMEWORK,
  getStageForScore,
  getPillarById,
} from './framework';
import {
  getQuestionsForPillar,
  getQuestionsForDimension,
  getQuestionsForFacet,
  getQuestionById,
} from './questions';

// =============================================================================
// SCORE CALCULATION HELPERS
// =============================================================================

/**
 * Normalizes a raw score to 0-100 scale
 */
function normalizeScore(
  rawScore: number,
  minPossible: number,
  maxPossible: number
): number {
  if (maxPossible === minPossible) return 50;
  const normalized = ((rawScore - minPossible) / (maxPossible - minPossible)) * 100;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}

/**
 * Gets the numeric value from an answer based on question type
 */
function getAnswerValue(question: Question, answer: Answer): number {
  const value = answer.value;

  if (typeof value === 'number') {
    return value;
  }

  // For frequency questions, map string to number
  if (question.type === 'frequency' && typeof value === 'string') {
    const options = question.options;
    const index = options.indexOf(value);
    // Return 1-based index (1 = lowest, 5 = highest for 5-point scale)
    return index + 1;
  }

  // For agreement questions without explicit value
  if (question.type === 'agreement' && typeof value === 'number') {
    return value;
  }

  // Default fallback
  return 0;
}

/**
 * Gets min/max possible values for a question
 */
function getQuestionRange(question: Question): { min: number; max: number } {
  switch (question.type) {
    case 'likert':
      return { min: 1, max: question.scale };
    case 'frequency':
      return { min: 1, max: question.options.length };
    case 'agreement':
      return { min: 1, max: question.scale };
    case 'intensity':
      return { min: 0, max: 10 };
    case 'slider':
      return { min: question.min, max: question.max };
    default:
      return { min: 0, max: 100 };
  }
}

/**
 * Calculates adjusted score accounting for reverse-scored items
 */
function calculateAdjustedScore(
  question: Question,
  answer: Answer
): number {
  const value = getAnswerValue(question, answer);
  const { min, max } = getQuestionRange(question);

  if ('reverseScored' in question && question.reverseScored) {
    // Reverse the score: if max is 7 and value is 2, return 6
    return max - value + min;
  }

  return value;
}

// =============================================================================
// FACET SCORING
// =============================================================================

/**
 * Calculates the score for a specific facet
 */
export function calculateFacetScore(
  pillarId: PillarId,
  dimensionId: string,
  facetId: string,
  answers: Record<string, Answer>
): FacetScore {
  const questions = getQuestionsForFacet(pillarId, dimensionId, facetId);

  if (questions.length === 0) {
    return {
      facetId,
      facetName: facetId,
      score: 0,
      questionCount: 0,
    };
  }

  let totalScore = 0;
  let totalMax = 0;
  let totalMin = 0;
  let answeredCount = 0;

  for (const question of questions) {
    const answer = answers[question.id];
    if (!answer) continue;

    const adjustedScore = calculateAdjustedScore(question, answer);
    const { min, max } = getQuestionRange(question);

    totalScore += adjustedScore;
    totalMin += min;
    totalMax += max;
    answeredCount++;
  }

  const normalizedScore = answeredCount > 0
    ? normalizeScore(totalScore, totalMin, totalMax)
    : 0;

  // Get facet name from framework
  const pillar = getPillarById(pillarId);
  const dimension = pillar?.dimensions.find(d => d.id === dimensionId);
  const facet = dimension?.facets.find(f => f.id === facetId);

  return {
    facetId,
    facetName: facet?.name || facetId,
    score: normalizedScore,
    questionCount: answeredCount,
  };
}

// =============================================================================
// DIMENSION SCORING
// =============================================================================

/**
 * Calculates the score for a specific dimension
 */
export function calculateDimensionScore(
  pillarId: PillarId,
  dimensionId: string,
  answers: Record<string, Answer>
): DimensionScore {
  const pillar = getPillarById(pillarId);
  const dimension = pillar?.dimensions.find(d => d.id === dimensionId);

  if (!dimension) {
    return {
      dimensionId,
      dimensionName: dimensionId,
      score: 0,
      stage: 'regulation',
      facetScores: [],
      questionCount: 0,
      confidence: 0,
    };
  }

  // Calculate facet scores
  const facetScores: FacetScore[] = dimension.facets.map(facet =>
    calculateFacetScore(pillarId, dimensionId, facet.id, answers)
  );

  // Dimension score is weighted average of facet scores
  const totalQuestions = facetScores.reduce((sum, f) => sum + f.questionCount, 0);

  if (totalQuestions === 0) {
    return {
      dimensionId,
      dimensionName: dimension.name,
      score: 0,
      stage: 'regulation',
      facetScores,
      questionCount: 0,
      confidence: 0,
    };
  }

  // Weight by question count
  const weightedScore = facetScores.reduce(
    (sum, f) => sum + f.score * f.questionCount,
    0
  ) / totalQuestions;

  const expectedQuestions = getQuestionsForDimension(pillarId, dimensionId).length;
  const confidence = expectedQuestions > 0 ? totalQuestions / expectedQuestions : 0;

  const stage = getStageForScore(weightedScore);

  return {
    dimensionId,
    dimensionName: dimension.name,
    score: Math.round(weightedScore),
    stage: stage.id,
    facetScores,
    questionCount: totalQuestions,
    confidence,
  };
}

// =============================================================================
// PILLAR SCORING
// =============================================================================

/**
 * Calculates the score for an entire pillar
 */
export function calculatePillarScore(
  pillarId: PillarId,
  answers: Record<string, Answer>
): PillarScore {
  const pillar = getPillarById(pillarId);

  if (!pillar) {
    return {
      pillarId,
      pillarName: pillarId,
      score: 0,
      stage: 'regulation',
      dimensionScores: [],
      strengths: [],
      growthAreas: [],
      totalQuestions: 0,
      answeredQuestions: 0,
    };
  }

  // Calculate all dimension scores
  const dimensionScores: DimensionScore[] = pillar.dimensions.map(dim =>
    calculateDimensionScore(pillarId, dim.id, answers)
  );

  // Calculate overall pillar score (weighted average by question count)
  const totalQuestions = dimensionScores.reduce((sum, d) => sum + d.questionCount, 0);
  const expectedQuestions = getQuestionsForPillar(pillarId).length;

  let pillarScore = 0;
  if (totalQuestions > 0) {
    pillarScore = dimensionScores.reduce(
      (sum, d) => sum + d.score * d.questionCount,
      0
    ) / totalQuestions;
  }

  // Identify strengths and growth areas
  const sortedDimensions = [...dimensionScores]
    .filter(d => d.questionCount > 0)
    .sort((a, b) => b.score - a.score);

  const strengths = sortedDimensions.slice(0, 3);
  const growthAreas = sortedDimensions.slice(-3).reverse();

  const stage = getStageForScore(pillarScore);

  return {
    pillarId,
    pillarName: pillar.name,
    score: Math.round(pillarScore),
    stage: stage.id,
    dimensionScores,
    strengths,
    growthAreas,
    totalQuestions: expectedQuestions,
    answeredQuestions: totalQuestions,
  };
}

// =============================================================================
// PILLAR ASSESSMENT RESULT
// =============================================================================

/**
 * Generates complete results for a single pillar assessment
 */
export function generatePillarResult(
  userId: string,
  pillarId: PillarId,
  answers: Record<string, Answer>,
  startTime: Date
): PillarAssessmentResult {
  const pillarScore = calculatePillarScore(pillarId, answers);
  const stageInfo = getStageForScore(pillarScore.score);

  // Generate insights for strengths
  const topStrengths = pillarScore.strengths.slice(0, 2).map(dim => ({
    dimension: dim,
    insight: generateStrengthInsight(dim),
  }));

  // Generate recommendations for growth areas
  const primaryGrowthAreas = pillarScore.growthAreas.slice(0, 2).map(dim => ({
    dimension: dim,
    recommendation: generateGrowthRecommendation(dim),
  }));

  // Extract open responses
  const openResponses: Record<string, string> = {};
  for (const [questionId, answer] of Object.entries(answers)) {
    const question = getQuestionById(questionId);
    if (question?.type === 'open' && typeof answer.value === 'string') {
      openResponses[questionId] = answer.value;
    }
  }

  const completedAt = new Date();
  const durationMinutes = Math.round(
    (completedAt.getTime() - startTime.getTime()) / 60000
  );

  return {
    userId,
    pillarId,
    pillarName: pillarScore.pillarName,
    completedAt,
    version: ASSESSMENT_FRAMEWORK.version,
    overallScore: pillarScore.score,
    overallStage: pillarScore.stage,
    stageInfo,
    dimensionScores: pillarScore.dimensionScores,
    topStrengths,
    primaryGrowthAreas,
    openResponses,
    durationMinutes,
    questionsAnswered: pillarScore.answeredQuestions,
    questionsTotal: pillarScore.totalQuestions,
  };
}

// =============================================================================
// FULL INTEGRATION ASSESSMENT RESULT
// =============================================================================

/**
 * Generates complete results for the full integration assessment
 */
export function generateIntegrationResult(
  userId: string,
  pillarResults: PillarAssessmentResult[]
): IntegrationAssessmentResult {
  // Calculate overall integration score
  const integrationScore = Math.round(
    pillarResults.reduce((sum, p) => sum + p.overallScore, 0) / pillarResults.length
  );

  const integrationStage = getStageForScore(integrationScore).id;

  // Determine strongest and priority pillars
  const sortedPillars = [...pillarResults].sort(
    (a, b) => b.overallScore - a.overallScore
  );
  const strongestPillar = sortedPillars[0]?.pillarId || 'mind';
  const priorityPillar = sortedPillars[sortedPillars.length - 1]?.pillarId || 'mind';

  // Analyze pillar balance
  const scores = pillarResults.map(p => p.overallScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const variance = maxScore - minScore;
  const isBalanced = variance < 20;

  const pillarBalance = {
    isBalanced,
    imbalanceDescription: isBalanced
      ? undefined
      : `There is a ${variance} point difference between your strongest and weakest pillars.`,
    recommendations: isBalanced
      ? ['Your development is well-balanced across all pillars.']
      : [
          `Consider focusing on ${priorityPillar} to create more balance.`,
          `Your strength in ${strongestPillar} can support development in other areas.`,
        ],
  };

  // Stage distribution
  const stageGroups = new Map<DevelopmentStage, PillarId[]>();
  for (const result of pillarResults) {
    const existing = stageGroups.get(result.overallStage) || [];
    existing.push(result.pillarId);
    stageGroups.set(result.overallStage, existing);
  }

  const stageDistribution = Array.from(stageGroups.entries()).map(([stage, pillars]) => ({
    stage,
    pillars,
  }));

  // Check for critical flags
  const criticalFlags: IntegrationAssessmentResult['criticalFlags'] = [];

  for (const result of pillarResults) {
    if (result.overallScore <= 20) {
      criticalFlags.push({
        type: 'collapse',
        severity: 'high',
        description: `${result.pillarName} pillar is in collapse state`,
        recommendation: `Immediate attention needed for ${result.pillarName}. Consider professional support.`,
      });
    } else if (result.overallScore <= 30) {
      criticalFlags.push({
        type: 'struggling',
        severity: 'moderate',
        description: `${result.pillarName} pillar needs significant attention`,
        recommendation: `Focus on building foundational stability in ${result.pillarName}.`,
      });
    }
  }

  return {
    userId,
    completedAt: new Date(),
    version: ASSESSMENT_FRAMEWORK.version,
    integrationScore,
    integrationStage,
    pillarResults,
    strongestPillar,
    priorityPillar,
    pillarBalance,
    stageDistribution,
    criticalFlags,
    totalDurationMinutes: pillarResults.reduce((sum, p) => sum + p.durationMinutes, 0),
    totalQuestionsAnswered: pillarResults.reduce((sum, p) => sum + p.questionsAnswered, 0),
    totalQuestions: pillarResults.reduce((sum, p) => sum + p.questionsTotal, 0),
  };
}

// =============================================================================
// INSIGHT GENERATION HELPERS
// =============================================================================

function generateStrengthInsight(dimension: DimensionScore): string {
  const stage = dimension.stage;

  if (stage === 'optimization' || stage === 'embodiment') {
    return `Your ${dimension.dimensionName} is well-developed. This is a foundation you can build on and share with others.`;
  } else if (stage === 'integration') {
    return `You have solid development in ${dimension.dimensionName}. Continue building on this strength.`;
  } else {
    return `${dimension.dimensionName} shows relative strength compared to other areas.`;
  }
}

function generateGrowthRecommendation(dimension: DimensionScore): string {
  const stage = dimension.stage;

  if (stage === 'collapse') {
    return `${dimension.dimensionName} needs immediate attention. Start with small, consistent steps to build stability.`;
  } else if (stage === 'regulation') {
    return `Focus on developing foundational skills in ${dimension.dimensionName}. Our courses can help.`;
  } else if (stage === 'integration') {
    return `Continue developing ${dimension.dimensionName}. You're making good progress.`;
  } else {
    return `Fine-tune your ${dimension.dimensionName} for continued growth.`;
  }
}
