/**
 * Context Budget Management
 *
 * Ensures total context sent to AI doesn't exceed reasonable limits.
 * Prioritizes essential context and truncates lower priority items.
 */

import { estimateTokens } from './ai-credits';

// Max tokens for entire system prompt (leaving room for user message + response)
const MAX_CONTEXT_TOKENS = 2000;

// Priority levels for different context types
type ContextPriority = 'critical' | 'high' | 'medium' | 'low';

interface ContextSection {
  key: string;
  content: string;
  priority: ContextPriority;
  /** Max tokens for this section (will be truncated if exceeded) */
  maxTokens?: number;
}

/**
 * Priority weights - higher = keep more content
 */
const PRIORITY_WEIGHTS: Record<ContextPriority, number> = {
  critical: 1.0, // Never truncate
  high: 0.8,
  medium: 0.5,
  low: 0.3,
};

/**
 * Truncate text to fit within token limit, breaking at sentence boundaries
 */
function truncateToTokens(text: string, maxTokens: number): string {
  if (!text) return '';

  const currentTokens = estimateTokens(text);
  if (currentTokens <= maxTokens) return text;

  // Approximate character limit (4 chars per token)
  const maxChars = maxTokens * 4;
  const truncated = text.slice(0, maxChars);

  // Try to break at sentence boundary
  const lastPeriod = truncated.lastIndexOf('. ');
  const lastNewline = truncated.lastIndexOf('\n');
  const breakPoint = Math.max(lastPeriod, lastNewline);

  if (breakPoint > maxChars * 0.6) {
    return truncated.slice(0, breakPoint + 1);
  }

  return truncated.trim() + '...';
}

/**
 * Build a budget-aware system prompt from multiple context sections
 */
export function buildBudgetedContext(sections: ContextSection[]): string {
  // Calculate initial token usage
  let totalTokens = 0;
  const sectionTokens: Array<{ section: ContextSection; tokens: number }> = [];

  for (const section of sections) {
    if (!section.content) continue;
    const tokens = estimateTokens(section.content);
    totalTokens += tokens;
    sectionTokens.push({ section, tokens });
  }

  // If within budget, return as-is
  if (totalTokens <= MAX_CONTEXT_TOKENS) {
    return sections
      .filter(s => s.content)
      .map(s => s.content)
      .join('\n\n');
  }

  // Need to trim - start with lowest priority sections
  const sortedByPriority = [...sectionTokens].sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.section.priority];
    const weightB = PRIORITY_WEIGHTS[b.section.priority];
    return weightA - weightB; // Lowest priority first
  });

  let tokensToTrim = totalTokens - MAX_CONTEXT_TOKENS;
  const trimmedSections = new Map<string, string>();

  for (const { section, tokens } of sortedByPriority) {
    if (tokensToTrim <= 0) break;

    if (section.priority === 'critical') continue; // Never trim critical

    // Calculate how much to keep based on priority
    const keepRatio = PRIORITY_WEIGHTS[section.priority];
    const maxKeepTokens = section.maxTokens
      ? Math.min(section.maxTokens, Math.floor(tokens * keepRatio))
      : Math.floor(tokens * keepRatio);

    const tokensToRemove = tokens - maxKeepTokens;

    if (tokensToRemove > 0) {
      const truncated = truncateToTokens(section.content, maxKeepTokens);
      trimmedSections.set(section.key, truncated);
      tokensToTrim -= tokensToRemove;
    }
  }

  // Rebuild with trimmed sections
  return sections
    .filter(s => s.content)
    .map(s => trimmedSections.get(s.key) ?? s.content)
    .join('\n\n');
}

/**
 * Create a context section with proper typing
 */
export function createSection(
  key: string,
  content: string | undefined | null,
  priority: ContextPriority,
  maxTokens?: number
): ContextSection {
  return {
    key,
    content: content || '',
    priority,
    maxTokens,
  };
}

/**
 * Quick check if we're approaching token limits
 */
export function isApproachingLimit(text: string, threshold = 0.8): boolean {
  const tokens = estimateTokens(text);
  return tokens >= MAX_CONTEXT_TOKENS * threshold;
}
