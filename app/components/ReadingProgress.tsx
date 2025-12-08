'use client';

import { useState, useEffect } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      // Find the article prose content
      const articleContent = document.querySelector('article .prose');

      if (articleContent) {
        const rect = articleContent.getBoundingClientRect();
        const articleTop = rect.top + window.scrollY;
        const articleHeight = rect.height;
        const articleEnd = articleTop + articleHeight;

        // Calculate how far we've scrolled through the article
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;

        // Start tracking when the article starts entering the viewport
        // End at 100% when we've scrolled past the article content
        const startPoint = articleTop - viewportHeight * 0.3; // Start a bit before article begins
        const endPoint = articleEnd - viewportHeight * 0.5; // End when ~halfway past article end

        const scrollRange = endPoint - startPoint;
        const currentPosition = scrollTop - startPoint;

        const scrollPercent = scrollRange > 0 ? (currentPosition / scrollRange) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, scrollPercent)));
      } else {
        // Fallback to full page tracking if no article found
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, scrollPercent)));
      }
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="reading-progress fixed top-0 left-0 w-full h-1 bg-zinc-800 z-50">
      <div
        className="h-full bg-white transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
