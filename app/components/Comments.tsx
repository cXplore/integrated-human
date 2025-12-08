'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

interface CommentsProps {
  slug: string;
}

export default function Comments({ slug }: CommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing comments
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'cXplore/integrated-human');
    script.setAttribute('data-repo-id', 'R_kgDOQi0-Kw');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOQi0-K84Czi3V');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark_dimmed');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    containerRef.current.appendChild(script);
  }, [slug, theme]);

  return (
    <div className="mt-16 pt-12 border-t border-zinc-800">
      <h2 className="font-serif text-2xl font-light text-white mb-8">
        Discussion
      </h2>
      <div ref={containerRef} className="giscus" />
    </div>
  );
}
