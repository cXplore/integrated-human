/**
 * Crisis Coordinator
 *
 * Unified crisis detection and response system that coordinates across all AI tools.
 * Ensures consistent crisis handling and tracks user safety state over time.
 *
 * Principles:
 * - Safety first, always
 * - Gentle, non-alarming responses
 * - Track patterns to recognize recurring distress
 * - Never leave someone in crisis without resources
 * - Respect autonomy while maintaining care
 */

import { prisma } from '@/lib/prisma';
import {
  detectCrisis,
  buildCrisisResourcesText,
  type CrisisIndicators,
} from '@/lib/classification-utils';

// =============================================================================
// TYPES
// =============================================================================

export interface CrisisState {
  userId: string;
  hasCrisisIndicators: boolean;
  severity: CrisisIndicators['severity'];
  indicators: string[];
  recommendedAction: CrisisIndicators['recommendedAction'];
  // Historical context
  recentCrisisCount: number; // In last 7 days
  isEscalating: boolean;
  lastCrisisAt: Date | null;
  // Response guidance
  responseGuidance: CrisisResponseGuidance;
}

export interface CrisisResponseGuidance {
  priority: 'normal' | 'elevated' | 'high' | 'critical';
  toneGuidance: string;
  openingStatement?: string;
  mustIncludeResources: boolean;
  suggestProfessional: boolean;
  followUpRecommended: boolean;
  promptModifiers: string[];
}

export interface CrisisEvent {
  userId: string;
  source: string; // 'journal', 'dream', 'somatic', 'chat', 'stuck'
  severity: CrisisIndicators['severity'];
  indicators: string[];
  content: string; // The content that triggered detection (truncated)
  timestamp: Date;
  wasResourcesShown: boolean;
}

// =============================================================================
// CRISIS HISTORY TRACKING
// =============================================================================

/**
 * Record a crisis detection event
 * Uses ConversationInsight model to store crisis patterns
 */
export async function recordCrisisEvent(event: CrisisEvent): Promise<void> {
  try {
    // Check for existing crisis event for this source
    const existing = await prisma.conversationInsight.findFirst({
      where: {
        userId: event.userId,
        insightType: 'crisis-event',
        insight: event.source,
      },
    });

    if (existing) {
      // Update existing
      await prisma.conversationInsight.update({
        where: { id: existing.id },
        data: {
          lastSeen: event.timestamp,
          occurrences: { increment: 1 },
          strength: { increment: 1 },
          evidence: JSON.stringify({
            severity: event.severity,
            indicators: event.indicators,
            contentSnippet: event.content.slice(0, 200),
            wasResourcesShown: event.wasResourcesShown,
          }),
        },
      });
    } else {
      // Create new
      await prisma.conversationInsight.create({
        data: {
          userId: event.userId,
          insightType: 'crisis-event',
          insight: event.source,
          evidence: JSON.stringify({
            severity: event.severity,
            indicators: event.indicators,
            contentSnippet: event.content.slice(0, 200),
            wasResourcesShown: event.wasResourcesShown,
          }),
          strength: event.severity === 'critical' ? 10 : event.severity === 'severe' ? 8 : 5,
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          occurrences: 1,
        },
      });
    }
  } catch (error) {
    console.error('Failed to record crisis event:', error);
    // Don't throw - this is a non-critical tracking operation
  }
}

/**
 * Get recent crisis history for a user
 */
export async function getCrisisHistory(userId: string, days: number = 7): Promise<{
  events: Array<{ source: string; severity: string; timestamp: Date }>;
  totalCount: number;
  isEscalating: boolean;
}> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const insights = await prisma.conversationInsight.findMany({
      where: {
        userId,
        insightType: 'crisis-event',
        lastSeen: { gte: since },
      },
      orderBy: { lastSeen: 'desc' },
    });

    const events = insights.map(i => {
      const evidence = JSON.parse(i.evidence || '{}');
      return {
        source: i.insight,
        severity: evidence.severity || 'moderate',
        timestamp: i.lastSeen,
      };
    });

    // Check for escalation - more frequent or more severe
    const recentDays = 3;
    const recentSince = new Date();
    recentSince.setDate(recentSince.getDate() - recentDays);
    const recentEvents = events.filter(e => e.timestamp >= recentSince);
    const olderEvents = events.filter(e => e.timestamp < recentSince);

    const isEscalating = recentEvents.length > olderEvents.length ||
      recentEvents.some(e => e.severity === 'critical') && !olderEvents.some(e => e.severity === 'critical');

    return {
      events,
      totalCount: insights.reduce((sum, i) => sum + i.occurrences, 0),
      isEscalating,
    };
  } catch (error) {
    console.error('Failed to get crisis history:', error);
    return { events: [], totalCount: 0, isEscalating: false };
  }
}

// =============================================================================
// MAIN COORDINATION FUNCTION
// =============================================================================

/**
 * Evaluate crisis state for a user based on current content and history
 */
export async function evaluateCrisisState(
  userId: string,
  content: string,
  source: string
): Promise<CrisisState> {
  // Detect current crisis indicators
  const currentCrisis = detectCrisis(content);

  // Get historical context
  const history = await getCrisisHistory(userId, 7);

  // Determine response guidance
  const responseGuidance = buildResponseGuidance(currentCrisis, history);

  // Record event if crisis detected
  if (currentCrisis.hasCrisisIndicators && currentCrisis.severity !== 'none') {
    await recordCrisisEvent({
      userId,
      source,
      severity: currentCrisis.severity,
      indicators: currentCrisis.indicators,
      content,
      timestamp: new Date(),
      wasResourcesShown: responseGuidance.mustIncludeResources,
    });
  }

  return {
    userId,
    hasCrisisIndicators: currentCrisis.hasCrisisIndicators,
    severity: currentCrisis.severity,
    indicators: currentCrisis.indicators,
    recommendedAction: currentCrisis.recommendedAction,
    recentCrisisCount: history.totalCount,
    isEscalating: history.isEscalating,
    lastCrisisAt: history.events[0]?.timestamp || null,
    responseGuidance,
  };
}

// =============================================================================
// RESPONSE GUIDANCE
// =============================================================================

function buildResponseGuidance(
  crisis: CrisisIndicators,
  history: { totalCount: number; isEscalating: boolean }
): CrisisResponseGuidance {
  // Critical - immediate crisis
  if (crisis.severity === 'critical') {
    return {
      priority: 'critical',
      toneGuidance: 'Calm, present, grounded. Do not panic or alarm. Be a steady presence.',
      openingStatement: "I'm here with you. What you're experiencing sounds really difficult, and I want you to know that support is available.",
      mustIncludeResources: true,
      suggestProfessional: true,
      followUpRecommended: true,
      promptModifiers: [
        'Prioritize safety and connection over insight',
        'Do not interpret or analyze - just be present',
        'Offer grounding if appropriate',
        'Include crisis resources naturally, not intrusively',
      ],
    };
  }

  // Severe - serious distress
  if (crisis.severity === 'severe') {
    return {
      priority: 'high',
      toneGuidance: 'Warm, supportive, grounding. Validate without amplifying.',
      mustIncludeResources: true,
      suggestProfessional: true,
      followUpRecommended: true,
      promptModifiers: [
        'Lead with validation and presence',
        'Gentle exploration only if they seem regulated',
        'Suggest grounding or resourcing',
        'Mention professional support as an option',
      ],
    };
  }

  // Moderate - notable distress
  if (crisis.severity === 'moderate') {
    return {
      priority: 'elevated',
      toneGuidance: 'Empathetic, attuned, holding. Honor the difficulty.',
      mustIncludeResources: history.isEscalating || history.totalCount > 3,
      suggestProfessional: history.isEscalating,
      followUpRecommended: history.totalCount > 2,
      promptModifiers: [
        'Acknowledge the weight of what they carry',
        'Titrate - don\'t go too deep too fast',
        'Check in about support systems',
      ],
    };
  }

  // Mild - some distress signals
  if (crisis.severity === 'mild') {
    return {
      priority: 'elevated',
      toneGuidance: 'Attentive, caring. Notice without overreacting.',
      mustIncludeResources: false,
      suggestProfessional: false,
      followUpRecommended: false,
      promptModifiers: [
        'Gently acknowledge any difficult content',
        'Proceed normally but with extra attunement',
      ],
    };
  }

  // No crisis indicators
  return {
    priority: 'normal',
    toneGuidance: 'Standard therapeutic presence.',
    mustIncludeResources: false,
    suggestProfessional: false,
    followUpRecommended: false,
    promptModifiers: [],
  };
}

// =============================================================================
// PROMPT ENHANCEMENT
// =============================================================================

/**
 * Enhance a system prompt with crisis-appropriate modifications
 */
export function enhancePromptForCrisis(
  basePrompt: string,
  crisisState: CrisisState
): string {
  if (crisisState.responseGuidance.priority === 'normal') {
    return basePrompt;
  }

  const additions: string[] = [];

  // Add tone guidance
  additions.push(`\n\n## Current Session Context`);
  additions.push(`Tone: ${crisisState.responseGuidance.toneGuidance}`);

  // Add modifiers
  if (crisisState.responseGuidance.promptModifiers.length > 0) {
    additions.push(`\nGuidance for this response:`);
    for (const mod of crisisState.responseGuidance.promptModifiers) {
      additions.push(`- ${mod}`);
    }
  }

  // Add resource requirement
  if (crisisState.responseGuidance.mustIncludeResources) {
    additions.push(`\nIMPORTANT: Include crisis resources naturally in your response.`);
  }

  // Add professional suggestion requirement
  if (crisisState.responseGuidance.suggestProfessional) {
    additions.push(`Consider mentioning professional support as an option.`);
  }

  // Add escalation awareness
  if (crisisState.isEscalating) {
    additions.push(`\nNote: This person has shown increasing distress recently. Extra gentleness and support is warranted.`);
  }

  return basePrompt + additions.join('\n');
}

/**
 * Build an opening statement for crisis situations
 */
export function getCrisisOpeningStatement(crisisState: CrisisState): string | null {
  return crisisState.responseGuidance.openingStatement || null;
}

/**
 * Get crisis resources text if needed
 */
export function getCrisisResourcesIfNeeded(crisisState: CrisisState): string | null {
  if (!crisisState.responseGuidance.mustIncludeResources) {
    return null;
  }
  return buildCrisisResourcesText();
}

// =============================================================================
// SAFETY CHECK UTILITIES
// =============================================================================

/**
 * Quick safety check for any content
 */
export function quickSafetyCheck(content: string): {
  isSafe: boolean;
  requiresAction: boolean;
  severity: CrisisIndicators['severity'];
} {
  const crisis = detectCrisis(content);
  return {
    isSafe: crisis.severity === 'none' || crisis.severity === 'mild',
    requiresAction: crisis.severity === 'critical' || crisis.severity === 'severe',
    severity: crisis.severity,
  };
}

/**
 * Check if we should show resources based on content
 */
export function shouldShowResources(content: string): boolean {
  const crisis = detectCrisis(content);
  return crisis.severity === 'critical' || crisis.severity === 'severe' || crisis.severity === 'moderate';
}
