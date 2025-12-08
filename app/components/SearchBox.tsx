'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  categories: string[];
  readingTime: number;
}

interface SearchBoxProps {
  onClose?: () => void;
  autoFocus?: boolean;
}

export default function SearchBox({ onClose, autoFocus = true }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const searchPosts = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchPosts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 pr-10 focus:outline-none focus:border-zinc-500 placeholder-gray-500"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-2 bg-zinc-900 border border-zinc-800 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-gray-400 text-center">Searching...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((result) => (
                <Link
                  key={result.slug}
                  href={`/posts/${result.slug}`}
                  onClick={onClose}
                  className="block p-4 hover:bg-zinc-800 border-b border-zinc-800 last:border-b-0 transition-colors"
                >
                  <h3 className="font-serif text-lg text-white mb-1">
                    {result.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {result.excerpt}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{result.categories.join(', ')}</span>
                    <span>{result.readingTime} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-gray-400 text-center">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
