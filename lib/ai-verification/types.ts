/**
 * AI VERIFICATION SYSTEM - TYPE DEFINITIONS
 *
 * Types for the AI-powered verification system that makes certificates meaningful
 * by evaluating actual competence rather than just completion.
 */

// =============================================================================
// CORE VERIFICATION TYPES
// =============================================================================

export type VerificationResult = 'pass' | 'needs-depth' | 'try-again';

export type SkillLevel = 'emerging' | 'developing' | 'competent' | 'proficient' | 'masterful';

export interface VerificationScore {
  overall: number; // 0-100
  level: SkillLevel;
  result: VerificationResult;
  feedback: string;
  specificFeedback: string[];
  strengths: string[];
  growthEdges: string[];
}

// =============================================================================
// JOURNAL VERIFICATION
// =============================================================================

export interface JournalQualityCriteria {
  depth: number; // 0-100: How deeply does this explore the topic?
  specificity: number; // 0-100: Are there specific, personal examples?
  selfReflection: number; // 0-100: Does it show genuine self-examination?
  patternRecognition: number; // 0-100: Does it connect to broader patterns?
  emotionalHonesty: number; // 0-100: Is there authentic emotional engagement?
}

export interface JournalVerification extends VerificationScore {
  criteria: JournalQualityCriteria;
  promptsForDeeper: string[]; // Follow-up prompts if needs more depth
  exampleOfGoodEntry?: string; // Anonymous example of what a quality entry looks like
}

// =============================================================================
// PATTERN MAP VERIFICATION
// =============================================================================

export interface PatternMapCriteria {
  patternClarity: number; // 0-100: Is the pattern clearly articulated?
  personalExamples: number; // 0-100: Are there specific examples from their life?
  originUnderstanding: number; // 0-100: Do they understand where it came from?
  triggerAwareness: number; // 0-100: Do they know what activates it?
  impactRecognition: number; // 0-100: Do they see how it affects their life?
}

export interface PatternMapVerification extends VerificationScore {
  criteria: PatternMapCriteria;
  missingElements: string[]; // What's missing from their pattern map
  depthSuggestions: string[]; // How to go deeper
}

// =============================================================================
// SKILL DEMONSTRATION
// =============================================================================

export type SkillCategory =
  | 'repair-conversation'
  | 'boundary-setting'
  | 'emotional-regulation'
  | 'active-listening'
  | 'vulnerability-expression'
  | 'conflict-navigation'
  | 'self-soothing'
  | 'trigger-response'
  | 'shadow-recognition'
  | 'pattern-interruption';

export interface SkillDemonstrationScenario {
  id: string;
  category: SkillCategory;
  title: string;
  description: string;
  context: string; // The situation setup
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rubric: SkillRubricItem[];
  dimensions: string[]; // Which dimensions this tests
}

export interface SkillRubricItem {
  criterion: string;
  description: string;
  weight: number; // 0-1, weights should sum to 1
  levels: {
    emerging: string; // 0-20
    developing: string; // 21-40
    competent: string; // 41-60
    proficient: string; // 61-80
    masterful: string; // 81-100
  };
}

export interface SkillDemonstrationEvaluation extends VerificationScore {
  scenario: SkillDemonstrationScenario;
  rubricScores: Record<string, { score: number; feedback: string }>;
  userResponse: string;
  modelResponse?: string; // What a skilled response might look like
}

// =============================================================================
// CONVERSATION SIMULATION
// =============================================================================

export type SimulationRole =
  | 'partner-anxious'
  | 'partner-avoidant'
  | 'partner-defensive'
  | 'parent-critical'
  | 'friend-boundary-violating'
  | 'coworker-passive-aggressive'
  | 'inner-critic'
  | 'wounded-part';

export interface ConversationSimulation {
  id: string;
  title: string;
  description: string;
  role: SimulationRole;
  scenario: string;
  targetSkills: SkillCategory[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  evaluationCriteria: string[];
  maxTurns: number;
}

export interface SimulationTurn {
  role: 'user' | 'simulation';
  content: string;
  timestamp: Date;
  evaluation?: TurnEvaluation;
}

export interface TurnEvaluation {
  skillsShown: SkillCategory[];
  effectiveness: number; // 0-100
  feedback: string;
  suggestions?: string[];
}

export interface SimulationResult extends VerificationScore {
  simulation: ConversationSimulation;
  turns: SimulationTurn[];
  overallSkillsShown: Record<SkillCategory, number>;
  breakthroughMoments: string[];
  areasForPractice: string[];
}

// =============================================================================
// PROGRESS GATES
// =============================================================================

export interface ProgressGate {
  id: string;
  courseSlug: string;
  moduleSlug: string;
  gateType: 'journal' | 'pattern-map' | 'skill-demo' | 'simulation' | 'quiz';
  requirements: GateRequirement[];
  minimumScore: number; // 0-100
  allowRetry: boolean;
  retryDelay?: number; // Hours before retry allowed
}

export interface GateRequirement {
  type: 'journal-quality' | 'pattern-specificity' | 'skill-score' | 'simulation-complete';
  criterionId?: string;
  minimumValue: number;
  description: string;
}

export interface GateAttempt {
  id: string;
  userId: string;
  gateId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  verification: VerificationScore;
  attemptedAt: Date;
  responseData: string; // JSON of user's submission
}

// =============================================================================
// COURSE VERIFICATION
// =============================================================================

export interface CourseVerificationConfig {
  courseSlug: string;
  verificationEnabled: boolean;
  gates: ProgressGate[];
  finalAssessment: FinalAssessment;
  certificateRequirements: CertificateRequirements;
}

export interface FinalAssessment {
  scenarios: SkillDemonstrationScenario[];
  minimumOverallScore: number;
  minimumPerScenarioScore: number;
  allowPartialCredit: boolean;
}

export interface CertificateRequirements {
  allGatesPassed: boolean;
  finalAssessmentPassed: boolean;
  minimumTimeInCourse: number; // Days
  minimumPracticeLogged: number; // Number of practice entries
  quizScore?: number; // Optional quiz score requirement
}

// =============================================================================
// VERIFICATION SESSION
// =============================================================================

export interface VerificationSession {
  id: string;
  userId: string;
  courseSlug: string;
  type: 'gate' | 'final-assessment' | 'simulation';
  status: 'in-progress' | 'completed' | 'failed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  currentStep: number;
  totalSteps: number;
  results: VerificationScore[];
  overallResult?: VerificationResult;
}
