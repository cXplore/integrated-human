/**
 * Stuck Pattern Persistence Service
 *
 * Persists stuckness patterns to the database for longitudinal analysis.
 * Enables tracking of:
 * - Recurring stuckness themes
 * - Pattern evolution over time
 * - Resolution tracking
 * - Cross-pattern linking
 */

import { prisma } from '@/lib/prisma';
import { detectDimensions } from '@/lib/classification-utils';
import type { StuckClassification } from '@/lib/stuck-analysis';

// =============================================================================
// TYPES
// =============================================================================

export interface PersistedStuckPattern {
  id: string;
  userId: string;
  stuckType: string;
  nervousState: string;
  protectiveFunction: string | null;
  description: string;
  theme: string | null;
  affectedDimensions: string[];
  intensity: string;
  developmentalStage: string | null;
  suggestedParts: string[];
  hasExileContent: boolean;
  resolved: boolean;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  relatedPatternIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StuckPatternSummary {
  totalPatterns: number;
  unresolvedCount: number;
  resolvedCount: number;
  topTypes: Array<{ type: string; count: number }>;
  recurringThemes: string[];
  averageResolutionDays: number | null;
  recentPatterns: PersistedStuckPattern[];
}

// =============================================================================
// HELPER - EXTRACT THEME FROM DESCRIPTION
// =============================================================================

function extractTheme(description: string): string | null {
  const themes = [
    { pattern: /\b(relationship|partner|marriage|dating)\b/i, theme: 'relationships' },
    { pattern: /\b(work|job|career|boss)\b/i, theme: 'work' },
    { pattern: /\b(family|parent|mother|father|child)\b/i, theme: 'family' },
    { pattern: /\b(anxiety|worry|fear)\b/i, theme: 'anxiety' },
    { pattern: /\b(depress|sad|hopeless)\b/i, theme: 'depression' },
    { pattern: /\b(anger|rage|frustrat)\b/i, theme: 'anger' },
    { pattern: /\b(boundary|boundaries|people\s?pleas)\b/i, theme: 'boundaries' },
    { pattern: /\b(meaning|purpose|direction)\b/i, theme: 'meaning' },
    { pattern: /\b(identity|who am i|authentic)\b/i, theme: 'identity' },
    { pattern: /\b(shame|guilt|worthless)\b/i, theme: 'shame' },
  ];

  for (const { pattern, theme } of themes) {
    if (pattern.test(description)) return theme;
  }
  return null;
}

// =============================================================================
// PERSISTENCE FUNCTIONS
// =============================================================================

/**
 * Save a new stuck pattern to the database
 */
export async function saveStuckPattern(
  userId: string,
  description: string,
  classification: StuckClassification
): Promise<PersistedStuckPattern> {
  // Detect affected dimensions
  const dimensions = detectDimensions(description, 5);
  const affectedDimensions = dimensions.map(d => d.dimensionId);

  // Extract theme from description
  const theme = extractTheme(description);

  // Find related patterns (same type or theme in last 30 days)
  const relatedPatterns = await findRelatedPatterns(
    userId,
    classification.primaryType,
    theme || '',
    30
  );

  // Detect if description mentions exile-like content
  const hasExileContent = /\b(inner child|wounded|vulnerable|shame|abandon|reject|young part)\b/i.test(description);

  // Detect suggested parts from description
  const suggestedParts: string[] = [];
  if (/\b(critic|harsh|judg)\b/i.test(description)) suggestedParts.push('Inner Critic');
  if (/\b(perfect|control)\b/i.test(description)) suggestedParts.push('Perfectionist');
  if (/\b(pleas|caretake)\b/i.test(description)) suggestedParts.push('People-Pleaser');
  if (/\b(child|young|little)\b/i.test(description)) suggestedParts.push('Inner Child');
  if (/\b(protector|guard)\b/i.test(description)) suggestedParts.push('Protector');

  const pattern = await prisma.stuckPattern.create({
    data: {
      userId,
      stuckType: classification.primaryType,
      nervousState: classification.nervousSystemState,
      protectiveFunction: classification.protectiveFunction,
      description,
      theme,
      affectedDimensions: JSON.stringify(affectedDimensions),
      intensity: classification.intensity,
      developmentalStage: null, // Not part of classification
      suggestedParts: JSON.stringify(suggestedParts),
      hasExileContent,
      relatedPatternIds: JSON.stringify(relatedPatterns.map(p => p.id)),
    },
  });

  return parseStuckPattern(pattern);
}

/**
 * Find patterns related to the current one
 */
async function findRelatedPatterns(
  userId: string,
  stuckType: string,
  theme: string,
  days: number
): Promise<Array<{ id: string }>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const patterns = await prisma.stuckPattern.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      OR: [
        { stuckType },
        ...(theme ? [{ theme: { contains: theme } }] : []),
      ],
    },
    select: { id: true },
    take: 10,
  });

  return patterns;
}

/**
 * Get stuck pattern history for a user
 */
export async function getStuckPatternHistory(
  userId: string,
  options: {
    limit?: number;
    includeResolved?: boolean;
    stuckType?: string;
    days?: number;
  } = {}
): Promise<PersistedStuckPattern[]> {
  const { limit = 20, includeResolved = true, stuckType, days } = options;

  const where: Record<string, unknown> = { userId };

  if (!includeResolved) {
    where.resolved = false;
  }

  if (stuckType) {
    where.stuckType = stuckType;
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    where.createdAt = { gte: since };
  }

  const patterns = await prisma.stuckPattern.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return patterns.map(parseStuckPattern);
}

/**
 * Mark a stuck pattern as resolved
 */
export async function resolveStuckPattern(
  patternId: string,
  userId: string,
  resolutionNotes?: string
): Promise<PersistedStuckPattern | null> {
  try {
    const pattern = await prisma.stuckPattern.update({
      where: { id: patternId, userId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolutionNotes,
      },
    });
    return parseStuckPattern(pattern);
  } catch {
    return null;
  }
}

/**
 * Get a summary of stuck patterns for a user
 */
export async function getStuckPatternSummary(
  userId: string,
  days: number = 90
): Promise<StuckPatternSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const patterns = await prisma.stuckPattern.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
  });

  const parsed = patterns.map(parseStuckPattern);

  // Count by type
  const typeCounts = new Map<string, number>();
  for (const p of parsed) {
    typeCounts.set(p.stuckType, (typeCounts.get(p.stuckType) || 0) + 1);
  }
  const topTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  // Find recurring themes
  const themeCounts = new Map<string, number>();
  for (const p of parsed) {
    if (p.theme) {
      themeCounts.set(p.theme, (themeCounts.get(p.theme) || 0) + 1);
    }
  }
  const recurringThemes = [...themeCounts.entries()]
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  // Calculate average resolution time
  const resolvedPatterns = parsed.filter((p: PersistedStuckPattern) => p.resolved && p.resolvedAt);
  let averageResolutionDays: number | null = null;
  if (resolvedPatterns.length > 0) {
    const totalDays = resolvedPatterns.reduce((sum: number, p: PersistedStuckPattern) => {
      const days = (p.resolvedAt!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    averageResolutionDays = Math.round(totalDays / resolvedPatterns.length);
  }

  return {
    totalPatterns: parsed.length,
    unresolvedCount: parsed.filter((p: PersistedStuckPattern) => !p.resolved).length,
    resolvedCount: parsed.filter((p: PersistedStuckPattern) => p.resolved).length,
    topTypes,
    recurringThemes,
    averageResolutionDays,
    recentPatterns: parsed.slice(0, 5),
  };
}

/**
 * Detect if current stuckness is a recurring pattern
 */
export async function detectRecurringPattern(
  userId: string,
  classification: StuckClassification
): Promise<{
  isRecurring: boolean;
  previousOccurrences: number;
  lastOccurrence: Date | null;
  insight?: string;
}> {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const similarPatterns = await prisma.stuckPattern.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      stuckType: classification.primaryType,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (similarPatterns.length === 0) {
    return {
      isRecurring: false,
      previousOccurrences: 0,
      lastOccurrence: null,
    };
  }

  const isRecurring = similarPatterns.length >= 2;

  let insight: string | undefined;
  if (isRecurring) {
    insight = `This ${classification.primaryType} stuckness has appeared ${similarPatterns.length} times in the last 90 days. Your psyche keeps returning here for a reason.`;
  }

  return {
    isRecurring,
    previousOccurrences: similarPatterns.length,
    lastOccurrence: similarPatterns[0].createdAt,
    insight,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function parseStuckPattern(pattern: {
  id: string;
  userId: string;
  stuckType: string;
  nervousState: string;
  protectiveFunction: string | null;
  description: string;
  theme: string | null;
  affectedDimensions: string | null;
  intensity: string;
  developmentalStage: string | null;
  suggestedParts: string | null;
  hasExileContent: boolean;
  resolved: boolean;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  relatedPatternIds: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PersistedStuckPattern {
  return {
    id: pattern.id,
    userId: pattern.userId,
    stuckType: pattern.stuckType,
    nervousState: pattern.nervousState,
    protectiveFunction: pattern.protectiveFunction,
    description: pattern.description,
    theme: pattern.theme,
    affectedDimensions: pattern.affectedDimensions
      ? JSON.parse(pattern.affectedDimensions)
      : [],
    intensity: pattern.intensity,
    developmentalStage: pattern.developmentalStage,
    suggestedParts: pattern.suggestedParts
      ? JSON.parse(pattern.suggestedParts)
      : [],
    hasExileContent: pattern.hasExileContent,
    resolved: pattern.resolved,
    resolvedAt: pattern.resolvedAt,
    resolutionNotes: pattern.resolutionNotes,
    relatedPatternIds: pattern.relatedPatternIds
      ? JSON.parse(pattern.relatedPatternIds)
      : [],
    createdAt: pattern.createdAt,
    updatedAt: pattern.updatedAt,
  };
}
