/**
 * Assessment Questions Index
 *
 * Exports all pillar questions and provides aggregate statistics
 */

import { MIND_QUESTIONS, MIND_QUESTION_COUNT } from './mind';
import { BODY_QUESTIONS, BODY_QUESTION_COUNT } from './body';
import { SOUL_QUESTIONS, SOUL_QUESTION_COUNT } from './soul';
import { RELATIONSHIPS_QUESTIONS, RELATIONSHIPS_QUESTION_COUNT } from './relationships';
import type { Question, PillarId } from '../types';

// Re-export individual pillar questions
export { MIND_QUESTIONS, MIND_QUESTION_COUNT } from './mind';
export { BODY_QUESTIONS, BODY_QUESTION_COUNT } from './body';
export { SOUL_QUESTIONS, SOUL_QUESTION_COUNT } from './soul';
export { RELATIONSHIPS_QUESTIONS, RELATIONSHIPS_QUESTION_COUNT } from './relationships';

// All questions combined
export const ALL_QUESTIONS: Question[] = [
  ...MIND_QUESTIONS,
  ...BODY_QUESTIONS,
  ...SOUL_QUESTIONS,
  ...RELATIONSHIPS_QUESTIONS,
];

// Questions by pillar
export const QUESTIONS_BY_PILLAR: Record<PillarId, Question[]> = {
  mind: MIND_QUESTIONS,
  body: BODY_QUESTIONS,
  soul: SOUL_QUESTIONS,
  relationships: RELATIONSHIPS_QUESTIONS,
};

// Question counts by pillar
export const QUESTION_COUNTS: Record<PillarId, number> = {
  mind: MIND_QUESTION_COUNT,
  body: BODY_QUESTION_COUNT,
  soul: SOUL_QUESTION_COUNT,
  relationships: RELATIONSHIPS_QUESTION_COUNT,
};

// Total question count
export const TOTAL_QUESTION_COUNT =
  MIND_QUESTION_COUNT +
  BODY_QUESTION_COUNT +
  SOUL_QUESTION_COUNT +
  RELATIONSHIPS_QUESTION_COUNT;

// Helper function to get questions for a specific pillar
export function getQuestionsForPillar(pillarId: PillarId): Question[] {
  return QUESTIONS_BY_PILLAR[pillarId];
}

// Helper function to get questions for a specific dimension
export function getQuestionsForDimension(
  pillarId: PillarId,
  dimensionId: string
): Question[] {
  return QUESTIONS_BY_PILLAR[pillarId].filter(
    (q) => q.dimensionId === dimensionId
  );
}

// Helper function to get questions for a specific facet
export function getQuestionsForFacet(
  pillarId: PillarId,
  dimensionId: string,
  facetId: string
): Question[] {
  return QUESTIONS_BY_PILLAR[pillarId].filter(
    (q) => q.dimensionId === dimensionId && q.facetId === facetId
  );
}

// Get question by ID
export function getQuestionById(questionId: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === questionId);
}

// Assessment statistics
export const ASSESSMENT_STATS = {
  totalQuestions: TOTAL_QUESTION_COUNT,
  questionsByPillar: QUESTION_COUNTS,
  estimatedMinutesPerPillar: {
    mind: Math.ceil(MIND_QUESTION_COUNT * 0.33),      // ~20 seconds per question
    body: Math.ceil(BODY_QUESTION_COUNT * 0.33),
    soul: Math.ceil(SOUL_QUESTION_COUNT * 0.33),
    relationships: Math.ceil(RELATIONSHIPS_QUESTION_COUNT * 0.33),
  },
  totalEstimatedMinutes: Math.ceil(TOTAL_QUESTION_COUNT * 0.33),
};
