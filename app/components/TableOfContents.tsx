'use client';

import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const extractedHeadings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      extractedHeadings.push({ id, text, level });
    }

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) {
    return null;
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="table-of-contents hidden xl:block">
      <div className="sticky top-24">
        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-4">
          On this page
        </h4>
        <ul className="space-y-2 text-sm">
          {headings.map(({ id, text, level }) => (
            <li
              key={id}
              className={level === 3 ? 'pl-4' : ''}
            >
              <button
                onClick={() => handleClick(id)}
                className={`text-left transition-colors hover:text-white ${
                  activeId === id
                    ? 'text-white'
                    : 'text-gray-500'
                }`}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
