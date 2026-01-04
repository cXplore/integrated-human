/**
 * Weekly Reflection Library
 *
 * Synthesizes a user's week across multiple data sources:
 * - Journal entries
 * - Dream logs
 * - Course/practice progress
 * - Assessment activity
 * - Dimension health changes
 *
 * Key principles:
 * - Pattern recognition across modalities
 * - Celebrate growth, don't ignore struggle
 * - Connect daily dots into weekly meaning
 * - Forward-looking invitations
 */

import { prisma } from './prisma';
import { classifyJournalEntry, type JournalEntryType } from './journal-analysis';
import { classifyDream, type DreamType } from './dream-analysis';
import { summarizeCrossModalAnalysis, analyzeCrossModalPatterns } from './cross-modal-patterns';

// =============================================================================
// WEEKLY DATA TYPES
// =============================================================================

export interface WeeklyJournalSummary {
  entryCount: number;
  dominantTypes: JournalEntryType[];
  emotionalArc: 'improving' | 'declining' | 'stable' | 'fluctuating';
  themes: string[];
  notableInsights: string[];
}

export interface WeeklyDreamSummary {
  dreamCount: number;
  dominantTypes: DreamType[];
  recurringSymbols: string[];
  emotionalTone: 'positive' | 'negative' | 'mixed' | 'neutral';
  notableContent: string[];
}

export interface WeeklyProgressSummary {
  lessonsCompleted: number;
  coursesProgressed: string[];
  practicesUsed: string[];
  aiToolsUsed: string[];
  totalActiveMinutes: number;
}

export interface WeeklyHealthSummary {
  dimensionsImproved: string[];
  dimensionsDeclined: string[];
  overallTrend: 'growth' | 'stable' | 'challenging';
  currentStage: string;
}

export interface WeeklySomaticSummary {
  checkInCount: number;
  dominantState: 'calm' | 'activated' | 'shutdown' | 'mixed';
  bodyAwareness: 'developing' | 'growing' | 'strong';
  commonSensations: string[];
  nervousSystemTrend: 'regulating' | 'stable' | 'dysregulated';
}

export interface WeeklyStuckSummary {
  stuckMoments: number;
  resolvedCount: number;
  recurringThemes: string[];
  progressNote: string | null;
}

export interface WeeklyReflection {
  period: {
    start: Date;
    end: Date;
  };
  journals: WeeklyJournalSummary;
  dreams: WeeklyDreamSummary;
  progress: WeeklyProgressSummary;
  health: WeeklyHealthSummary;
  somatic: WeeklySomaticSummary;
  stuck: WeeklyStuckSummary;
  patterns: CrossModalPattern[];
  deeperPatterns: string[]; // User-friendly insights from cross-modal analysis
  celebrations: string[];
  invitations: string[];
}

export interface CrossModalPattern {
  pattern: string;
  sources: string[];
  significance: 'major' | 'minor';
  suggestion: string;
}

// =============================================================================
// DATA GATHERING
// =============================================================================

/**
 * Get the date range for "this week" (last 7 days)
 */
function getWeekRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

/**
 * Gather journal data for the week
 */
async function gatherJournalData(
  userId: string,
  start: Date,
  end: Date
): Promise<WeeklyJournalSummary> {
  const entries = await prisma.journalEntry.findMany({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      content: true,
      mood: true,
      createdAt: true,
    },
  });

  if (entries.length === 0) {
    return {
      entryCount: 0,
      dominantTypes: [],
      emotionalArc: 'stable',
      themes: [],
      notableInsights: [],
    };
  }

  // Classify each entry
  const classifications = entries.map(e =>
    classifyJournalEntry(e.content, e.mood || undefined)
  );

  // Count types
  const typeCounts: Record<string, number> = {};
  for (const c of classifications) {
    typeCounts[c.primaryType] = (typeCounts[c.primaryType] || 0) + 1;
  }

  // Get dominant types
  const dominantTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type as JournalEntryType);

  // Determine emotional arc
  const moods = entries
    .filter(e => e.mood)
    .map(e => e.mood as string);

  let emotionalArc: 'improving' | 'declining' | 'stable' | 'fluctuating' = 'stable';
  if (moods.length >= 3) {
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
    const secondHalf = moods.slice(Math.floor(moods.length / 2));

    const positiveFirst = firstHalf.filter(m => ['good', 'great', 'peaceful', 'hopeful'].includes(m)).length;
    const positiveSecond = secondHalf.filter(m => ['good', 'great', 'peaceful', 'hopeful'].includes(m)).length;

    if (positiveSecond > positiveFirst + 1) emotionalArc = 'improving';
    else if (positiveFirst > positiveSecond + 1) emotionalArc = 'declining';
    else if (moods.filter((m, i) => i > 0 && m !== moods[i - 1]).length > moods.length / 2) emotionalArc = 'fluctuating';
  }

  // Extract themes from content
  const allContent = entries.map(e => e.content).join(' ').toLowerCase();
  const themes: string[] = [];
  if (/\b(relationship|partner|love|connection)\b/.test(allContent)) themes.push('relationships');
  if (/\b(work|job|career|project)\b/.test(allContent)) themes.push('work');
  if (/\b(family|parent|child|mother|father)\b/.test(allContent)) themes.push('family');
  if (/\b(health|body|energy|sleep)\b/.test(allContent)) themes.push('health');
  if (/\b(meaning|purpose|direction|future)\b/.test(allContent)) themes.push('meaning');
  if (/\b(anxiety|stress|worry|fear)\b/.test(allContent)) themes.push('anxiety');
  if (/\b(growth|change|learning|insight)\b/.test(allContent)) themes.push('growth');

  // Find notable insights (entries classified as 'insight')
  const insightEntries = entries.filter((e, i) =>
    classifications[i].primaryType === 'insight' ||
    classifications[i].flags.growthMoment
  );
  const notableInsights = insightEntries.slice(0, 2).map(e =>
    e.content.slice(0, 100) + (e.content.length > 100 ? '...' : '')
  );

  return {
    entryCount: entries.length,
    dominantTypes,
    emotionalArc,
    themes,
    notableInsights,
  };
}

/**
 * Gather dream data for the week
 */
async function gatherDreamData(
  userId: string,
  start: Date,
  end: Date
): Promise<WeeklyDreamSummary> {
  const dreams = await prisma.dreamEntry.findMany({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      content: true,
      emotions: true,
      recurring: true,
      lucid: true,
    },
  });

  if (dreams.length === 0) {
    return {
      dreamCount: 0,
      dominantTypes: [],
      recurringSymbols: [],
      emotionalTone: 'neutral',
      notableContent: [],
    };
  }

  // Classify dreams
  const classifications = dreams.map(d => {
    const emotions = d.emotions ? (d.emotions as string).split(',').map(e => e.trim()) : [];
    return classifyDream(d.content, emotions, d.recurring, d.lucid);
  });

  // Count types
  const typeCounts: Record<string, number> = {};
  for (const c of classifications) {
    typeCounts[c.primaryType] = (typeCounts[c.primaryType] || 0) + 1;
  }

  const dominantTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type as DreamType);

  // Get recurring symbols from the week
  const symbolData = await prisma.dreamSymbol.findMany({
    where: {
      userId,
      lastSeenAt: { gte: start },
    },
    orderBy: { occurrenceCount: 'desc' },
    take: 5,
    select: { symbol: true },
  });
  const recurringSymbols = symbolData.map(s => s.symbol);

  // Determine emotional tone
  const allEmotions = dreams.flatMap(d =>
    d.emotions ? (d.emotions as string).split(',').map(e => e.trim().toLowerCase()) : []
  );
  const positive = allEmotions.filter(e => ['joy', 'peace', 'love', 'wonder', 'awe'].includes(e)).length;
  const negative = allEmotions.filter(e => ['fear', 'anxiety', 'anger', 'sadness', 'terror'].includes(e)).length;

  let emotionalTone: 'positive' | 'negative' | 'mixed' | 'neutral' = 'neutral';
  if (positive > negative * 2) emotionalTone = 'positive';
  else if (negative > positive * 2) emotionalTone = 'negative';
  else if (positive > 0 && negative > 0) emotionalTone = 'mixed';

  // Notable content (numinous or significant dreams)
  const notableDreams = dreams.filter((_, i) =>
    classifications[i].primaryType === 'numinous' ||
    classifications[i].flags.spiritualContent
  );
  const notableContent = notableDreams.slice(0, 2).map(d =>
    d.content.slice(0, 80) + (d.content.length > 80 ? '...' : '')
  );

  return {
    dreamCount: dreams.length,
    dominantTypes,
    recurringSymbols,
    emotionalTone,
    notableContent,
  };
}

/**
 * Gather progress data for the week
 */
async function gatherProgressData(
  userId: string,
  start: Date,
  end: Date
): Promise<WeeklyProgressSummary> {
  // Course modules completed
  const courseProgress = await prisma.courseProgress.findMany({
    where: {
      userId,
      completed: true,
      completedAt: { gte: start, lte: end },
    },
    select: { courseSlug: true },
  });

  const coursesProgressed = [...new Set(courseProgress.map(p => p.courseSlug))];

  // AI tool usage
  const aiUsage = await prisma.aIUsage.findMany({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
    },
    select: { context: true },
  });
  const aiToolsUsed = [...new Set(aiUsage.map(u => u.context).filter((c): c is string => c !== null))];

  // Estimate active time (rough: 10 min per module, 5 min per AI interaction)
  const totalActiveMinutes =
    courseProgress.length * 10 +
    aiUsage.length * 5;

  return {
    lessonsCompleted: courseProgress.length,
    coursesProgressed,
    practicesUsed: [], // No practice tracking model currently
    aiToolsUsed,
    totalActiveMinutes,
  };
}

/**
 * Gather health dimension data for the week
 */
async function gatherHealthData(
  userId: string,
  start: Date
): Promise<WeeklyHealthSummary> {
  // Get dimension health with recent activity
  const health = await prisma.dimensionHealth.findMany({
    where: { userId },
    select: {
      dimensionId: true,
      pillarId: true,
      verifiedScore: true,
      verifiedStage: true,
      updatedAt: true,
    },
  });

  const recentlyUpdated = health.filter(h => h.updatedAt >= start);

  // Simple trend: if updated dimensions show growth
  const improved = recentlyUpdated.filter(h => h.verifiedScore >= 50).map(h => h.dimensionId);
  const declined = recentlyUpdated.filter(h => h.verifiedScore < 30).map(h => h.dimensionId);

  let overallTrend: 'growth' | 'stable' | 'challenging' = 'stable';
  if (improved.length > declined.length) overallTrend = 'growth';
  else if (declined.length > improved.length) overallTrend = 'challenging';

  // Current overall stage
  const stages = health.map(h => h.verifiedStage);
  const stageCounts: Record<string, number> = {};
  for (const s of stages) {
    stageCounts[s] = (stageCounts[s] || 0) + 1;
  }
  const currentStage = Object.entries(stageCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  return {
    dimensionsImproved: improved.slice(0, 3),
    dimensionsDeclined: declined.slice(0, 3),
    overallTrend,
    currentStage,
  };
}

/**
 * Gather somatic check-in data for the week
 * NOTE: SomaticCheckIn model is not yet in the schema - returns empty data for now
 */
async function gatherSomaticData(
  _userId: string,
  _start: Date,
  _end: Date
): Promise<WeeklySomaticSummary> {
  // TODO: Implement when SomaticCheckIn model is added to schema
  return {
    checkInCount: 0,
    dominantState: 'mixed',
    bodyAwareness: 'developing',
    commonSensations: [],
    nervousSystemTrend: 'stable',
  };

}

/**
 * Gather stuck pattern data for the week
 */
async function gatherStuckData(
  userId: string,
  start: Date,
  end: Date
): Promise<WeeklyStuckSummary> {
  const patterns = await prisma.stuckPattern.findMany({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
    },
    select: {
      theme: true,
      resolved: true,
      stuckType: true,
    },
  });

  if (patterns.length === 0) {
    return {
      stuckMoments: 0,
      resolvedCount: 0,
      recurringThemes: [],
      progressNote: null,
    };
  }

  const resolvedCount = patterns.filter(p => p.resolved).length;

  // Find recurring themes
  const themeCounts: Record<string, number> = {};
  for (const p of patterns) {
    if (p.theme) {
      themeCounts[p.theme] = (themeCounts[p.theme] || 0) + 1;
    }
  }
  const recurringThemes = Object.entries(themeCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);

  // Progress note
  let progressNote: string | null = null;
  if (resolvedCount > 0 && resolvedCount === patterns.length) {
    progressNote = 'You worked through all the stuck moments this week';
  } else if (resolvedCount > patterns.length / 2) {
    progressNote = 'Good progress on moving through stuckness';
  } else if (recurringThemes.length > 0) {
    progressNote = `${recurringThemes[0]} keeps showing up - this might be worth deeper exploration`;
  }

  return {
    stuckMoments: patterns.length,
    resolvedCount,
    recurringThemes,
    progressNote,
  };
}

/**
 * Generate user-friendly insights from cross-modal analysis
 */
async function generateDeeperPatterns(userId: string): Promise<string[]> {
  try {
    const analysis = await analyzeCrossModalPatterns(userId, 7);
    const summary = summarizeCrossModalAnalysis(analysis);

    const insights: string[] = [];

    // Add key insight if available
    if (summary.keyInsight) {
      insights.push(summary.keyInsight);
    }

    // Add suggested action
    if (summary.suggestedAction) {
      insights.push(summary.suggestedAction);
    }

    // Check if somatic and dreams/journals show similar nervous system states
    const { byModality } = analysis.nervousSystemTrend;
    if (byModality.somatic && byModality.journals && byModality.somatic === byModality.journals) {
      insights.push('Your body and mind are showing connected patterns this week');
    }

    return insights.slice(0, 3);
  } catch (error) {
    console.error('Error generating deeper patterns:', error);
    return [];
  }
}

// =============================================================================
// PATTERN DETECTION
// =============================================================================

/**
 * Detect patterns across journal and dream content
 */
function detectCrossModalPatterns(
  journals: WeeklyJournalSummary,
  dreams: WeeklyDreamSummary,
  progress: WeeklyProgressSummary
): CrossModalPattern[] {
  const patterns: CrossModalPattern[] = [];

  // Theme alignment between journals and dreams
  const sharedThemes = journals.themes.filter(t =>
    dreams.recurringSymbols.some(s => s.includes(t) || t.includes(s))
  );
  if (sharedThemes.length > 0) {
    patterns.push({
      pattern: `${sharedThemes[0]} appearing in both waking and dream life`,
      sources: ['journal', 'dreams'],
      significance: 'major',
      suggestion: `Your psyche is processing ${sharedThemes[0]} on multiple levels. Pay attention to what emerges.`,
    });
  }

  // Emotional mismatch between journal arc and dream tone
  if (journals.emotionalArc === 'improving' && dreams.emotionalTone === 'negative') {
    patterns.push({
      pattern: 'Waking life improving but dreams processing difficulty',
      sources: ['journal', 'dreams'],
      significance: 'minor',
      suggestion: 'Your dreams may be processing what you\'re not allowing in waking life.',
    });
  }

  // High insight + numinous dreams
  if (journals.dominantTypes.includes('insight') && dreams.dominantTypes.includes('numinous')) {
    patterns.push({
      pattern: 'Convergence of waking insights and meaningful dreams',
      sources: ['journal', 'dreams'],
      significance: 'major',
      suggestion: 'You\'re in a period of psychological opening. Capture what emerges.',
    });
  }

  // Active engagement + declining mood
  if (progress.totalActiveMinutes > 60 && journals.emotionalArc === 'declining') {
    patterns.push({
      pattern: 'High engagement but challenging emotional period',
      sources: ['progress', 'journal'],
      significance: 'minor',
      suggestion: 'Growth work can surface difficult material. This is part of the process.',
    });
  }

  return patterns;
}

/**
 * Generate celebrations from the week
 */
function generateCelebrations(
  journals: WeeklyJournalSummary,
  dreams: WeeklyDreamSummary,
  progress: WeeklyProgressSummary,
  health: WeeklyHealthSummary,
  somatic: WeeklySomaticSummary,
  stuck: WeeklyStuckSummary
): string[] {
  const celebrations: string[] = [];

  if (journals.entryCount >= 5) {
    celebrations.push(`Journaled ${journals.entryCount} times this week - consistent self-reflection`);
  }
  if (journals.dominantTypes.includes('insight')) {
    celebrations.push('Had genuine insights in your journaling');
  }
  if (journals.emotionalArc === 'improving') {
    celebrations.push('Emotional arc trended upward this week');
  }

  if (dreams.dreamCount >= 3) {
    celebrations.push(`Recorded ${dreams.dreamCount} dreams - strong dream recall`);
  }
  if (dreams.dominantTypes.includes('numinous')) {
    celebrations.push('Experienced meaningful/numinous dream content');
  }
  if (dreams.dominantTypes.includes('lucid')) {
    celebrations.push('Had lucid dream experiences');
  }

  if (progress.lessonsCompleted >= 5) {
    celebrations.push(`Completed ${progress.lessonsCompleted} lessons - real commitment`);
  }
  if (progress.coursesProgressed.length >= 2) {
    celebrations.push('Made progress across multiple growth areas');
  }

  if (health.overallTrend === 'growth') {
    celebrations.push('Overall integration health trending upward');
  }
  if (health.dimensionsImproved.length > 0) {
    celebrations.push(`Growth in ${health.dimensionsImproved.join(', ')}`);
  }

  // Somatic celebrations
  if (somatic.checkInCount >= 3) {
    celebrations.push('Checked in with your body regularly');
  }
  if (somatic.bodyAwareness === 'strong') {
    celebrations.push('Strong body awareness practice this week');
  }
  if (somatic.nervousSystemTrend === 'regulating') {
    celebrations.push('Your nervous system is settling into more calm');
  }
  if (somatic.dominantState === 'calm') {
    celebrations.push('Spent most of the week in a regulated state');
  }

  // Stuck celebrations
  if (stuck.resolvedCount > 0) {
    celebrations.push(`Moved through ${stuck.resolvedCount} stuck moment${stuck.resolvedCount > 1 ? 's' : ''}`);
  }
  if (stuck.stuckMoments > 0 && stuck.resolvedCount === stuck.stuckMoments) {
    celebrations.push('Worked through every challenge that arose');
  }

  return celebrations.slice(0, 5);
}

/**
 * Generate invitations for the coming week
 */
function generateInvitations(
  journals: WeeklyJournalSummary,
  dreams: WeeklyDreamSummary,
  progress: WeeklyProgressSummary,
  health: WeeklyHealthSummary,
  somatic: WeeklySomaticSummary,
  stuck: WeeklyStuckSummary,
  patterns: CrossModalPattern[]
): string[] {
  const invitations: string[] = [];

  if (journals.entryCount < 3) {
    invitations.push('Try journaling at least every other day this week');
  }
  if (journals.emotionalArc === 'declining' || journals.emotionalArc === 'fluctuating') {
    invitations.push('Notice patterns in what triggers difficult emotions');
  }

  if (dreams.dreamCount < 2) {
    invitations.push('Keep a dream journal by your bed to improve recall');
  }
  if (dreams.emotionalTone === 'negative') {
    invitations.push('Consider what your challenging dreams might be processing');
  }
  if (dreams.recurringSymbols.length > 0) {
    invitations.push(`Explore what "${dreams.recurringSymbols[0]}" means to you personally`);
  }

  if (progress.lessonsCompleted === 0) {
    invitations.push('Commit to completing at least one lesson this week');
  }
  if (progress.practicesUsed.length === 0) {
    invitations.push('Try one practice from the library this week');
  }

  if (health.dimensionsDeclined.length > 0) {
    invitations.push(`Give attention to ${health.dimensionsDeclined[0]} this week`);
  }

  // Somatic invitations
  if (somatic.checkInCount === 0) {
    invitations.push('Try the Body Companion to tune into how your body feels');
  }
  if (somatic.dominantState === 'activated') {
    invitations.push('Your body has been activated - grounding practices could help');
  }
  if (somatic.dominantState === 'shutdown') {
    invitations.push('Notice where your energy is low - gentle movement might help');
  }
  if (somatic.nervousSystemTrend === 'dysregulated') {
    invitations.push('Your nervous system could use some settling - what helps you feel safe?');
  }

  // Stuck invitations
  if (stuck.progressNote) {
    invitations.push(stuck.progressNote);
  }
  if (stuck.stuckMoments > stuck.resolvedCount && stuck.stuckMoments > 0) {
    invitations.push('Consider revisiting unresolved stuck moments when ready');
  }

  // Add pattern-based invitations
  for (const pattern of patterns.filter(p => p.significance === 'major')) {
    invitations.push(pattern.suggestion);
  }

  return invitations.slice(0, 4);
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generate a complete weekly reflection for a user
 */
export async function generateWeeklyReflection(userId: string): Promise<WeeklyReflection> {
  const { start, end } = getWeekRange();

  // Gather all data in parallel
  const [journals, dreams, progress, health, somatic, stuck, deeperPatterns] = await Promise.all([
    gatherJournalData(userId, start, end),
    gatherDreamData(userId, start, end),
    gatherProgressData(userId, start, end),
    gatherHealthData(userId, start),
    gatherSomaticData(userId, start, end),
    gatherStuckData(userId, start, end),
    generateDeeperPatterns(userId),
  ]);

  // Detect cross-modal patterns
  const patterns = detectCrossModalPatterns(journals, dreams, progress);

  // Generate celebrations and invitations
  const celebrations = generateCelebrations(journals, dreams, progress, health, somatic, stuck);
  const invitations = generateInvitations(journals, dreams, progress, health, somatic, stuck, patterns);

  return {
    period: { start, end },
    journals,
    dreams,
    progress,
    health,
    somatic,
    stuck,
    patterns,
    deeperPatterns,
    celebrations,
    invitations,
  };
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

/**
 * Build prompt for AI-powered weekly reflection synthesis
 */
export function buildWeeklyReflectionPrompt(reflection: WeeklyReflection): string {
  const journalSection = reflection.journals.entryCount > 0
    ? `JOURNAL SUMMARY (${reflection.journals.entryCount} entries):
- Dominant types: ${reflection.journals.dominantTypes.join(', ') || 'varied'}
- Emotional arc: ${reflection.journals.emotionalArc}
- Themes: ${reflection.journals.themes.join(', ') || 'various'}
${reflection.journals.notableInsights.length > 0 ? `- Notable insight: "${reflection.journals.notableInsights[0]}"` : ''}`
    : 'No journal entries this week.';

  const dreamSection = reflection.dreams.dreamCount > 0
    ? `DREAM SUMMARY (${reflection.dreams.dreamCount} dreams):
- Dominant types: ${reflection.dreams.dominantTypes.join(', ') || 'varied'}
- Emotional tone: ${reflection.dreams.emotionalTone}
- Recurring symbols: ${reflection.dreams.recurringSymbols.join(', ') || 'none noted'}
${reflection.dreams.notableContent.length > 0 ? `- Notable dream: "${reflection.dreams.notableContent[0]}"` : ''}`
    : 'No dreams recorded this week.';

  const progressSection = `ENGAGEMENT SUMMARY:
- Lessons completed: ${reflection.progress.lessonsCompleted}
- Courses progressed: ${reflection.progress.coursesProgressed.join(', ') || 'none'}
- Practices used: ${reflection.progress.practicesUsed.join(', ') || 'none'}
- AI tools used: ${reflection.progress.aiToolsUsed.join(', ') || 'none'}`;

  const healthSection = `INTEGRATION HEALTH:
- Overall trend: ${reflection.health.overallTrend}
- Current stage: ${reflection.health.currentStage}
- Improved: ${reflection.health.dimensionsImproved.join(', ') || 'none noted'}
- Needs attention: ${reflection.health.dimensionsDeclined.join(', ') || 'none'}`;

  // Somatic section - user-friendly language about body awareness
  const somaticSection = reflection.somatic.checkInCount > 0
    ? `BODY AWARENESS (${reflection.somatic.checkInCount} check-ins):
- How your body has been: ${reflection.somatic.dominantState === 'calm' ? 'mostly settled and calm' : reflection.somatic.dominantState === 'activated' ? 'often activated or tense' : reflection.somatic.dominantState === 'shutdown' ? 'low energy or withdrawn' : 'varied states'}
- Body awareness: ${reflection.somatic.bodyAwareness}
- Trend: ${reflection.somatic.nervousSystemTrend === 'regulating' ? 'settling into more calm' : reflection.somatic.nervousSystemTrend === 'dysregulated' ? 'some nervous system activation' : 'steady'}
${reflection.somatic.commonSensations.length > 0 ? `- Common sensations: ${reflection.somatic.commonSensations.join(', ')}` : ''}`
    : 'No body check-ins recorded this week.';

  // Stuck section - user-friendly language about challenges
  const stuckSection = reflection.stuck.stuckMoments > 0
    ? `CHALLENGES & STUCKNESS:
- Stuck moments explored: ${reflection.stuck.stuckMoments}
- Worked through: ${reflection.stuck.resolvedCount}
${reflection.stuck.recurringThemes.length > 0 ? `- Recurring themes: ${reflection.stuck.recurringThemes.join(', ')}` : ''}
${reflection.stuck.progressNote ? `- Note: ${reflection.stuck.progressNote}` : ''}`
    : '';

  const patternSection = reflection.patterns.length > 0
    ? `CONNECTIONS ACROSS YOUR WEEK:
${reflection.patterns.map(p => `- ${p.pattern}`).join('\n')}`
    : '';

  // Deeper insights from cross-modal analysis
  const deeperSection = reflection.deeperPatterns.length > 0
    ? `DEEPER PATTERNS:
${reflection.deeperPatterns.map(p => `- ${p}`).join('\n')}`
    : '';

  return `You are a Reflection Guide synthesizing someone's week of inner work.

Your role: Create a meaningful, personal reflection that:
1. Honors what they experienced
2. Connects dots they might not see
3. Celebrates genuine growth
4. Offers forward-looking invitations

IMPORTANT: Speak in warm, accessible language. Avoid clinical or technical terms.
- Say "your body felt calm" not "ventral vagal state"
- Say "moments of clarity" not "high-insight journal entries"
- Say "processing something important" not "cross-modal pattern detected"

---
${journalSection}

${dreamSection}

${somaticSection}

${stuckSection}

${progressSection}

${healthSection}

${patternSection}

${deeperSection}
---

CELEBRATIONS TO POTENTIALLY INCLUDE:
${reflection.celebrations.map(c => `- ${c}`).join('\n')}

INVITATIONS TO POTENTIALLY INCLUDE:
${reflection.invitations.map(i => `- ${i}`).join('\n')}

---

Response format:
- Begin with a brief reflection on the overall week (2-3 sentences)
- Highlight 2-3 celebrations or growth moments
- Note any significant patterns or connections
- Offer 1-2 specific invitations for the coming week
- End with an encouraging closing

Be warm but not saccharine. Direct but compassionate. Personal, not generic.`;
}
