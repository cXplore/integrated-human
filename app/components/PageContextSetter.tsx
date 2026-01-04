'use client';

import { useEffect } from 'react';
import { useAICompanion, type PageContext } from './AICompanionContext';

interface PageContextSetterProps {
  type: PageContext['type'];
  title?: string;
  slug?: string;
  /** Raw content to provide as context for AI (will be truncated) */
  content?: string;
}

/**
 * Truncates content to a reasonable size for AI context
 * Tries to break at sentence boundaries when possible
 */
function truncateContent(content: string, maxLength: number = 800): string {
  if (!content) return '';

  // Remove MDX/markdown syntax for cleaner context
  const cleaned = content
    .replace(/^---[\s\S]*?---/m, '') // Remove frontmatter
    .replace(/<[^>]+>/g, '') // Remove JSX/HTML tags
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/^#+\s+/gm, '') // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();

  if (cleaned.length <= maxLength) return cleaned;

  // Try to break at a sentence boundary
  const truncated = cleaned.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('. ');
  const lastQuestion = truncated.lastIndexOf('? ');
  const lastExclaim = truncated.lastIndexOf('! ');
  const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim);

  if (breakPoint > maxLength * 0.6) {
    return truncated.slice(0, breakPoint + 1);
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > maxLength * 0.8
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * A hidden component that sets the page context for the AI companion.
 * Place this component on pages where you want the AI to know what the user is viewing.
 */
export default function PageContextSetter({ type, title, slug, content }: PageContextSetterProps) {
  const { setPageContext } = useAICompanion();

  useEffect(() => {
    const contentSnippet = content ? truncateContent(content) : undefined;
    setPageContext({ type, title, slug, contentSnippet });

    // Reset context when leaving page
    return () => {
      setPageContext({ type: 'other', title: undefined, slug: undefined, contentSnippet: undefined });
    };
  }, [type, title, slug, content, setPageContext]);

  // This component renders nothing
  return null;
}
