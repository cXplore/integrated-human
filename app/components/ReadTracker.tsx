'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useReadingList } from './ReadingListContext';

interface ReadTrackerProps {
  slug: string;
}

export default function ReadTracker({ slug }: ReadTrackerProps) {
  const { data: session } = useSession();
  const { markAsRead, isRead } = useReadingList();
  const hasMarkedRef = useRef(false);
  const lastSavedProgress = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);

  // Save progress to database (debounced)
  const saveProgress = useCallback(async (scrollPercent: number) => {
    if (!session?.user) return;

    // Only save if progress increased by at least 5%
    if (scrollPercent - lastSavedProgress.current < 5) return;

    lastSavedProgress.current = scrollPercent;

    try {
      await fetch('/api/article-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          scrollProgress: Math.round(scrollPercent),
        }),
      });
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  }, [session?.user, slug]);

  // Restore scroll position on mount
  useEffect(() => {
    if (!session?.user || hasRestoredScroll) return;

    const restorePosition = async () => {
      try {
        const res = await fetch('/api/article-progress');
        if (res.ok) {
          const progress = await res.json();
          const articleProgress = progress.find((p: { slug: string }) => p.slug === slug);

          if (articleProgress?.scrollProgress > 0 && articleProgress.scrollProgress < 90) {
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 500));

            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const targetScroll = (articleProgress.scrollProgress / 100) * docHeight;

            // Scroll to saved position
            window.scrollTo({ top: targetScroll, behavior: 'smooth' });

            lastSavedProgress.current = articleProgress.scrollProgress;
          }
        }
      } catch (error) {
        console.error('Error restoring reading progress:', error);
      } finally {
        setHasRestoredScroll(true);
      }
    };

    restorePosition();
  }, [session?.user, slug, hasRestoredScroll]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      // Mark as read locally when user scrolls past 75%
      if (scrollPercent >= 75 && !hasMarkedRef.current && !isRead(slug)) {
        hasMarkedRef.current = true;
        markAsRead(slug);
      }

      // Debounce saving to database
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(scrollPercent);
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [slug, markAsRead, isRead, saveProgress]);

  // Save progress on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (!session?.user) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      // Use sendBeacon for reliable unload saving
      const data = JSON.stringify({
        slug,
        scrollProgress: Math.round(scrollPercent),
      });

      navigator.sendBeacon('/api/article-progress', data);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [session?.user, slug]);

  return null;
}
