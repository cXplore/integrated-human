/**
 * DIMENSION REASSESSMENT
 *
 * Handles dimension-specific reassessments:
 * - Select relevant questions for a specific dimension
 * - Score only that dimension
 * - Update verified score
 *
 * User can reassess anytime they feel ready - no gates.
 */

import type {
  Question,
  Answer,
  PillarId,
  DimensionScore,
  FacetScore,
  DevelopmentStage,
} from './types';
import { getQuestionsForDimension, getQuestionById } from './questions';
import { getDimensionById, getStageForScore } from './framework';

// =============================================================================
// TYPES
// =============================================================================

export interface ReassessmentQuestions {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;
  questions: Question[];
  estimatedMinutes: number;
}

export interface ReassessmentResult {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;

  // Scores
  newScore: number;
  newStage: DevelopmentStage;
  previousScore?: number;
  previousStage?: DevelopmentStage;
  scoreChange?: number;

  // Facet breakdown
  facetScores: FacetScore[];

  // Meta
  questionsAnswered: number;
  completedAt: Date;
}

export interface ReassessmentComparison {
  dimensionId: string;
  dimensionName: string;
  previousScore: number;
  previousStage: DevelopmentStage;
  newScore: number;
  newStage: DevelopmentStage;
  scoreChange: number;
  estimatedScore?: number;
  estimatedAccuracy?: number; // How close was estimate to actual?
  interpretation: string;
}

// =============================================================================
// GET REASSESSMENT QUESTIONS
// =============================================================================

/**
 * Get questions for reassessing a specific dimension
 */
export function getReassessmentQuestions(
  pillarId: PillarId,
  dimensionId: string
): ReassessmentQuestions | null {
  const dimension = getDimensionById(pillarId, dimensionId);
  if (!dimension) {
    return null;
  }

  const questions = getQuestionsForDimension(pillarId, dimensionId);
  if (questions.length === 0) {
    return null;
  }

  // Estimate time: ~20 seconds per question
  const estimatedMinutes = Math.ceil(questions.length * 20 / 60);

  return {
    pillarId,
    dimensionId,
    dimensionName: dimension.name,
    questions,
    estimatedMinutes,
  };
}

/**
 * Get questions for reassessing multiple dimensions (e.g., whole pillar)
 */
export function getPillarReassessmentQuestions(
  pillarId: PillarId
): ReassessmentQuestions[] {
  const { getPillarById } = require('./framework');
  const pillar = getPillarById(pillarId);

  if (!pillar) {
    return [];
  }

  return pillar.dimensions.map((dim: { id: string }) =>
    getReassessmentQuestions(pillarId, dim.id)
  ).filter((q: ReassessmentQuestions | null): q is ReassessmentQuestions => q !== null);
}

// =============================================================================
// SCORE REASSESSMENT
// =============================================================================

/**
 * Calculate score for a dimension reassessment
 */
export function scoreReassessment(
  pillarId: PillarId,
  dimensionId: string,
  answers: Record<string, Answer>,
  previousScore?: number,
  previousStage?: DevelopmentStage
): ReassessmentResult | null {
  const dimension = getDimensionById(pillarId, dimensionId);
  if (!dimension) {
    return null;
  }

  // Calculate facet scores
  const facetScores: FacetScore[] = [];

  for (const facet of dimension.facets) {
    const facetQuestions = getQuestionsForDimension(pillarId, dimensionId)
      .filter(q => q.facetId === facet.id);

    let totalScore = 0;
    let totalMax = 0;
    let answeredCount = 0;

    for (const question of facetQuestions) {
      const answer = answers[question.id];
      if (!answer) continue;

      const score = getAnswerScore(question, answer);
      const { min, max } = getQuestionRange(question);

      totalScore += score;
      totalMax += max - min;
      answeredCount++;
    }

    const normalizedScore = totalMax > 0
      ? Math.round((totalScore / totalMax) * 100)
      : 0;

    facetScores.push({
      facetId: facet.id,
      facetName: facet.name,
      score: normalizedScore,
      questionCount: answeredCount,
    });
  }

  // Calculate overall dimension score (average of facets)
  const validFacets = facetScores.filter(f => f.questionCount > 0);
  const newScore = validFacets.length > 0
    ? Math.round(validFacets.reduce((sum, f) => sum + f.score, 0) / validFacets.length)
    : 0;

  const newStage = getStageForScore(newScore).id;
  const scoreChange = previousScore !== undefined ? newScore - previousScore : undefined;

  return {
    pillarId,
    dimensionId,
    dimensionName: dimension.name,
    newScore,
    newStage,
    previousScore,
    previousStage,
    scoreChange,
    facetScores,
    questionsAnswered: Object.keys(answers).length,
    completedAt: new Date(),
  };
}

// =============================================================================
// COMPARISON & INTERPRETATION
// =============================================================================

/**
 * Generate interpretation of reassessment results
 */
export function interpretReassessment(
  result: ReassessmentResult,
  estimatedScore?: number
): ReassessmentComparison {
  const { previousScore, previousStage, newScore, newStage, scoreChange } = result;

  // Calculate how accurate the estimate was
  let estimatedAccuracy: number | undefined;
  if (estimatedScore !== undefined) {
    const estimateDelta = Math.abs(estimatedScore - newScore);
    estimatedAccuracy = Math.max(0, 100 - estimateDelta * 2); // Rough accuracy metric
  }

  // Generate interpretation
  let interpretation: string;

  if (previousScore === undefined) {
    // First assessment
    interpretation = getFirstAssessmentInterpretation(newScore, newStage);
  } else if (scoreChange === undefined || scoreChange === 0) {
    interpretation = 'Your score is stable. Continue with your current practices.';
  } else if (scoreChange > 0) {
    interpretation = getGrowthInterpretation(scoreChange, previousStage!, newStage);
  } else {
    interpretation = getDeclineInterpretation(scoreChange, previousStage!, newStage);
  }

  return {
    dimensionId: result.dimensionId,
    dimensionName: result.dimensionName,
    previousScore: previousScore ?? newScore,
    previousStage: previousStage ?? newStage,
    newScore,
    newStage,
    scoreChange: scoreChange ?? 0,
    estimatedScore,
    estimatedAccuracy,
    interpretation,
  };
}

function getFirstAssessmentInterpretation(
  score: number,
  stage: DevelopmentStage
): string {
  switch (stage) {
    case 'collapse':
      return 'This area needs attention. Start with small, supportive steps.';
    case 'regulation':
      return 'You have a foundation here. Focus on building stability.';
    case 'integration':
      return 'Good development in this area. Continue integrating.';
    case 'embodiment':
      return 'This is a strength. Your practice is becoming natural.';
    case 'optimization':
      return 'Well-developed. Consider how to refine further or help others.';
    default:
      return 'Assessment complete.';
  }
}

function getGrowthInterpretation(
  change: number,
  previousStage: DevelopmentStage,
  newStage: DevelopmentStage
): string {
  const stageChanged = previousStage !== newStage;

  if (stageChanged) {
    return `Significant growth! You've moved from ${formatStage(previousStage)} to ${formatStage(newStage)}. Your work is paying off.`;
  } else if (change >= 10) {
    return `Great progress (+${change} points). You're developing well in this area.`;
  } else {
    return `Steady improvement (+${change} points). Keep going!`;
  }
}

function getDeclineInterpretation(
  change: number,
  previousStage: DevelopmentStage,
  newStage: DevelopmentStage
): string {
  const stageChanged = previousStage !== newStage;
  const absChange = Math.abs(change);

  if (stageChanged) {
    return `Your score has shifted from ${formatStage(previousStage)} to ${formatStage(newStage)}. This is normal during challenging times. Be gentle with yourself.`;
  } else if (absChange >= 10) {
    return `Your score has decreased (${change} points). Life circumstances may be affecting this area. Consider what support you need.`;
  } else {
    return `Slight decrease (${change} points). This can fluctuate naturally.`;
  }
}

function formatStage(stage: DevelopmentStage): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getAnswerScore(question: Question, answer: Answer): number {
  let value: number;

  if (typeof answer.value === 'number') {
    value = answer.value;
  } else if (question.type === 'frequency' && typeof answer.value === 'string') {
    const options = question.options;
    value = options.indexOf(answer.value) + 1;
  } else {
    value = 0;
  }

  // Handle reverse scoring
  if ('reverseScored' in question && question.reverseScored) {
    const { min, max } = getQuestionRange(question);
    value = max - value + min;
  }

  return value;
}

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

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Score all dimensions from full pillar assessment
 */
export function scorePillarAssessment(
  pillarId: PillarId,
  answers: Record<string, Answer>
): ReassessmentResult[] {
  const { getPillarById } = require('./framework');
  const pillar = getPillarById(pillarId);

  if (!pillar) {
    return [];
  }

  return pillar.dimensions.map((dim: { id: string }) => {
    // Filter answers for this dimension
    const dimensionQuestions = getQuestionsForDimension(pillarId, dim.id);
    const dimensionAnswers: Record<string, Answer> = {};

    for (const q of dimensionQuestions) {
      if (answers[q.id]) {
        dimensionAnswers[q.id] = answers[q.id];
      }
    }

    return scoreReassessment(pillarId, dim.id, dimensionAnswers);
  }).filter((r: ReassessmentResult | null): r is ReassessmentResult => r !== null);
}

/**
 * Get all dimensions needing reassessment for a user
 */
export function getDimensionsNeedingReassessment(
  verifiedScores: Array<{
    pillarId: PillarId;
    dimensionId: string;
    score: number;
    stage: DevelopmentStage;
    verifiedAt: Date;
  }>,
  estimatedScores: Array<{
    pillarId: PillarId;
    dimensionId: string;
    estimatedScore: number;
    confidence: number;
  }>
): ReassessmentComparison[] {
  const { calculateFreshness, shouldPromptReassessment } = require('./dimension-health');
  const results: ReassessmentComparison[] = [];

  for (const verified of verifiedScores) {
    const { freshness, daysOld } = calculateFreshness(verified.verifiedAt);

    const estimated = estimatedScores.find(
      e => e.pillarId === verified.pillarId && e.dimensionId === verified.dimensionId
    );

    const verifiedData = {
      pillarId: verified.pillarId,
      dimensionId: verified.dimensionId,
      dimensionName: verified.dimensionId, // Would look up
      score: verified.score,
      stage: verified.stage,
      verifiedAt: verified.verifiedAt,
      freshness,
      daysOld,
    };

    const estimatedData = estimated ? {
      pillarId: estimated.pillarId,
      dimensionId: estimated.dimensionId,
      dimensionName: estimated.dimensionId,
      estimatedScore: estimated.estimatedScore,
      estimatedStage: getStageForScore(estimated.estimatedScore).id as DevelopmentStage,
      confidence: estimated.confidence,
      contributors: [],
    } : null;

    const prompt = shouldPromptReassessment(verifiedData, estimatedData);

    if (prompt) {
      results.push({
        dimensionId: verified.dimensionId,
        dimensionName: verified.dimensionId,
        previousScore: verified.score,
        previousStage: verified.stage,
        newScore: verified.score,
        newStage: verified.stage,
        scoreChange: 0,
        estimatedScore: estimated?.estimatedScore,
        interpretation: prompt.reason,
      });
    }
  }

  return results;
}
