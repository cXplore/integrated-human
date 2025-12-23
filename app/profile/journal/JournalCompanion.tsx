'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
}

interface JournalInsight {
  recentMoods: string[];
  topThemes: string[];
  avgWordCount: number;
  totalEntries: number;
}

// Time-aware prompts
function getTimeAwarePrompts(): string[] {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    // Morning - reflection on yesterday, intention for today
    return [
      "What's on my mind as I start this day?",
      "Help me process what I wrote yesterday",
      "What intention would serve me today?",
    ];
  } else if (hour >= 12 && hour < 17) {
    // Afternoon - mid-day check-in
    return [
      "What patterns am I noticing this week?",
      "What's asking for my attention right now?",
      "Help me explore a recurring theme",
    ];
  } else if (hour >= 17 && hour < 21) {
    // Evening - reflection, processing
    return [
      "What wants to be released from today?",
      "What emotions am I carrying tonight?",
      "Help me find closure on something",
    ];
  } else {
    // Night - deeper work
    return [
      "What's keeping me awake?",
      "What might I be avoiding?",
      "Help me understand a difficult feeling",
    ];
  }
}

const DEFAULT_PROMPTS = [
  "What patterns do you notice in my writing?",
  "What emotions are recurring for me?",
  "What questions should I be asking?",
];

export default function JournalCompanion() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showEntryPicker, setShowEntryPicker] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [insights, setInsights] = useState<JournalInsight | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Time-aware prompts
  const starterPrompts = getTimeAwarePrompts();

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch recent entries and insights
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entriesRes, insightsRes] = await Promise.all([
          fetch('/api/journal?limit=10'),
          fetch('/api/journal/insights'),
        ]);

        const entriesData = await entriesRes.json();
        if (entriesData.entries) {
          setEntries(entriesData.entries);
        }

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          setInsights(insightsData);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);
    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/journal/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          selectedEntry: selectedEntry ? selectedEntry.content : null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (isMountedRef.current) {
          if (errorData.code === 'NO_CREDITS') {
            setError('You\'ve run out of AI credits. Visit your profile to get more.');
          } else if (errorData.code === 'AUTH_REQUIRED') {
            setError('Please sign in to use the journal companion.');
          } else {
            setError(errorData.message || 'Something went wrong. Please try again.');
          }
          setIsLoading(false);
        }
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage: Message = { role: 'assistant', content: '' };
      if (isMountedRef.current) {
        setMessages(prev => [...prev, assistantMessage]);
      }

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
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                      lastMsg.content += data.content;
                    }
                    return updated;
                  });
                }
                if (data.done && data.usage && isMountedRef.current) {
                  setTokenBalance(data.usage.remainingBalance);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Chat error:', err);
      if (isMountedRef.current) {
        setError('Failed to connect to the AI. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [input, isLoading, messages, selectedEntry]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'late night';
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-white font-medium">Journal Companion</h3>
          <p className="text-gray-500 text-sm">
            {getTimeGreeting()} reflection
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Insights Toggle */}
          {insights && insights.totalEntries > 0 && (
            <button
              onClick={() => setShowInsights(!showInsights)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showInsights
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              Insights
            </button>
          )}
          {tokenBalance !== null && (
            <div className="text-gray-500 text-xs">
              {tokenBalance.toLocaleString()} tokens
            </div>
          )}
        </div>
      </div>

      {/* Insights Panel */}
      {showInsights && insights && (
        <div className="mb-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Entries:</span>{' '}
              <span className="text-white">{insights.totalEntries}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg words:</span>{' '}
              <span className="text-white">{insights.avgWordCount}</span>
            </div>
            {insights.recentMoods.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Recent moods:</span>{' '}
                <span className="text-amber-400">{insights.recentMoods.slice(0, 3).join(', ')}</span>
              </div>
            )}
            {insights.topThemes.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Themes:</span>{' '}
                <span className="text-gray-300">{insights.topThemes.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entry Selector */}
      <div className="mb-4">
        <button
          onClick={() => setShowEntryPicker(!showEntryPicker)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          aria-expanded={showEntryPicker}
          aria-label="Select a journal entry to discuss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {selectedEntry ? (
            <span className="text-amber-400">
              Focusing on: {selectedEntry.title || formatDate(selectedEntry.createdAt)}
            </span>
          ) : (
            <span>Select an entry to discuss (optional)</span>
          )}
          <svg
            className={`w-3 h-3 transition-transform ${showEntryPicker ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showEntryPicker && (
          <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg max-h-48 overflow-y-auto" role="listbox" aria-label="Journal entries">
            <button
              onClick={() => {
                setSelectedEntry(null);
                setShowEntryPicker(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors rounded-t-lg ${
                !selectedEntry ? 'text-amber-400' : 'text-gray-400'
              }`}
            >
              Use all recent entries as context
            </button>
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  setSelectedEntry(entry);
                  setShowEntryPicker(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors border-t border-zinc-800 ${
                  selectedEntry?.id === entry.id ? 'text-amber-400' : 'text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">{formatDate(entry.createdAt)}</span>
                  {entry.mood && (
                    <span className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded text-gray-400">
                      {entry.mood}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate">
                  {entry.title || entry.content.slice(0, 50) + '...'}
                </div>
              </button>
            ))}
            {entries.length === 0 && (
              <p className="px-4 py-3 text-gray-500 text-sm">
                No journal entries yet. Write some entries first.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">Start a conversation</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
              Ask me about your journal entries. I can help you find patterns, explore emotions, or deepen your reflections.
            </p>

            {/* Time-aware prompts */}
            <div className="w-full max-w-sm space-y-2">
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-2">
                {getTimeGreeting()} prompts
              </p>
              {starterPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(prompt)}
                  className="w-full px-4 py-2.5 text-sm text-left text-gray-400 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-amber-500/30 hover:text-white transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* More prompts toggle */}
            <button
              onClick={() => {}}
              className="mt-4 text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              <details className="cursor-pointer">
                <summary>More prompts</summary>
                <div className="mt-2 space-y-1 text-left">
                  {DEFAULT_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubmit(prompt);
                      }}
                      className="block w-full px-3 py-1.5 text-gray-500 hover:text-white transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </details>
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-amber-600/20 text-white'
                      : 'bg-zinc-800/70 text-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                    {isLoading && i === messages.length - 1 && msg.role === 'assistant' && (
                      <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse rounded" />
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-zinc-800 pt-4">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your journal entries..."
            aria-label="Ask a question about your journal entries"
            rows={2}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white px-4 py-3 focus:outline-none focus:border-amber-500/50 placeholder-gray-600 resize-none text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white transition-colors self-end rounded-lg"
            style={{ height: '46px' }}
            aria-label={isLoading ? 'Sending message...' : 'Send message'}
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
