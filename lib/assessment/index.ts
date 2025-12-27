/**
 * Integration Assessment System
 *
 * A professional, research-grounded assessment for determining:
 * - Position on the Development Spectrum (Collapse → Optimization)
 * - Current state across Four Pillars (Mind, Body, Soul, Relationships)
 * - Detailed scores across 30 dimensions and 75+ facets
 *
 * Structure:
 * - 4 separate pillar assessments (can be taken individually)
 * - ~55 questions per pillar
 * - ~220 questions total for full integration assessment
 * - Estimated 15-20 minutes per pillar, ~70 minutes for all
 *
 * Research Basis:
 * - Attachment Theory (Bowlby, Ainsworth)
 * - Polyvagal Theory (Porges)
 * - ACT - Acceptance and Commitment Therapy
 * - DBT - Dialectical Behavior Therapy
 * - Self-Determination Theory
 * - Emotional Intelligence (Goleman, Mayer-Salovey)
 * - Jungian Psychology (Shadow Work)
 * - Existential Psychology (Yalom)
 * - And more - see framework.ts for full research citations
 */

// =============================================================================
// FRAMEWORK - Core definitions and research basis
// =============================================================================

export {
  ASSESSMENT_FRAMEWORK,
  DEVELOPMENT_STAGES,
  MIND_PILLAR,
  BODY_PILLAR,
  SOUL_PILLAR,
  RELATIONSHIPS_PILLAR,
  FRAMEWORK_STATS,
  getPillarById,
  getDimensionById,
  getStageForScore,
  getTotalQuestions,
  getTotalDimensions,
  getTotalFacets,
} from './framework';

export type {
  Pillar,
  Dimension,
  Facet,
  DevelopmentStage,
  StageInfo,
} from './framework';

// =============================================================================
// TYPES - Question, Answer, Score, and Result types
// =============================================================================

export type {
  PillarId,
  PillarConfig,
  Question,
  QuestionType,
  LikertQuestion,
  FrequencyQuestion,
  AgreementQuestion,
  IntensityQuestion,
  SliderQuestion,
  OpenQuestion,
  MultiSelectQuestion,
  ScaleAnchors,
  Answer,
  PillarAssessmentAnswers,
  FullAssessmentAnswers,
  FacetScore,
  DimensionScore,
  PillarScore,
  SpectrumPlacement,
  PillarProgress,
  AssessmentProgress,
  PillarAssessmentResult,
  IntegrationAssessmentResult,
  SafetyCheck,
  AssessmentConfig,
} from './types';

export {
  SAFETY_QUESTION_IDS,
  SAFETY_THRESHOLDS,
  DEFAULT_ASSESSMENT_CONFIG,
} from './types';

// =============================================================================
// QUESTIONS - All pillar questions
// =============================================================================

export {
  MIND_QUESTIONS,
  MIND_QUESTION_COUNT,
  BODY_QUESTIONS,
  BODY_QUESTION_COUNT,
  SOUL_QUESTIONS,
  SOUL_QUESTION_COUNT,
  RELATIONSHIPS_QUESTIONS,
  RELATIONSHIPS_QUESTION_COUNT,
  ALL_QUESTIONS,
  QUESTIONS_BY_PILLAR,
  QUESTION_COUNTS,
  TOTAL_QUESTION_COUNT,
  ASSESSMENT_STATS,
  getQuestionsForPillar,
  getQuestionsForDimension,
  getQuestionsForFacet,
  getQuestionById,
} from './questions';

// =============================================================================
// SCORING - Calculate scores at all levels
// =============================================================================

export {
  calculateFacetScore,
  calculateDimensionScore,
  calculatePillarScore,
  generatePillarResult,
  generateIntegrationResult,
} from './scoring';

// =============================================================================
// PORTRAIT - Human-readable results presentation
// =============================================================================

export {
  generatePillarPortrait,
  generateIntegrationPortrait,
} from './portrait';

export type {
  PillarPortrait,
  DimensionPortrait,
  IntegrationPortrait,
  Recommendation,
  SafetyNote,
} from './portrait';

// =============================================================================
// CONTENT MAPPING - Maps content to dimensions
// =============================================================================

export {
  DIMENSION_CONTENT_MAP,
  getContentForDimension,
  getDimensionsForContent,
  getPointsForContentType,
  getAllContentForPillar,
  isContentMapped,
} from './content-mapping';

// =============================================================================
// DIMENSION HEALTH - Two-layer health system (Verified + Estimated)
// =============================================================================

export {
  calculateFreshness,
  getFreshnessDecayFactor,
  calculateEstimatedScore,
  getActivityContributions,
  shouldPromptReassessment,
  generateDimensionSummary,
  generatePillarSummary,
  getStageFromScore,
  getStageDisplayInfo,
} from './dimension-health';

export type {
  VerifiedDimensionScore,
  EstimatedDimensionScore,
  ScoreContributor,
  DimensionHealthSummary,
  PillarHealthSummary,
  ReassessmentPrompt,
} from './dimension-health';

// =============================================================================
// REASSESSMENT - Dimension-specific reassessments
// =============================================================================

export {
  getReassessmentQuestions,
  getPillarReassessmentQuestions,
  scoreReassessment,
  interpretReassessment,
  scorePillarAssessment,
  getDimensionsNeedingReassessment,
} from './reassessment';

export type {
  ReassessmentQuestions,
  ReassessmentResult,
  ReassessmentComparison,
} from './reassessment';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import type { PillarId } from './types';
import { QUESTIONS_BY_PILLAR, QUESTION_COUNTS, TOTAL_QUESTION_COUNT } from './questions';

/**
 * Get questions for a specific pillar
 */
export function getPillarQuestions(pillarId: PillarId) {
  return QUESTIONS_BY_PILLAR[pillarId];
}

/**
 * Get question count for a specific pillar
 */
export function getPillarQuestionCount(pillarId: PillarId): number {
  return QUESTION_COUNTS[pillarId];
}

/**
 * Get total question count across all pillars
 */
export function getTotalQuestionCount(): number {
  return TOTAL_QUESTION_COUNT;
}

/**
 * Estimate completion time for a pillar in minutes
 */
export function estimatePillarTime(pillarId: PillarId): { min: number; max: number } {
  const count = QUESTION_COUNTS[pillarId];
  // Estimate 15-25 seconds per question
  const minMinutes = Math.ceil((count * 15) / 60);
  const maxMinutes = Math.ceil((count * 25) / 60);
  return { min: minMinutes, max: maxMinutes };
}

/**
 * Estimate completion time for full assessment
 */
export function estimateFullAssessmentTime(): { min: number; max: number } {
  const minMinutes = Math.ceil((TOTAL_QUESTION_COUNT * 15) / 60);
  const maxMinutes = Math.ceil((TOTAL_QUESTION_COUNT * 25) / 60);
  return { min: minMinutes, max: maxMinutes };
}

/**
 * Get pillar order for assessment
 */
export function getPillarOrder(): PillarId[] {
  return ['mind', 'body', 'soul', 'relationships'];
}
