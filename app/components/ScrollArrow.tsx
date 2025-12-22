'use client';

import { useState, useEffect } from 'react';

export default function ScrollArrow() {
  const [opacity, setOpacity] = useState(0.4);

  useEffect(() => {
    const handleScroll = () => {
      // Fade out over the first 150px of scroll
      const scrollY = window.scrollY;
      const newOpacity = Math.max(0, 0.4 - (scrollY / 150) * 0.4);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (opacity === 0) return null;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-slow-bounce"
      style={{ opacity }}
    >
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  );
}
