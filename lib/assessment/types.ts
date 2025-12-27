/**
 * Integration Assessment System - Types
 *
 * A professional, research-grounded assessment system measuring:
 * 1. Position on the Development Spectrum (Collapse → Optimization)
 * 2. State across 4 pillars, 30 dimensions, and 75+ facets
 *
 * Structure:
 * - 4 separate assessments (one per pillar)
 * - Each pillar has 7-9 dimensions
 * - Each dimension has 2-3 facets
 * - ~55 questions per pillar
 */

import type {
  Pillar,
  Dimension,
  Facet,
  DevelopmentStage,
  StageInfo,
} from './framework';

// Re-export framework types
export type { Pillar as PillarConfig, Dimension, Facet, DevelopmentStage, StageInfo };

// Pillar ID type
export type PillarId = 'mind' | 'body' | 'soul' | 'relationships';

// ============================================================================
// QUESTION TYPES
// ============================================================================

export type QuestionType =
  | 'likert'           // 1-7 scale with anchors
  | 'frequency'        // Never → Always
  | 'agreement'        // Strongly disagree → Strongly agree
  | 'intensity'        // Not at all → Extremely
  | 'slider'           // 0-100 continuous
  | 'open'             // Free text (for AI analysis or context)
  | 'multi-select';    // Select all that apply

export interface ScaleAnchors {
  low: string;        // e.g., "Not at all"
  mid?: string;       // e.g., "Sometimes"
  high: string;       // e.g., "All the time"
}

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

interface BaseQuestion {
  id: string;
  text: string;
  subtext?: string;                    // Additional context or clarification
  pillar: PillarId;                    // Which pillar this belongs to
  dimensionId: string;                 // Which dimension this measures
  facetId?: string;                    // Specific facet (optional, inferred if not set)
  required: boolean;
  sensitive?: boolean;                 // Flag for trauma-related questions
  skipCondition?: string;              // Question ID that must be answered for this to appear
}

export interface LikertQuestion extends BaseQuestion {
  type: 'likert';
  scale: 5 | 7;                        // Scale points
  anchors: ScaleAnchors;
  reverseScored?: boolean;             // Higher answers = lower score
}

export interface FrequencyQuestion extends BaseQuestion {
  type: 'frequency';
  options: string[];                   // e.g., ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
  reverseScored?: boolean;
}

export interface AgreementQuestion extends BaseQuestion {
  type: 'agreement';
  scale: 5 | 7;
  reverseScored?: boolean;
}

export interface IntensityQuestion extends BaseQuestion {
  type: 'intensity';
  scale: 10;                           // Always 0-10 for intensity
  anchors: ScaleAnchors;
  reverseScored?: boolean;
}

export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  min: number;
  max: number;
  step?: number;
  anchors: ScaleAnchors;
  reverseScored?: boolean;
}

export interface OpenQuestion extends BaseQuestion {
  type: 'open';
  maxLength?: number;
  placeholder?: string;
  forContext?: boolean;                // True if for context only, not scored
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: 'multi-select';
  options: { value: string; label: string; weight?: number }[];
  maxSelections?: number;
}

export type Question =
  | LikertQuestion
  | FrequencyQuestion
  | AgreementQuestion
  | IntensityQuestion
  | SliderQuestion
  | OpenQuestion
  | MultiSelectQuestion;

// ============================================================================
// ANSWERS
// ============================================================================

export interface Answer {
  questionId: string;
  value: number | string | string[];   // Numeric for scales, string for open, array for multi-select
  timestamp: Date;
  duration?: number;                   // Time spent on question in seconds
}

export interface PillarAssessmentAnswers {
  userId: string;
  pillarId: PillarId;
  answers: Record<string, Answer>;
  startedAt: Date;
  completedAt?: Date;
}

export interface FullAssessmentAnswers {
  userId: string;
  pillarsCompleted: PillarId[];
  answers: Record<string, Answer>;     // All answers across pillars
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// SCORING
// ============================================================================

export interface FacetScore {
  facetId: string;
  facetName: string;
  score: number;                       // 0-100
  questionCount: number;
}

export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  score: number;                       // 0-100
  stage: DevelopmentStage;
  facetScores: FacetScore[];
  questionCount: number;
  confidence: number;                  // 0-1 based on answered questions
}

export interface PillarScore {
  pillarId: PillarId;
  pillarName: string;
  score: number;                       // 0-100
  stage: DevelopmentStage;
  dimensionScores: DimensionScore[];
  strengths: DimensionScore[];         // Top 2-3 dimensions
  growthAreas: DimensionScore[];       // Bottom 2-3 dimensions
  totalQuestions: number;
  answeredQuestions: number;
}

export interface SpectrumPlacement {
  stage: DevelopmentStage;
  score: number;                       // 0-100
  confidence: number;                  // 0-1
  stageBreakdown: {
    stage: DevelopmentStage;
    percentage: number;
  }[];
}

// ============================================================================
// PILLAR ASSESSMENT RESULT
// ============================================================================

export interface PillarAssessmentResult {
  userId: string;
  pillarId: PillarId;
  pillarName: string;
  completedAt: Date;
  version: string;

  // Core scores
  overallScore: number;
  overallStage: DevelopmentStage;
  stageInfo: StageInfo;

  // Detailed breakdown
  dimensionScores: DimensionScore[];

  // Insights
  topStrengths: {
    dimension: DimensionScore;
    insight: string;
  }[];

  primaryGrowthAreas: {
    dimension: DimensionScore;
    recommendation: string;
  }[];

  // Open responses for context
  openResponses: Record<string, string>;

  // Metadata
  durationMinutes: number;
  questionsAnswered: number;
  questionsTotal: number;
}

// ============================================================================
// FULL INTEGRATION ASSESSMENT RESULT
// ============================================================================

export interface IntegrationAssessmentResult {
  userId: string;
  completedAt: Date;
  version: string;

  // Overall integration score
  integrationScore: number;            // 0-100
  integrationStage: DevelopmentStage;

  // Pillar results
  pillarResults: PillarAssessmentResult[];

  // Cross-pillar insights
  strongestPillar: PillarId;
  priorityPillar: PillarId;            // Where most growth is needed

  // Balance analysis
  pillarBalance: {
    isBalanced: boolean;
    imbalanceDescription?: string;
    recommendations: string[];
  };

  // Stage distribution
  stageDistribution: {
    stage: DevelopmentStage;
    pillars: PillarId[];
  }[];

  // Critical concerns
  criticalFlags: {
    type: string;
    severity: 'low' | 'moderate' | 'high';
    description: string;
    recommendation: string;
  }[];

  // Metadata
  totalDurationMinutes: number;
  totalQuestionsAnswered: number;
  totalQuestions: number;
}

// ============================================================================
// ASSESSMENT PROGRESS
// ============================================================================

export interface PillarProgress {
  pillarId: PillarId;
  status: 'not_started' | 'in_progress' | 'completed';
  questionsAnswered: number;
  questionsTotal: number;
  lastUpdated?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AssessmentProgress {
  userId: string;
  pillarProgress: Record<PillarId, PillarProgress>;
  answers: Record<string, Answer>;
  overallStatus: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  lastUpdated: Date;
}

// ============================================================================
// CRISIS/SAFETY CHECKS
// ============================================================================

export interface SafetyCheck {
  triggered: boolean;
  severity: 'low' | 'moderate' | 'high';
  indicators: string[];
  recommendedAction: string;
}

// Questions that trigger safety checks if answered above threshold
export const SAFETY_QUESTION_IDS = [
  'mind_current_crisis',
  'mind_hopelessness',
  'mind_overwhelm',
  'mind_self_harm_thoughts',
  'mind_unable_to_function',
  'body_severe_neglect',
];

export const SAFETY_THRESHOLDS: Record<string, number> = {
  mind_current_crisis: 8,      // If crisis intensity >= 8
  mind_hopelessness: 8,        // If hopelessness >= 8
  mind_overwhelm: 9,           // If overwhelm >= 9
  mind_self_harm_thoughts: 1,  // Any indication
  mind_unable_to_function: 8,  // If unable to function >= 8
  body_severe_neglect: 8,      // Severe body neglect
};

// ============================================================================
// ASSESSMENT CONFIGURATION
// ============================================================================

export interface AssessmentConfig {
  allowPartialCompletion: boolean;     // Can submit incomplete pillar
  showProgressBar: boolean;
  showDimensionLabels: boolean;        // Show which dimension a question measures
  randomizeQuestionOrder: boolean;
  estimatedMinutesPerPillar: Record<PillarId, number>;
}

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
  allowPartialCompletion: true,
  showProgressBar: true,
  showDimensionLabels: false,
  randomizeQuestionOrder: false,
  estimatedMinutesPerPillar: {
    mind: 18,
    body: 15,
    soul: 18,
    relationships: 18,
  },
};
