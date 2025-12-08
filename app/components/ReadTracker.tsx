'use client';

import { useEffect, useRef } from 'react';
import { useReadingList } from './ReadingListContext';

interface ReadTrackerProps {
  slug: string;
}

export default function ReadTracker({ slug }: ReadTrackerProps) {
  const { markAsRead, isRead } = useReadingList();
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    // Don't track if already read
    if (isRead(slug) || hasMarkedRef.current) return;

    const handleScroll = () => {
      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      // Mark as read when user scrolls past 75%
      if (scrollPercent >= 75 && !hasMarkedRef.current) {
        hasMarkedRef.current = true;
        markAsRead(slug);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, markAsRead, isRead]);

  return null;
}
