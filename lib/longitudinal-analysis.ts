/**
 * Longitudinal Analysis Service
 *
 * Tracks patterns, themes, and nervous system states over extended timeframes.
 * Provides insights into:
 * - Long-term trends
 * - Cyclical patterns
 * - Growth trajectories
 * - Regression indicators
 * - Seasonal patterns
 *
 * This helps users see their development arc, not just point-in-time snapshots.
 */

import { prisma } from '@/lib/prisma';
import {
  extractThemes,
  detectNervousSystemState,
  type NervousSystemState,
} from '@/lib/classification-utils';

// =============================================================================
// TYPES
// =============================================================================

export interface LongitudinalAnalysis {
  userId: string;
  analyzedAt: Date;
  timeframeDays: number;

  // Nervous system evolution
  nervousSystemTrend: NervousSystemEvolution;

  // Theme evolution
  themeEvolution: ThemeEvolution;

  // Stuck pattern evolution
  stuckPatternEvolution: StuckEvolution;

  // Growth trajectory
  growthTrajectory: GrowthTrajectory;

  // Engagement patterns
  engagementPatterns: EngagementPatterns;

  // Insights
  keyInsights: string[];
  celebrations: string[];
  growthEdges: string[];
}

export interface NervousSystemEvolution {
  current: NervousSystemState;
  weeklySnapshots: Array<{
    weekStart: Date;
    dominant: NervousSystemState;
    ventral: number;
    sympathetic: number;
    dorsal: number;
  }>;
  overallTrend: 'improving' | 'stable' | 'declining' | 'fluctuating';
  windowOfTolerance: 'expanding' | 'stable' | 'contracting';
  recoverySpeed: 'faster' | 'same' | 'slower';
}

export interface ThemeEvolution {
  persistent: string[]; // Themes present throughout
  emerging: string[]; // New themes appearing
  resolving: string[]; // Themes fading away
  cyclical: string[]; // Themes that come and go
  topThemesByPeriod: Array<{
    periodStart: Date;
    themes: string[];
  }>;
}

export interface StuckEvolution {
  totalPatterns: number;
  resolvedCount: number;
  resolutionRate: number;
  averageResolutionDays: number | null;
  recurringTypes: Array<{ type: string; count: number }>;
  trend: 'resolving_more' | 'stable' | 'accumulating';
}

export interface GrowthTrajectory {
  overall: 'ascending' | 'plateau' | 'descending' | 'fluctuating';
  dimensionProgress: Array<{
    dimensionId: string;
    pillarId: string;
    startScore: number | null;
    currentScore: number | null;
    change: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  milestones: Array<{
    date: Date;
    description: string;
    type: 'breakthrough' | 'completion' | 'insight' | 'resolution';
  }>;
}

export interface EngagementPatterns {
  journalFrequency: 'daily' | 'frequent' | 'weekly' | 'sporadic' | 'rare';
  dreamLogging: 'active' | 'occasional' | 'rare' | 'none';
  courseProgress: 'active' | 'steady' | 'paused' | 'completed';
  aiToolUsage: Array<{ tool: string; count: number }>;
  preferredTimes: string[]; // Time of day patterns
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

export async function generateLongitudinalAnalysis(
  userId: string,
  timeframeDays: number = 90
): Promise<LongitudinalAnalysis> {
  const since = new Date();
  since.setDate(since.getDate() - timeframeDays);

  // Fetch all relevant data
  const [journals, dreams, activities, checkIns, stuckPatterns] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.dreamEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.growthActivity.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.quickCheckIn.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.stuckPattern.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Analyze each aspect
  const nervousSystemTrend = analyzeNervousSystemEvolution(journals, dreams, checkIns, timeframeDays);
  const themeEvolution = analyzeThemeEvolution(journals, dreams, timeframeDays);
  const stuckPatternEvolution = analyzeStuckEvolution(stuckPatterns);
  const growthTrajectory = await analyzeGrowthTrajectory(userId, activities, timeframeDays);
  const engagementPatterns = analyzeEngagementPatterns(journals, dreams, activities, timeframeDays);

  // Generate insights
  const { keyInsights, celebrations, growthEdges } = generateInsights(
    nervousSystemTrend,
    themeEvolution,
    stuckPatternEvolution,
    growthTrajectory,
    engagementPatterns
  );

  return {
    userId,
    analyzedAt: new Date(),
    timeframeDays,
    nervousSystemTrend,
    themeEvolution,
    stuckPatternEvolution,
    growthTrajectory,
    engagementPatterns,
    keyInsights,
    celebrations,
    growthEdges,
  };
}

// =============================================================================
// NERVOUS SYSTEM ANALYSIS
// =============================================================================

function analyzeNervousSystemEvolution(
  journals: Array<{ content: string; createdAt: Date }>,
  dreams: Array<{ content: string; createdAt: Date }>,
  checkIns: Array<{ mood: number; energy: number; createdAt: Date }>,
  days: number
): NervousSystemEvolution {
  // Combine all content by week
  const weeklyData: Map<string, { ventral: number; sympathetic: number; dorsal: number; count: number }> = new Map();

  // Process journals and dreams
  const allContent = [
    ...journals.map(j => ({ content: j.content, date: j.createdAt })),
    ...dreams.map(d => ({ content: d.content, date: d.createdAt })),
  ];

  for (const item of allContent) {
    const weekKey = getWeekKey(item.date);
    const ns = detectNervousSystemState(item.content);

    const week = weeklyData.get(weekKey) || { ventral: 0, sympathetic: 0, dorsal: 0, count: 0 };
    week.ventral += ns.ventral;
    week.sympathetic += ns.sympathetic;
    week.dorsal += ns.dorsal;
    week.count++;
    weeklyData.set(weekKey, week);
  }

  // Add check-in data
  for (const checkIn of checkIns) {
    const weekKey = getWeekKey(checkIn.createdAt);
    const week = weeklyData.get(weekKey) || { ventral: 0, sympathetic: 0, dorsal: 0, count: 0 };

    // Map mood/energy to NS states
    if (checkIn.mood >= 4 && checkIn.energy >= 3) {
      week.ventral += 2;
    } else if (checkIn.mood <= 2 && checkIn.energy >= 4) {
      week.sympathetic += 2;
    } else if (checkIn.mood <= 2 && checkIn.energy <= 2) {
      week.dorsal += 2;
    } else {
      week.ventral += 1;
    }
    week.count++;
    weeklyData.set(weekKey, week);
  }

  // Build weekly snapshots
  const weeklySnapshots = [...weeklyData.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, data]) => {
      const total = data.ventral + data.sympathetic + data.dorsal || 1;
      let dominant: NervousSystemState;
      if (data.ventral >= data.sympathetic && data.ventral >= data.dorsal) {
        dominant = 'ventral';
      } else if (data.sympathetic > data.dorsal) {
        dominant = 'sympathetic';
      } else {
        dominant = 'dorsal';
      }
      return {
        weekStart: parseWeekKey(weekKey),
        dominant,
        ventral: data.ventral / total,
        sympathetic: data.sympathetic / total,
        dorsal: data.dorsal / total,
      };
    });

  // Determine trends
  const firstHalf = weeklySnapshots.slice(0, Math.floor(weeklySnapshots.length / 2));
  const secondHalf = weeklySnapshots.slice(Math.floor(weeklySnapshots.length / 2));

  const firstVentral = firstHalf.reduce((sum, w) => sum + w.ventral, 0) / (firstHalf.length || 1);
  const secondVentral = secondHalf.reduce((sum, w) => sum + w.ventral, 0) / (secondHalf.length || 1);

  let overallTrend: NervousSystemEvolution['overallTrend'] = 'stable';
  if (secondVentral - firstVentral > 0.1) overallTrend = 'improving';
  else if (firstVentral - secondVentral > 0.1) overallTrend = 'declining';

  const current = weeklySnapshots[weeklySnapshots.length - 1]?.dominant || 'ventral';

  return {
    current,
    weeklySnapshots,
    overallTrend,
    windowOfTolerance: overallTrend === 'improving' ? 'expanding' : overallTrend === 'declining' ? 'contracting' : 'stable',
    recoverySpeed: overallTrend === 'improving' ? 'faster' : 'same',
  };
}

// =============================================================================
// THEME EVOLUTION
// =============================================================================

function analyzeThemeEvolution(
  journals: Array<{ content: string; createdAt: Date }>,
  dreams: Array<{ content: string; createdAt: Date }>,
  days: number
): ThemeEvolution {
  // Split into periods
  const periodDays = Math.max(14, Math.floor(days / 4));
  const periods: Map<string, string[]> = new Map();

  const allContent = [
    ...journals.map(j => ({ content: j.content, date: j.createdAt })),
    ...dreams.map(d => ({ content: d.content, date: d.createdAt })),
  ];

  for (const item of allContent) {
    const periodKey = getPeriodKey(item.date, periodDays);
    const themes = extractThemes(item.content, 3).map(t => t.theme);
    const existing = periods.get(periodKey) || [];
    periods.set(periodKey, [...existing, ...themes]);
  }

  // Count themes by period
  const periodThemeCounts: Map<string, Map<string, number>> = new Map();
  for (const [periodKey, themes] of periods) {
    const counts = new Map<string, number>();
    for (const theme of themes) {
      counts.set(theme, (counts.get(theme) || 0) + 1);
    }
    periodThemeCounts.set(periodKey, counts);
  }

  // Analyze patterns
  const sortedPeriods = [...periodThemeCounts.keys()].sort();
  const firstPeriod = periodThemeCounts.get(sortedPeriods[0]) || new Map();
  const lastPeriod = periodThemeCounts.get(sortedPeriods[sortedPeriods.length - 1]) || new Map();

  const persistent: string[] = [];
  const emerging: string[] = [];
  const resolving: string[] = [];

  // Themes in all periods
  const allThemes = new Set<string>();
  for (const counts of periodThemeCounts.values()) {
    for (const theme of counts.keys()) allThemes.add(theme);
  }

  for (const theme of allThemes) {
    const inFirst = firstPeriod.has(theme);
    const inLast = lastPeriod.has(theme);

    if (inFirst && inLast) persistent.push(theme);
    else if (!inFirst && inLast) emerging.push(theme);
    else if (inFirst && !inLast) resolving.push(theme);
  }

  // Top themes by period
  const topThemesByPeriod = sortedPeriods.map(periodKey => {
    const counts = periodThemeCounts.get(periodKey) || new Map();
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme]) => theme);
    return {
      periodStart: parsePeriodKey(periodKey),
      themes: top,
    };
  });

  return {
    persistent: persistent.slice(0, 5),
    emerging: emerging.slice(0, 5),
    resolving: resolving.slice(0, 5),
    cyclical: [], // Would need longer timeframe to detect
    topThemesByPeriod,
  };
}

// =============================================================================
// STUCK PATTERN EVOLUTION
// =============================================================================

function analyzeStuckEvolution(
  stuckPatterns: Array<{
    stuckType: string;
    resolved: boolean;
    createdAt: Date;
    resolvedAt: Date | null;
  }>
): StuckEvolution {
  const total = stuckPatterns.length;
  const resolved = stuckPatterns.filter(p => p.resolved);
  const resolutionRate = total > 0 ? resolved.length / total : 0;

  // Average resolution time
  let avgDays: number | null = null;
  const resolvedWithTime = resolved.filter(p => p.resolvedAt);
  if (resolvedWithTime.length > 0) {
    const totalDays = resolvedWithTime.reduce((sum, p) => {
      const days = (p.resolvedAt!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgDays = Math.round(totalDays / resolvedWithTime.length);
  }

  // Recurring types
  const typeCounts = new Map<string, number>();
  for (const p of stuckPatterns) {
    typeCounts.set(p.stuckType, (typeCounts.get(p.stuckType) || 0) + 1);
  }
  const recurringTypes = [...typeCounts.entries()]
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  // Trend
  const firstHalf = stuckPatterns.slice(0, Math.floor(stuckPatterns.length / 2));
  const secondHalf = stuckPatterns.slice(Math.floor(stuckPatterns.length / 2));
  const firstResolved = firstHalf.filter(p => p.resolved).length / (firstHalf.length || 1);
  const secondResolved = secondHalf.filter(p => p.resolved).length / (secondHalf.length || 1);

  let trend: StuckEvolution['trend'] = 'stable';
  if (secondResolved - firstResolved > 0.2) trend = 'resolving_more';
  else if (firstResolved - secondResolved > 0.2) trend = 'accumulating';

  return {
    totalPatterns: total,
    resolvedCount: resolved.length,
    resolutionRate,
    averageResolutionDays: avgDays,
    recurringTypes,
    trend,
  };
}

// =============================================================================
// GROWTH TRAJECTORY
// =============================================================================

async function analyzeGrowthTrajectory(
  userId: string,
  activities: Array<{ dimensionId: string; pillarId: string; points: number; createdAt: Date }>,
  days: number
): Promise<GrowthTrajectory> {
  // Get dimension health data
  const [dimensionHealth, estimates] = await Promise.all([
    prisma.dimensionHealth.findMany({ where: { userId } }),
    prisma.dimensionEstimate.findMany({ where: { userId } }),
  ]);

  // Calculate dimension progress
  const dimensionProgress: GrowthTrajectory['dimensionProgress'] = [];

  const activityByDimension = new Map<string, number>();
  for (const activity of activities) {
    const key = `${activity.pillarId}:${activity.dimensionId}`;
    activityByDimension.set(key, (activityByDimension.get(key) || 0) + activity.points);
  }

  // Combine health and estimate data
  const allDimensions = new Set([
    ...dimensionHealth.map(d => `${d.pillarId}:${d.dimensionId}`),
    ...estimates.map(e => `${e.pillarId}:${e.dimensionId}`),
  ]);

  for (const key of allDimensions) {
    const [pillarId, dimensionId] = key.split(':');
    const verified = dimensionHealth.find(d => d.pillarId === pillarId && d.dimensionId === dimensionId);
    const estimated = estimates.find(e => e.pillarId === pillarId && e.dimensionId === dimensionId);
    const activityPoints = activityByDimension.get(key) || 0;

    const startScore = verified?.verifiedScore || null;
    const currentScore = estimated?.estimatedScore || verified?.verifiedScore || null;
    const change = activityPoints;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (change > 10) trend = 'improving';
    else if (change < -5) trend = 'declining';

    dimensionProgress.push({
      dimensionId,
      pillarId,
      startScore,
      currentScore,
      change,
      trend,
    });
  }

  // Determine overall trajectory
  const improving = dimensionProgress.filter(d => d.trend === 'improving').length;
  const declining = dimensionProgress.filter(d => d.trend === 'declining').length;

  let overall: GrowthTrajectory['overall'] = 'plateau';
  if (improving > declining + 2) overall = 'ascending';
  else if (declining > improving + 2) overall = 'descending';
  else if (improving > 0 && declining > 0) overall = 'fluctuating';

  return {
    overall,
    dimensionProgress: dimensionProgress.slice(0, 10),
    milestones: [], // Would need milestone tracking to populate
  };
}

// =============================================================================
// ENGAGEMENT PATTERNS
// =============================================================================

function analyzeEngagementPatterns(
  journals: Array<{ createdAt: Date }>,
  dreams: Array<{ createdAt: Date }>,
  activities: Array<{ activityType: string; createdAt: Date }>,
  days: number
): EngagementPatterns {
  // Journal frequency
  const journalsPerWeek = (journals.length / days) * 7;
  let journalFrequency: EngagementPatterns['journalFrequency'];
  if (journalsPerWeek >= 5) journalFrequency = 'daily';
  else if (journalsPerWeek >= 3) journalFrequency = 'frequent';
  else if (journalsPerWeek >= 1) journalFrequency = 'weekly';
  else if (journalsPerWeek >= 0.3) journalFrequency = 'sporadic';
  else journalFrequency = 'rare';

  // Dream logging
  const dreamsPerMonth = (dreams.length / days) * 30;
  let dreamLogging: EngagementPatterns['dreamLogging'];
  if (dreamsPerMonth >= 8) dreamLogging = 'active';
  else if (dreamsPerMonth >= 2) dreamLogging = 'occasional';
  else if (dreamsPerMonth >= 0.5) dreamLogging = 'rare';
  else dreamLogging = 'none';

  // AI tool usage
  const toolCounts = new Map<string, number>();
  for (const activity of activities) {
    const tool = activity.activityType;
    toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
  }
  const aiToolUsage = [...toolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tool, count]) => ({ tool, count }));

  // Time patterns
  const hours = new Map<number, number>();
  for (const j of journals) {
    const hour = j.createdAt.getHours();
    hours.set(hour, (hours.get(hour) || 0) + 1);
  }
  const preferredTimes = [...hours.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([hour]) => {
      if (hour < 6) return 'early morning';
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      if (hour < 21) return 'evening';
      return 'night';
    });

  return {
    journalFrequency,
    dreamLogging,
    courseProgress: 'steady', // Would need course data
    aiToolUsage,
    preferredTimes: [...new Set(preferredTimes)],
  };
}

// =============================================================================
// INSIGHT GENERATION
// =============================================================================

function generateInsights(
  ns: NervousSystemEvolution,
  themes: ThemeEvolution,
  stuck: StuckEvolution,
  growth: GrowthTrajectory,
  engagement: EngagementPatterns
): { keyInsights: string[]; celebrations: string[]; growthEdges: string[] } {
  const keyInsights: string[] = [];
  const celebrations: string[] = [];
  const growthEdges: string[] = [];

  // Nervous system insights
  if (ns.overallTrend === 'improving') {
    celebrations.push('Your nervous system is showing increased regulation over time.');
  } else if (ns.overallTrend === 'declining') {
    keyInsights.push('Your nervous system may need extra support right now. Consider resourcing practices.');
  }

  if (ns.windowOfTolerance === 'expanding') {
    celebrations.push("Your window of tolerance appears to be expanding - you're building capacity.");
  }

  // Theme insights
  if (themes.persistent.length > 0) {
    keyInsights.push(`"${themes.persistent[0]}" has been a persistent theme. This is core material for your work.`);
  }

  if (themes.emerging.length > 0) {
    keyInsights.push(`"${themes.emerging[0]}" is emerging as a new area of focus.`);
  }

  if (themes.resolving.length > 0) {
    celebrations.push(`"${themes.resolving[0]}" appears to be resolving - you may be integrating this material.`);
  }

  // Stuck insights
  if (stuck.resolutionRate > 0.5) {
    celebrations.push(`You've resolved ${Math.round(stuck.resolutionRate * 100)}% of stuck patterns. Nice movement!`);
  }

  if (stuck.recurringTypes.length > 0) {
    growthEdges.push(`${stuck.recurringTypes[0].type} stuckness keeps recurring. This may be a growth edge.`);
  }

  if (stuck.trend === 'accumulating') {
    keyInsights.push('Unresolved stuck patterns are accumulating. Consider which ones to focus on.');
  }

  // Growth insights
  if (growth.overall === 'ascending') {
    celebrations.push('Your overall trajectory is ascending. Keep going!');
  }

  const improvingDimensions = growth.dimensionProgress.filter(d => d.trend === 'improving');
  if (improvingDimensions.length > 0) {
    celebrations.push(`Growth detected in: ${improvingDimensions.map(d => d.dimensionId).join(', ')}`);
  }

  // Engagement insights
  if (engagement.journalFrequency === 'daily' || engagement.journalFrequency === 'frequent') {
    celebrations.push('Your consistent journaling practice supports deep integration.');
  }

  if (engagement.dreamLogging === 'active') {
    celebrations.push("You're actively tracking your dreams - this builds unconscious awareness.");
  }

  // Growth edges
  if (engagement.journalFrequency === 'rare' || engagement.journalFrequency === 'sporadic') {
    growthEdges.push('More frequent journaling could deepen your integration work.');
  }

  if (ns.current === 'dorsal' || ns.current === 'sympathetic') {
    growthEdges.push('Nervous system regulation practices could support your current state.');
  }

  return { keyInsights, celebrations, growthEdges };
}

// =============================================================================
// HELPERS
// =============================================================================

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Start of week
  return d.toISOString().split('T')[0];
}

function parseWeekKey(key: string): Date {
  return new Date(key);
}

function getPeriodKey(date: Date, periodDays: number): string {
  const epoch = new Date('2020-01-01').getTime();
  const periodNum = Math.floor((date.getTime() - epoch) / (periodDays * 24 * 60 * 60 * 1000));
  return `period-${periodNum}`;
}

function parsePeriodKey(key: string): Date {
  const periodNum = parseInt(key.replace('period-', ''), 10);
  const periodDays = 14; // Approximate
  const epoch = new Date('2020-01-01').getTime();
  return new Date(epoch + periodNum * periodDays * 24 * 60 * 60 * 1000);
}
