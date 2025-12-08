'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardNavProps {
  prevSlug?: string | null;
  nextSlug?: string | null;
}

export default function KeyboardNav({ prevSlug, nextSlug }: KeyboardNavProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Left arrow or 'j' for previous
      if ((e.key === 'ArrowLeft' || e.key === 'j') && prevSlug) {
        router.push(`/posts/${prevSlug}`);
      }

      // Right arrow or 'k' for next
      if ((e.key === 'ArrowRight' || e.key === 'k') && nextSlug) {
        router.push(`/posts/${nextSlug}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlug, nextSlug, router]);

  // Show keyboard hints at the bottom
  if (!prevSlug && !nextSlug) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-xs text-gray-600 bg-zinc-900/80 backdrop-blur px-4 py-2 border border-zinc-800 rounded">
      {prevSlug && (
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-gray-400">←</kbd>
          <span>Previous</span>
        </span>
      )}
      {nextSlug && (
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-gray-400">→</kbd>
          <span>Next</span>
        </span>
      )}
    </div>
  );
}
