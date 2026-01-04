/**
 * AI VERIFICATION SYSTEM
 *
 * Makes certificates meaningful by verifying actual competence through:
 * - Journal quality evaluation
 * - Skill demonstration scoring
 * - Conversation simulation practice
 * - Progress gates
 * - Final assessments
 *
 * @example
 * ```ts
 * import {
 *   evaluateJournalEntry,
 *   evaluateSkillDemonstration,
 *   startSimulation,
 *   checkCertificateEligibility,
 * } from '@/lib/ai-verification';
 *
 * // Evaluate a journal entry
 * const result = await evaluateJournalEntry(entry, {
 *   courseSlug: 'relationship-mastery',
 *   moduleSlug: '03-attachment-awareness',
 *   prompt: 'Reflect on your attachment style',
 * });
 *
 * if (result.result === 'pass') {
 *   // User can proceed
 * }
 * ```
 */

// Types
export * from './types';

// Journal evaluation
export { evaluateJournalEntry, evaluateJournalSeries } from './journal-evaluator';

// Skill demonstrations
export {
  evaluateSkillDemonstration,
  getScenarioById,
  getScenariosByCategory,
  getScenariosByDimension,
  SKILL_SCENARIOS,
} from './skill-demonstration';

// Conversation simulations
export {
  startSimulation,
  continueSimulation,
  evaluateSimulation,
  getSimulationById,
  getSimulationsBySkill,
  SIMULATIONS,
} from './conversation-simulation';

// Progress gates
export {
  evaluateGate,
  canProceedToModule,
  getGatesForCourse,
  getGateForModule,
  isVerifiedCourse,
  checkCertificateEligibility,
  VERIFIED_COURSES,
} from './progress-gates';
