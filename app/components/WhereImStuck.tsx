'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const EXAMPLE_STUCKS = [
  "I keep attracting unavailable partners",
  "I can't seem to set boundaries with family",
  "I feel numb and disconnected from myself",
  "My inner critic won't stop attacking me",
  "I avoid conflict even when I'm being mistreated",
];

export default function WhereImStuck() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [response]);

  const handleSubmit = async (text?: string) => {
    const description = text || input.trim();
    if (!description || isLoading) return;

    setIsExpanded(true);
    setError(null);
    setResponse('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/stuck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stuckDescription: description }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === 'NO_CREDITS') {
          setError('You\'ve run out of AI credits. Visit your profile to get more.');
        } else if (data.code === 'AUTH_REQUIRED') {
          setError('Please sign in to use this feature.');
        } else {
          setError(data.error || 'Something went wrong.');
        }
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  setResponse(prev => prev + data.content);
                }
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse recommendations from response to make them clickable
  const parseResponse = (text: string) => {
    // Simple parsing - look for (type: X, slug: Y) patterns
    const parts = text.split(/(\(type: (?:course|practice|article), slug: [^)]+\))/g);

    return parts.map((part, i) => {
      const match = part.match(/\(type: (course|practice|article), slug: ([^)]+)\)/);
      if (match) {
        const [, type, slug] = match;
        const href = type === 'course' ? `/courses/${slug}`
          : type === 'practice' ? `/practices/${slug}`
          : `/posts/${slug}`;

        return (
          <Link
            key={i}
            href={href}
            className="text-amber-500 hover:text-amber-400 underline"
          >
            View {type} →
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!isExpanded) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">Where are you stuck?</h3>
            <p className="text-gray-500 text-sm">
              Describe what you're struggling with and get matched to the right resources
            </p>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I keep finding myself..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-zinc-500 placeholder-gray-600 resize-none mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_STUCKS.slice(0, 2).map((example, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(example);
                  handleSubmit(example);
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white text-sm font-medium transition-colors"
          >
            Find Resources
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white font-medium text-sm">Recommendations</span>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false);
            setResponse('');
            setInput('');
          }}
          className="text-gray-500 hover:text-gray-300 text-xs"
        >
          Start Over
        </button>
      </div>

      {/* Query */}
      <div className="p-4 bg-zinc-800/50 border-b border-zinc-800">
        <p className="text-gray-400 text-sm italic">"{input}"</p>
      </div>

      {/* Response */}
      <div ref={responseRef} className="p-4">
        {error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
            {parseResponse(response)}
            {isLoading && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
            )}
          </div>
        )}
      </div>

      {/* New Query */}
      {!isLoading && response && (
        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ask about something else..."
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder-gray-600 text-sm"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white text-sm transition-colors"
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
