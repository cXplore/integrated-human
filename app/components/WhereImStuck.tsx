'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface CheckInItem {
  id: string;
  description: string;
  stuckType: string;
  theme: string | null;
  daysAgo: number;
}

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Check-ins state
  const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // Fetch check-ins on mount
  useEffect(() => {
    async function fetchCheckIns() {
      try {
        const res = await fetch('/api/stuck/check-ins');
        if (res.ok) {
          const data = await res.json();
          if (isMountedRef.current) {
            setCheckIns(data.checkIns || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch check-ins:', err);
      }
    }
    fetchCheckIns();
  }, []);

  // Handle check-in response
  const handleCheckInResponse = async (patternId: string, status: 'resolved' | 'still-stuck' | 'dismiss', notes?: string) => {
    setCheckInsLoading(true);
    try {
      const res = await fetch('/api/stuck/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId, status, notes }),
      });

      if (res.ok) {
        // Remove from list
        setCheckIns(prev => prev.filter(c => c.id !== patternId));
        setRespondingTo(null);
      }
    } catch (err) {
      console.error('Failed to respond to check-in:', err);
    } finally {
      setCheckInsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [response]);

  const handleSubmit = useCallback(async (text?: string) => {
    const description = text || input.trim();
    if (!description || isLoading) return;

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsExpanded(true);
    setError(null);
    setResponse('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/stuck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stuckDescription: description }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === 'NO_CREDITS') {
          if (isMountedRef.current) {
            setError('You\'ve run out of AI credits. Visit your profile to get more.');
          }
        } else if (data.code === 'AUTH_REQUIRED') {
          if (isMountedRef.current) {
            setError('Please sign in to use this feature.');
          }
        } else {
          if (isMountedRef.current) {
            setError(data.error || 'Something went wrong.');
          }
        }
        if (isMountedRef.current) {
          setIsLoading(false);
        }
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
                if (data.content && isMountedRef.current) {
                  setResponse(prev => prev + data.content);
                }
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error:', err);
      if (isMountedRef.current) {
        setError('Failed to get recommendations. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [input, isLoading]);

  // Content type icons
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'practice':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'article':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return 'Course';
      case 'practice': return 'Practice';
      case 'article': return 'Article';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40' };
      case 'practice': return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', hover: 'hover:border-rose-500/40' };
      case 'article': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', hover: 'hover:border-amber-500/40' };
      default: return { bg: 'bg-zinc-800', text: 'text-gray-400', border: 'border-zinc-700', hover: 'hover:border-zinc-600' };
    }
  };

  // Parse recommendations from response to create resource cards
  const parseResponse = (text: string) => {
    // Extract recommendation blocks
    const recPattern = /\*\*([^*]+)\*\*\s*\(type:\s*(course|practice|article),\s*slug:\s*([^)]+)\)\s*(?:Why:\s*([^\n]+))?/g;
    const recommendations: Array<{ title: string; type: string; slug: string; why?: string }> = [];

    let match;
    while ((match = recPattern.exec(text)) !== null) {
      recommendations.push({
        title: match[1].trim(),
        type: match[2].trim(),
        slug: match[3].trim(),
        why: match[4]?.trim(),
      });
    }

    // Split text into intro and recommendations section
    const introEndIndex = text.indexOf('RECOMMENDATIONS:');
    const intro = introEndIndex > 0 ? text.slice(0, introEndIndex).trim() : '';

    // Find any closing text after recommendations
    const lastRecMatch = text.lastIndexOf('Why:');
    const closingStartIndex = lastRecMatch > 0 ? text.indexOf('\n\n', lastRecMatch + 50) : -1;
    const closing = closingStartIndex > 0 ? text.slice(closingStartIndex).replace(/^\d+\.\s*\*\*.*$/gm, '').trim() : '';

    // If we found structured recommendations, render cards
    if (recommendations.length > 0) {
      return (
        <div className="space-y-4">
          {/* Intro paragraph */}
          {intro && (
            <p className="text-gray-300 leading-relaxed">{intro}</p>
          )}

          {/* Resource cards */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Recommended Resources</p>
            {recommendations.map((rec, i) => {
              const colors = getTypeColor(rec.type);
              const href = rec.type === 'course' ? `/courses/${rec.slug}`
                : rec.type === 'practice' ? `/practices/${rec.slug}`
                : `/posts/${rec.slug}`;

              return (
                <Link
                  key={i}
                  href={href}
                  className={`block p-4 border ${colors.border} ${colors.hover} bg-zinc-900/50 transition-all group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded ${colors.bg} flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                      {getTypeIcon(rec.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs ${colors.text} uppercase tracking-wide`}>
                          {getTypeLabel(rec.type)}
                        </span>
                      </div>
                      <h4 className="text-white font-medium group-hover:text-gray-200 transition-colors">
                        {rec.title}
                      </h4>
                      {rec.why && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {rec.why}
                        </p>
                      )}
                    </div>
                    <div className="text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Closing text */}
          {closing && !closing.match(/^\d+\.\s/) && (
            <p className="text-gray-400 text-sm mt-4 pt-4 border-t border-zinc-800 italic">
              {closing}
            </p>
          )}
        </div>
      );
    }

    // Fallback: simple text parsing with inline links
    const parts = text.split(/(\(type: (?:course|practice|article), slug: [^)]+\))/g);

    return (
      <div className="space-y-2">
        {parts.map((part, i) => {
          const fallbackMatch = part.match(/\(type: (course|practice|article), slug: ([^)]+)\)/);
          if (fallbackMatch) {
            const [, type, slug] = fallbackMatch;
            const href = type === 'course' ? `/courses/${slug}`
              : type === 'practice' ? `/practices/${slug}`
              : `/posts/${slug}`;

            return (
              <Link
                key={i}
                href={href}
                className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-400 underline"
              >
                View {type}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  if (!isExpanded) {
    return (
      <div className="space-y-4">
        {/* Check-ins section - show pending accountability check-ins */}
        {checkIns.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-amber-400 text-sm font-medium">Check-In Time</span>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              You shared some struggles recently. How are things going?
            </p>

            <div className="space-y-3">
              {checkIns.slice(0, 2).map((checkIn) => (
                <div key={checkIn.id} className="bg-zinc-900 border border-zinc-800 p-3">
                  {respondingTo === checkIn.id ? (
                    <div className="space-y-3">
                      <p className="text-gray-300 text-sm">"{checkIn.description}"</p>
                      <p className="text-gray-500 text-xs">{checkIn.daysAgo} days ago</p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleCheckInResponse(checkIn.id, 'resolved')}
                          disabled={checkInsLoading}
                          className="px-3 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 text-xs hover:bg-green-600/30 transition-colors"
                        >
                          Feeling better
                        </button>
                        <button
                          onClick={() => handleCheckInResponse(checkIn.id, 'still-stuck')}
                          disabled={checkInsLoading}
                          className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-gray-300 text-xs hover:bg-zinc-700 transition-colors"
                        >
                          Still working on it
                        </button>
                        <button
                          onClick={() => handleCheckInResponse(checkIn.id, 'dismiss')}
                          disabled={checkInsLoading}
                          className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(checkIn.id)}
                      className="w-full text-left"
                    >
                      <p className="text-gray-300 text-sm line-clamp-2">"{checkIn.description}"</p>
                      <p className="text-gray-600 text-xs mt-1">{checkIn.daysAgo} days ago - tap to respond</p>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {checkIns.length > 2 && (
              <p className="text-gray-600 text-xs mt-2 text-center">
                +{checkIns.length - 2} more check-ins
              </p>
            )}
          </div>
        )}

        {/* Main input section */}
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
            aria-label="Describe what you're struggling with"
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
            // Abort any in-flight request when starting over
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
            setIsExpanded(false);
            setResponse('');
            setInput('');
            setIsLoading(false);
          }}
          className="text-gray-500 hover:text-gray-300 text-xs"
          aria-label="Start over with a new question"
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
              aria-label="Ask a follow-up question"
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
