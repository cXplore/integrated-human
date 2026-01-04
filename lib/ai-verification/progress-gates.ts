/**
 * PROGRESS GATES
 *
 * Quality-gated progression through courses. Users must demonstrate
 * actual competence to proceed, not just completion.
 */

import {
  ProgressGate,
  GateAttempt,
  GateRequirement,
  VerificationScore,
  VerificationResult,
  CourseVerificationConfig,
} from './types';
import { evaluateJournalEntry } from './journal-evaluator';
import { evaluateSkillDemonstration, getScenarioById } from './skill-demonstration';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GATE CONFIGURATION BY COURSE
// =============================================================================

/**
 * Configuration for courses with AI verification
 * Add entries here to enable verification for a course
 */
export const VERIFIED_COURSES: Record<string, CourseVerificationConfig> = {
  'relationship-mastery': {
    courseSlug: 'relationship-mastery',
    verificationEnabled: true,
    gates: [
      {
        id: 'rm-gate-1',
        courseSlug: 'relationship-mastery',
        moduleSlug: '03-attachment-awareness',
        gateType: 'journal',
        requirements: [
          {
            type: 'journal-quality',
            criterionId: 'depth',
            minimumValue: 50,
            description: 'Journal entry shows genuine depth of reflection',
          },
          {
            type: 'journal-quality',
            criterionId: 'specificity',
            minimumValue: 50,
            description: 'Entry includes specific personal examples',
          },
        ],
        minimumScore: 55,
        allowRetry: true,
        retryDelay: 24, // hours
      },
      {
        id: 'rm-gate-2',
        courseSlug: 'relationship-mastery',
        moduleSlug: '05-pattern-recognition',
        gateType: 'pattern-map',
        requirements: [
          {
            type: 'pattern-specificity',
            minimumValue: 60,
            description: 'Pattern map is specific to your experience',
          },
        ],
        minimumScore: 60,
        allowRetry: true,
        retryDelay: 12,
      },
      {
        id: 'rm-gate-3',
        courseSlug: 'relationship-mastery',
        moduleSlug: '07-the-art-of-repair',
        gateType: 'skill-demo',
        requirements: [
          {
            type: 'skill-score',
            criterionId: 'repair-forgotten-important',
            minimumValue: 55,
            description: 'Demonstrate repair skills in a scenario',
          },
        ],
        minimumScore: 55,
        allowRetry: true,
        retryDelay: 24,
      },
      {
        id: 'rm-gate-4',
        courseSlug: 'relationship-mastery',
        moduleSlug: '08-boundaries-that-serve-love',
        gateType: 'simulation',
        requirements: [
          {
            type: 'simulation-complete',
            minimumValue: 55,
            description: 'Complete a boundary-setting practice conversation',
          },
        ],
        minimumScore: 55,
        allowRetry: true,
        retryDelay: 24,
      },
    ],
    finalAssessment: {
      scenarios: [
        getScenarioById('repair-forgotten-important')!,
        getScenarioById('boundary-parent-criticism')!,
        getScenarioById('vulnerability-asking-need')!,
      ].filter(Boolean),
      minimumOverallScore: 60,
      minimumPerScenarioScore: 45,
      allowPartialCredit: true,
    },
    certificateRequirements: {
      allGatesPassed: true,
      finalAssessmentPassed: true,
      minimumTimeInCourse: 28, // 4 weeks minimum
      minimumPracticeLogged: 4,
      quizScore: 70,
    },
  },
  // Add more courses as they're ready for verification
};

// =============================================================================
// GATE CHECKING
// =============================================================================

export function getGatesForCourse(courseSlug: string): ProgressGate[] {
  return VERIFIED_COURSES[courseSlug]?.gates ?? [];
}

export function getGateForModule(courseSlug: string, moduleSlug: string): ProgressGate | undefined {
  const gates = getGatesForCourse(courseSlug);
  return gates.find(g => g.moduleSlug === moduleSlug);
}

export function isVerifiedCourse(courseSlug: string): boolean {
  return VERIFIED_COURSES[courseSlug]?.verificationEnabled ?? false;
}

/**
 * Check if user can proceed to a module (has passed any required gate)
 */
export async function canProceedToModule(
  userId: string,
  courseSlug: string,
  moduleSlug: string
): Promise<{
  canProceed: boolean;
  gateRequired: boolean;
  gatePassed: boolean;
  lastAttempt?: GateAttempt;
  nextRetryAt?: Date;
}> {
  const gate = getGateForModule(courseSlug, moduleSlug);

  // No gate for this module
  if (!gate) {
    return { canProceed: true, gateRequired: false, gatePassed: false };
  }

  // Check for passing attempt
  const passingAttempt = await prisma.gateAttempt.findFirst({
    where: {
      userId,
      gateId: gate.id,
      passed: true,
    },
  });

  if (passingAttempt) {
    return {
      canProceed: true,
      gateRequired: true,
      gatePassed: true,
      lastAttempt: deserializeGateAttempt(passingAttempt),
    };
  }

  // Check last failed attempt
  const lastAttempt = await prisma.gateAttempt.findFirst({
    where: { userId, gateId: gate.id },
    orderBy: { attemptedAt: 'desc' },
  });

  if (!lastAttempt) {
    // No attempts yet - can try
    return {
      canProceed: false,
      gateRequired: true,
      gatePassed: false,
    };
  }

  // Check retry delay
  if (gate.allowRetry && gate.retryDelay) {
    const retryTime = new Date(lastAttempt.attemptedAt);
    retryTime.setHours(retryTime.getHours() + gate.retryDelay);

    if (new Date() < retryTime) {
      return {
        canProceed: false,
        gateRequired: true,
        gatePassed: false,
        lastAttempt: deserializeGateAttempt(lastAttempt),
        nextRetryAt: retryTime,
      };
    }
  }

  return {
    canProceed: false,
    gateRequired: true,
    gatePassed: false,
    lastAttempt: deserializeGateAttempt(lastAttempt),
  };
}

// =============================================================================
// GATE EVALUATION
// =============================================================================

interface GateSubmission {
  gateId: string;
  userId: string;
  content: string; // Journal entry, skill demo response, etc.
  prompt?: string; // Original prompt for journal entries
}

export async function evaluateGate(submission: GateSubmission): Promise<{
  attempt: GateAttempt;
  verification: VerificationScore;
  passed: boolean;
  feedback: string;
}> {
  // Find the gate
  let gate: ProgressGate | undefined;
  for (const config of Object.values(VERIFIED_COURSES)) {
    gate = config.gates.find(g => g.id === submission.gateId);
    if (gate) break;
  }

  if (!gate) {
    throw new Error(`Gate not found: ${submission.gateId}`);
  }

  // Get attempt count
  const previousAttempts = await prisma.gateAttempt.count({
    where: { userId: submission.userId, gateId: gate.id },
  });

  // Evaluate based on gate type
  let verification: VerificationScore;

  switch (gate.gateType) {
    case 'journal':
      verification = await evaluateJournalEntry(submission.content, {
        courseSlug: gate.courseSlug,
        moduleSlug: gate.moduleSlug,
        prompt: submission.prompt || 'Reflect on this module',
        minimumScore: gate.minimumScore,
      });
      break;

    case 'skill-demo':
      const scenarioId = gate.requirements.find(r => r.type === 'skill-score')?.criterionId;
      if (!scenarioId) {
        throw new Error('Skill demo gate missing scenario ID');
      }
      verification = await evaluateSkillDemonstration(scenarioId, submission.content);
      break;

    case 'pattern-map':
      // Pattern maps use journal evaluator with pattern-focused prompts
      verification = await evaluateJournalEntry(submission.content, {
        courseSlug: gate.courseSlug,
        moduleSlug: gate.moduleSlug,
        prompt: 'Map your relational patterns with specific examples',
        minimumScore: gate.minimumScore,
      });
      break;

    default:
      throw new Error(`Unsupported gate type: ${gate.gateType}`);
  }

  // Determine if passed
  const passed = verification.result === 'pass' && verification.overall >= gate.minimumScore;

  // Create attempt record
  const attemptData = {
    userId: submission.userId,
    gateId: gate.id,
    attemptNumber: previousAttempts + 1,
    score: verification.overall,
    passed,
    verification: JSON.stringify(verification),
    responseData: submission.content,
  };

  const savedAttempt = await prisma.gateAttempt.create({
    data: attemptData,
  });

  const attempt: GateAttempt = {
    id: savedAttempt.id,
    userId: savedAttempt.userId,
    gateId: savedAttempt.gateId,
    attemptNumber: savedAttempt.attemptNumber,
    score: savedAttempt.score,
    passed: savedAttempt.passed,
    verification,
    attemptedAt: savedAttempt.attemptedAt,
    responseData: savedAttempt.responseData,
  };

  // Build feedback message
  let feedback = verification.feedback;
  if (!passed && gate.allowRetry) {
    const hours = gate.retryDelay || 24;
    feedback += ` You can try again in ${hours} hours.`;
  }

  return { attempt, verification, passed, feedback };
}

// =============================================================================
// CERTIFICATE ELIGIBILITY
// =============================================================================

export async function checkCertificateEligibility(
  userId: string,
  courseSlug: string
): Promise<{
  eligible: boolean;
  requirements: {
    requirement: string;
    met: boolean;
    details?: string;
  }[];
}> {
  const config = VERIFIED_COURSES[courseSlug];

  if (!config) {
    // Non-verified course - just check completion
    return {
      eligible: true,
      requirements: [{ requirement: 'Course completion', met: true }],
    };
  }

  const requirements: { requirement: string; met: boolean; details?: string }[] = [];
  const { certificateRequirements } = config;

  // Check all gates passed
  if (certificateRequirements.allGatesPassed) {
    const allGates = config.gates;
    const passedGates = await prisma.gateAttempt.findMany({
      where: {
        userId,
        gateId: { in: allGates.map(g => g.id) },
        passed: true,
      },
      distinct: ['gateId'],
    });

    const gatesMet = passedGates.length >= allGates.length;
    requirements.push({
      requirement: 'All progress gates passed',
      met: gatesMet,
      details: `${passedGates.length}/${allGates.length} gates passed`,
    });
  }

  // Check minimum time in course
  if (certificateRequirements.minimumTimeInCourse > 0) {
    const firstProgress = await prisma.courseProgress.findFirst({
      where: { userId, courseSlug },
      orderBy: { createdAt: 'asc' },
    });

    if (firstProgress) {
      const daysSinceStart = Math.floor(
        (Date.now() - firstProgress.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const timeMet = daysSinceStart >= certificateRequirements.minimumTimeInCourse;
      requirements.push({
        requirement: `Minimum ${certificateRequirements.minimumTimeInCourse} days in course`,
        met: timeMet,
        details: `${daysSinceStart} days so far`,
      });
    } else {
      requirements.push({
        requirement: `Minimum ${certificateRequirements.minimumTimeInCourse} days in course`,
        met: false,
        details: 'Not started',
      });
    }
  }

  // Check practice logged
  if (certificateRequirements.minimumPracticeLogged > 0) {
    const practiceCount = await prisma.exerciseResponse.count({
      where: {
        userId,
        courseSlug,
        type: 'journal',
      },
    });

    const practiceMet = practiceCount >= certificateRequirements.minimumPracticeLogged;
    requirements.push({
      requirement: `At least ${certificateRequirements.minimumPracticeLogged} practice entries`,
      met: practiceMet,
      details: `${practiceCount} entries logged`,
    });
  }

  // Check quiz score
  if (certificateRequirements.quizScore) {
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        courseSlug,
        passed: true,
      },
      orderBy: { score: 'desc' },
    });

    const quizMet = quizAttempt && quizAttempt.score >= certificateRequirements.quizScore;
    requirements.push({
      requirement: `Quiz score of ${certificateRequirements.quizScore}% or higher`,
      met: quizMet || false,
      details: quizAttempt ? `Best score: ${quizAttempt.score}%` : 'Not attempted',
    });
  }

  // Check final assessment (if required)
  if (certificateRequirements.finalAssessmentPassed) {
    const finalPassed = await prisma.verificationSession.findFirst({
      where: {
        userId,
        courseSlug,
        type: 'final-assessment',
        status: 'completed',
      },
    });

    // Parse results to check if passed
    let assessmentMet = false;
    if (finalPassed) {
      const results = JSON.parse(finalPassed.results) as VerificationScore[];
      const avgScore = results.reduce((sum, r) => sum + r.overall, 0) / results.length;
      assessmentMet = avgScore >= config.finalAssessment.minimumOverallScore;
    }

    requirements.push({
      requirement: 'Final assessment passed',
      met: assessmentMet,
      details: finalPassed ? 'Completed' : 'Not attempted',
    });
  }

  const eligible = requirements.every(r => r.met);

  return { eligible, requirements };
}

// =============================================================================
// HELPERS
// =============================================================================

function deserializeGateAttempt(dbAttempt: {
  id: string;
  userId: string;
  gateId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  verification: string;
  responseData: string;
  attemptedAt: Date;
}): GateAttempt {
  return {
    id: dbAttempt.id,
    userId: dbAttempt.userId,
    gateId: dbAttempt.gateId,
    attemptNumber: dbAttempt.attemptNumber,
    score: dbAttempt.score,
    passed: dbAttempt.passed,
    verification: JSON.parse(dbAttempt.verification),
    attemptedAt: dbAttempt.attemptedAt,
    responseData: dbAttempt.responseData,
  };
}
