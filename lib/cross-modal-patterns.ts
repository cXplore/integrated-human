/**
 * Cross-Modal Pattern Detection Service
 *
 * Detects patterns and connections across different modalities:
 * - Dreams
 * - Journal entries
 * - Somatic experiences
 * - Assessment results
 * - Chat conversations
 *
 * This is a key differentiator - helping users see how their inner world
 * manifests across different channels of expression.
 */

import { prisma } from '@/lib/prisma';
import {
  extractThemes,
  detectNervousSystemState,
  detectPartsWork,
  detectDimensions,
  type ThemeMatch,
  type NervousSystemState,
  type DimensionMatch,
} from '@/lib/classification-utils';

// =============================================================================
// TYPES
// =============================================================================

export interface CrossModalPattern {
  patternId: string;
  patternType: PatternType;
  theme: string;
  description: string;
  strength: number; // 0-1
  confidence: number; // 0-1
  sources: PatternSource[];
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
  insight?: string;
  suggestedExploration?: string;
}

export type PatternType =
  | 'recurring-theme'      // Same theme across modalities
  | 'dream-journal-link'   // Dream content appears in journal
  | 'somatic-dream-link'   // Body sensations match dream imagery
  | 'somatic-journal-link' // Body experiences reflected in writing
  | 'emotional-pattern'    // Consistent emotional state
  | 'nervous-system-trend' // NS state consistency
  | 'parts-pattern'        // Same parts showing up
  | 'shadow-pattern'       // Potential shadow material
  | 'growth-indicator'     // Signs of development
  | 'stuckness-pattern';   // Recurring stuckness

export interface PatternSource {
  type: 'dream' | 'journal' | 'somatic' | 'chat' | 'assessment';
  id: string;
  date: Date;
  excerpt: string;
  relevance: number; // 0-1
}

export interface CrossModalAnalysis {
  userId: string;
  analyzedAt: Date;
  timeframeStart: Date;
  timeframeEnd: Date;
  patterns: CrossModalPattern[];
  nervousSystemTrend: NervousSystemTrend;
  dominantThemes: ThemeMatch[];
  activeDimensions: DimensionMatch[];
  partsActivity: PartsActivity;
  insights: string[];
  suggestedFocus: string[];
}

export interface NervousSystemTrend {
  dominant: NervousSystemState;
  stability: 'stable' | 'fluctuating' | 'improving' | 'declining';
  byModality: {
    dreams: NervousSystemState | null;
    journals: NervousSystemState | null;
    somatic: NervousSystemState | null;
  };
}

export interface PartsActivity {
  activeProtectors: string[];
  activeExiles: string[];
  selfEnergyPresent: boolean;
  recurringParts: string[];
}

// =============================================================================
// DATA FETCHING
// =============================================================================

interface RawModalityData {
  dreams: Array<{
    id: string;
    content: string;
    emotions: string | null;
    interpretation: string | null;
    createdAt: Date;
  }>;
  journals: Array<{
    id: string;
    content: string;
    mood: string | null;
    createdAt: Date;
  }>;
  checkIns: Array<{
    id: string;
    response: string;
    createdAt: Date;
  }>;
}

async function fetchModalityData(
  userId: string,
  timeframeDays: number = 30
): Promise<RawModalityData> {
  const since = new Date();
  since.setDate(since.getDate() - timeframeDays);

  const [dreams, journals, checkIns] = await Promise.all([
    prisma.dreamEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.journalEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.integrationCheckIn.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return { dreams, journals, checkIns };
}

// =============================================================================
// THEME CORRELATION
// =============================================================================

interface ThemeOccurrence {
  theme: string;
  sources: PatternSource[];
  totalStrength: number;
}

function findThemeCorrelations(data: RawModalityData): ThemeOccurrence[] {
  const themeMap = new Map<string, PatternSource[]>();

  // Extract from dreams
  for (const dream of data.dreams) {
    const themes = extractThemes(dream.content + ' ' + (dream.interpretation || ''));
    for (const t of themes) {
      const sources = themeMap.get(t.theme) || [];
      sources.push({
        type: 'dream',
        id: dream.id,
        date: dream.createdAt,
        excerpt: dream.content.slice(0, 100),
        relevance: t.strength,
      });
      themeMap.set(t.theme, sources);
    }
  }

  // Extract from journals
  for (const journal of data.journals) {
    const themes = extractThemes(journal.content);
    for (const t of themes) {
      const sources = themeMap.get(t.theme) || [];
      sources.push({
        type: 'journal',
        id: journal.id,
        date: journal.createdAt,
        excerpt: journal.content.slice(0, 100),
        relevance: t.strength,
      });
      themeMap.set(t.theme, sources);
    }
  }

  // Extract from check-ins
  for (const checkIn of data.checkIns) {
    const themes = extractThemes(checkIn.response);
    for (const t of themes) {
      const sources = themeMap.get(t.theme) || [];
      sources.push({
        type: 'journal', // check-ins are journal-like
        id: checkIn.id,
        date: checkIn.createdAt,
        excerpt: checkIn.response.slice(0, 100),
        relevance: t.strength,
      });
      themeMap.set(t.theme, sources);
    }
  }

  // Build occurrences with cross-modal requirement
  const occurrences: ThemeOccurrence[] = [];
  for (const [theme, sources] of themeMap.entries()) {
    // Only include if theme appears in multiple modalities
    const modalityTypes = new Set(sources.map(s => s.type));
    if (modalityTypes.size >= 2 || sources.length >= 3) {
      occurrences.push({
        theme,
        sources,
        totalStrength: sources.reduce((sum, s) => sum + s.relevance, 0),
      });
    }
  }

  return occurrences.sort((a, b) => b.totalStrength - a.totalStrength);
}

// =============================================================================
// DREAM-JOURNAL LINKS
// =============================================================================

function findDreamJournalLinks(data: RawModalityData): CrossModalPattern[] {
  const patterns: CrossModalPattern[] = [];

  // Look for keyword overlaps between dreams and journals within 7 days
  for (const dream of data.dreams) {
    const dreamWords = new Set(
      dream.content.toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 4)
    );

    // Find journals within 7 days before/after
    const nearbyJournals = data.journals.filter(j => {
      const diff = Math.abs(j.createdAt.getTime() - dream.createdAt.getTime());
      return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
    });

    for (const journal of nearbyJournals) {
      const journalWords = new Set(
        journal.content.toLowerCase()
          .split(/\W+/)
          .filter(w => w.length > 4)
      );

      // Find overlapping meaningful words
      const overlap = [...dreamWords].filter(w => journalWords.has(w));
      const significantOverlap = overlap.filter(w =>
        !['about', 'would', 'could', 'should', 'there', 'where', 'which', 'their', 'being', 'having'].includes(w)
      );

      if (significantOverlap.length >= 3) {
        patterns.push({
          patternId: `dream-journal-${dream.id}-${journal.id}`,
          patternType: 'dream-journal-link',
          theme: significantOverlap.slice(0, 3).join(', '),
          description: `Your dream imagery appears in your journal writing`,
          strength: Math.min(1, significantOverlap.length / 5),
          confidence: 0.7,
          sources: [
            {
              type: 'dream',
              id: dream.id,
              date: dream.createdAt,
              excerpt: dream.content.slice(0, 100),
              relevance: 1,
            },
            {
              type: 'journal',
              id: journal.id,
              date: journal.createdAt,
              excerpt: journal.content.slice(0, 100),
              relevance: 1,
            },
          ],
          firstSeen: dream.createdAt < journal.createdAt ? dream.createdAt : journal.createdAt,
          lastSeen: dream.createdAt > journal.createdAt ? dream.createdAt : journal.createdAt,
          occurrences: 1,
          insight: `The words "${significantOverlap.slice(0, 3).join('", "')}" appear in both your dream and journal. This suggests your unconscious is working on something your conscious mind is also processing.`,
          suggestedExploration: `What does "${significantOverlap[0]}" mean to you right now? How does it show up differently in your dreams vs waking thoughts?`,
        });
      }
    }
  }

  return patterns;
}

// =============================================================================
// NERVOUS SYSTEM TREND ANALYSIS
// =============================================================================

function analyzeNervousSystemTrend(data: RawModalityData): NervousSystemTrend {
  const allStates: { state: NervousSystemState; date: Date; modality: 'dreams' | 'journals' }[] = [];

  // From dreams
  for (const dream of data.dreams) {
    const ns = detectNervousSystemState(dream.content);
    allStates.push({ state: ns.state, date: dream.createdAt, modality: 'dreams' });
  }

  // From journals
  for (const journal of data.journals) {
    const ns = detectNervousSystemState(journal.content);
    allStates.push({ state: ns.state, date: journal.createdAt, modality: 'journals' });
  }

  // Count states by modality
  const dreamStates = allStates.filter(s => s.modality === 'dreams');
  const journalStates = allStates.filter(s => s.modality === 'journals');

  function dominantState(states: typeof allStates): NervousSystemState | null {
    if (states.length === 0) return null;
    const counts: Record<NervousSystemState, number> = { ventral: 0, sympathetic: 0, dorsal: 0, mixed: 0 };
    for (const s of states) counts[s.state]++;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as NervousSystemState;
  }

  // Determine trend
  const sortedByDate = [...allStates].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstHalf = sortedByDate.slice(0, Math.floor(sortedByDate.length / 2));
  const secondHalf = sortedByDate.slice(Math.floor(sortedByDate.length / 2));

  const firstDom = dominantState(firstHalf);
  const secondDom = dominantState(secondHalf);

  let stability: NervousSystemTrend['stability'] = 'stable';
  if (firstDom !== secondDom && firstDom !== null && secondDom !== null) {
    // Moving toward ventral is improving
    if (secondDom === 'ventral') {
      stability = 'improving';
    // Moving from dorsal to sympathetic is also progress (more energy)
    } else if (firstDom === 'dorsal' && secondDom === 'sympathetic') {
      stability = 'improving';
    // Moving away from ventral or toward dorsal is declining
    } else if (secondDom === 'dorsal') {
      stability = 'declining';
    } else if (firstDom === 'ventral') {
      stability = 'declining';
    } else {
      stability = 'fluctuating';
    }
  }

  return {
    dominant: dominantState(allStates) || 'ventral',
    stability,
    byModality: {
      dreams: dominantState(dreamStates),
      journals: dominantState(journalStates),
      somatic: null, // Would need somatic history
    },
  };
}

// =============================================================================
// PARTS PATTERN DETECTION
// =============================================================================

function analyzePartsPatterns(data: RawModalityData): PartsActivity {
  const allContent = [
    ...data.dreams.map(d => d.content),
    ...data.journals.map(j => j.content),
    ...data.checkIns.map(c => c.response),
  ].join(' ');

  const parts = detectPartsWork(allContent);

  // Track recurring parts across entries
  const partsCounts = new Map<string, number>();
  for (const dream of data.dreams) {
    const dreamParts = detectPartsWork(dream.content);
    for (const p of dreamParts.suggestedParts) {
      partsCounts.set(p, (partsCounts.get(p) || 0) + 1);
    }
  }
  for (const journal of data.journals) {
    const journalParts = detectPartsWork(journal.content);
    for (const p of journalParts.suggestedParts) {
      partsCounts.set(p, (partsCounts.get(p) || 0) + 1);
    }
  }

  const recurringParts = [...partsCounts.entries()]
    .filter(([_, count]) => count >= 2)
    .map(([part]) => part);

  return {
    activeProtectors: parts.suggestedParts.filter(p =>
      /Critic|Manager|Perfectionist|Pleaser|Avoider|Firefighter/i.test(p)
    ),
    activeExiles: parts.suggestedParts.filter(p =>
      /Child|Wounded|Shame|Abandon/i.test(p)
    ),
    selfEnergyPresent: parts.selfEnergyIndicators,
    recurringParts,
  };
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

export async function analyzeCrossModalPatterns(
  userId: string,
  timeframeDays: number = 30
): Promise<CrossModalAnalysis> {
  const timeframeStart = new Date();
  timeframeStart.setDate(timeframeStart.getDate() - timeframeDays);
  const timeframeEnd = new Date();

  // Fetch all modality data
  const data = await fetchModalityData(userId, timeframeDays);

  // Analyze patterns
  const themeCorrelations = findThemeCorrelations(data);
  const dreamJournalLinks = findDreamJournalLinks(data);
  const nervousSystemTrend = analyzeNervousSystemTrend(data);
  const partsActivity = analyzePartsPatterns(data);

  // Build patterns from theme correlations
  const themePatterns: CrossModalPattern[] = themeCorrelations.slice(0, 5).map((tc, i) => ({
    patternId: `theme-${tc.theme}-${Date.now()}`,
    patternType: 'recurring-theme' as PatternType,
    theme: tc.theme,
    description: `"${tc.theme}" appears across ${tc.sources.length} entries in multiple modalities`,
    strength: Math.min(1, tc.totalStrength / 3),
    confidence: Math.min(1, tc.sources.length / 5),
    sources: tc.sources.slice(0, 4),
    firstSeen: tc.sources.reduce((min, s) => s.date < min ? s.date : min, tc.sources[0].date),
    lastSeen: tc.sources.reduce((max, s) => s.date > max ? s.date : max, tc.sources[0].date),
    occurrences: tc.sources.length,
    insight: generateThemeInsight(tc.theme, tc.sources),
    suggestedExploration: generateThemeExploration(tc.theme),
  }));

  // Combine all patterns
  const allPatterns = [...themePatterns, ...dreamJournalLinks];

  // Aggregate themes and dimensions
  const allText = [
    ...data.dreams.map(d => d.content),
    ...data.journals.map(j => j.content),
  ].join(' ');

  const dominantThemes = extractThemes(allText, 5);
  const activeDimensions = detectDimensions(allText, 5);

  // Generate insights
  const insights = generateInsights(allPatterns, nervousSystemTrend, partsActivity, dominantThemes);
  const suggestedFocus = generateSuggestedFocus(allPatterns, nervousSystemTrend, partsActivity);

  return {
    userId,
    analyzedAt: new Date(),
    timeframeStart,
    timeframeEnd,
    patterns: allPatterns,
    nervousSystemTrend,
    dominantThemes,
    activeDimensions,
    partsActivity,
    insights,
    suggestedFocus,
  };
}

// =============================================================================
// INSIGHT GENERATION
// =============================================================================

function generateThemeInsight(theme: string, sources: PatternSource[]): string {
  const modalities = [...new Set(sources.map(s => s.type))];
  const modalityStr = modalities.join(' and ');

  const insights: Record<string, string> = {
    relationships: `Relationship themes are appearing in your ${modalityStr}. This often indicates this area of life is calling for attention.`,
    anxiety: `Anxiety is showing up across your ${modalityStr}. Your psyche seems to be processing worry or fear.`,
    family: `Family dynamics are emerging in your ${modalityStr}. Old patterns may be asking for integration.`,
    work: `Work themes are present in your ${modalityStr}. Consider what your deeper self is saying about your vocation.`,
    grief: `Loss and grief are moving through your ${modalityStr}. This is sacred processing work.`,
    boundaries: `Boundary themes keep appearing. Something in you is working on self-protection and limits.`,
    identity: `Questions of identity are arising. You may be in a period of transformation.`,
    connection: `Longing for connection appears across modalities. Your attachment system is active.`,
    meaning: `Questions of meaning and purpose are emerging. Your soul is seeking direction.`,
    body: `Body awareness is showing up repeatedly. The soma is asking to be heard.`,
  };

  return insights[theme] || `The theme of "${theme}" is appearing across your ${modalityStr}, suggesting this is important material for your psyche right now.`;
}

function generateThemeExploration(theme: string): string {
  const explorations: Record<string, string> = {
    relationships: `Notice where relationship patterns show up in your body. What does connection feel like somatically?`,
    anxiety: `When anxiety appears, can you locate it in your body? What does it need from you?`,
    family: `Whose voice do you hear when family themes arise? What younger part might be carrying this?`,
    work: `If your work dreams could speak, what would they say about your calling?`,
    grief: `Can you make space for the grief without trying to fix it? What does it want to tell you?`,
    boundaries: `Where in your body do you feel the need for boundaries? What protector might be active?`,
    identity: `Who are you becoming? What old identity is being shed?`,
    connection: `What does your longing for connection feel like in your chest? In your belly?`,
    meaning: `If your life had a purpose statement right now, what might it be?`,
    body: `What is your body trying to communicate? Can you listen without judgment?`,
  };

  return explorations[theme] || `Sit with "${theme}" and notice what arises. What feels unfinished here?`;
}

function generateInsights(
  patterns: CrossModalPattern[],
  nsTrend: NervousSystemTrend,
  parts: PartsActivity,
  themes: ThemeMatch[]
): string[] {
  const insights: string[] = [];

  // Nervous system insight
  if (nsTrend.stability === 'improving') {
    insights.push('Your nervous system appears to be trending toward more regulation. This is positive movement.');
  } else if (nsTrend.stability === 'declining') {
    insights.push('Your nervous system may be under increased stress. Extra gentleness and resourcing could help.');
  } else if (nsTrend.dominant === 'dorsal') {
    insights.push('Shutdown/collapse patterns are prominent. Small titrated movements toward activation may help.');
  } else if (nsTrend.dominant === 'sympathetic') {
    insights.push('Activation is prominent across modalities. Grounding and discharge practices may be supportive.');
  }

  // Parts insight
  if (parts.recurringParts.length > 0) {
    insights.push(`The ${parts.recurringParts[0]} keeps showing up. This part may need acknowledgment and dialogue.`);
  }
  if (parts.activeProtectors.length > 0 && parts.activeExiles.length > 0) {
    insights.push('Both protector and exile parts are active. There may be internal conflict asking for witnessing.');
  }

  // Pattern insights
  if (patterns.length >= 3) {
    insights.push(`${patterns.length} cross-modal patterns detected. Your psyche is processing material across multiple channels.`);
  }

  const dreamJournalLinks = patterns.filter(p => p.patternType === 'dream-journal-link');
  if (dreamJournalLinks.length > 0) {
    insights.push('Dream content is appearing in your waking reflections - conscious and unconscious are in dialogue.');
  }

  // Theme insights
  if (themes.length > 0) {
    insights.push(`"${themes[0].theme}" is your dominant theme right now. Consider what growth edge this represents.`);
  }

  return insights;
}

function generateSuggestedFocus(
  patterns: CrossModalPattern[],
  nsTrend: NervousSystemTrend,
  parts: PartsActivity
): string[] {
  const suggestions: string[] = [];

  // Based on nervous system
  if (nsTrend.dominant === 'sympathetic') {
    suggestions.push('Grounding practice: feet on floor, slow exhale, orienting to safety');
  } else if (nsTrend.dominant === 'dorsal') {
    suggestions.push('Gentle activation: micro-movements, warm drink, humming');
  }

  // Based on parts
  if (parts.activeProtectors.length > 0) {
    suggestions.push(`Acknowledge your ${parts.activeProtectors[0]}: thank it for trying to help`);
  }
  if (parts.activeExiles.length > 0 && parts.selfEnergyPresent) {
    suggestions.push('Approach wounded parts with curiosity, not fixing energy');
  }

  // Based on patterns
  const topPattern = patterns[0];
  if (topPattern?.suggestedExploration) {
    suggestions.push(topPattern.suggestedExploration);
  }

  // General
  suggestions.push('Journal prompt: What is trying to emerge in me right now?');

  return suggestions.slice(0, 4);
}

// =============================================================================
// API-FRIENDLY SUMMARY
// =============================================================================

export interface CrossModalSummary {
  hasPatterns: boolean;
  patternCount: number;
  topPatterns: Array<{
    type: PatternType;
    theme: string;
    description: string;
    strength: number;
  }>;
  nervousSystem: {
    dominant: NervousSystemState;
    trend: string;
  };
  dominantThemes: string[];
  keyInsight: string;
  suggestedAction: string;
}

export function summarizeCrossModalAnalysis(analysis: CrossModalAnalysis): CrossModalSummary {
  return {
    hasPatterns: analysis.patterns.length > 0,
    patternCount: analysis.patterns.length,
    topPatterns: analysis.patterns.slice(0, 3).map(p => ({
      type: p.patternType,
      theme: p.theme,
      description: p.description,
      strength: p.strength,
    })),
    nervousSystem: {
      dominant: analysis.nervousSystemTrend.dominant,
      trend: analysis.nervousSystemTrend.stability,
    },
    dominantThemes: analysis.dominantThemes.map(t => t.theme),
    keyInsight: analysis.insights[0] || 'Continue exploring your inner world.',
    suggestedAction: analysis.suggestedFocus[0] || 'Notice what wants attention today.',
  };
}
