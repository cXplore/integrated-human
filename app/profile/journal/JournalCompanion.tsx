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

// Structured journaling frameworks
interface JournalFramework {
  id: string;
  name: string;
  description: string;
  prompts: string[];
  duration: string;
  icon: string;
}

const JOURNAL_FRAMEWORKS: JournalFramework[] = [
  {
    id: 'gratitude',
    name: 'Gratitude',
    description: '3 things you appreciate today',
    prompts: [
      "What's one small thing that brought me joy today?",
      "Who am I grateful for right now, and why?",
      "What's something I often take for granted that I can appreciate?",
    ],
    duration: '3 min',
    icon: '✨',
  },
  {
    id: 'body-check',
    name: 'Body Check-In',
    description: 'Tune into physical sensations',
    prompts: [
      "Where in my body am I holding tension right now?",
      "What is my body trying to tell me today?",
      "If my body could speak, what would it say?",
    ],
    duration: '5 min',
    icon: '🫀',
  },
  {
    id: 'emotional-weather',
    name: 'Emotional Weather',
    description: 'Map your inner landscape',
    prompts: [
      "If my emotions were weather, what would the forecast be?",
      "What emotion is asking for attention right now?",
      "What triggered this feeling, and what might it be protecting?",
    ],
    duration: '5 min',
    icon: '🌤️',
  },
  {
    id: 'values-check',
    name: 'Values Alignment',
    description: 'Are you living your values?',
    prompts: [
      "Did my actions today align with what matters most to me?",
      "Where did I compromise my values, and what was I afraid of?",
      "One way I can honor my values tomorrow...",
    ],
    duration: '5 min',
    icon: '🧭',
  },
  {
    id: 'shadow-peek',
    name: 'Shadow Peek',
    description: 'What are you avoiding?',
    prompts: [
      "What am I pretending not to know?",
      "What would I do differently if I wasn't afraid of judgment?",
      "What part of myself do I hide from others?",
    ],
    duration: '7 min',
    icon: '🌑',
  },
  {
    id: 'future-self',
    name: 'Future Self',
    description: 'Letter from your wiser self',
    prompts: [
      "What would my 80-year-old self want me to know?",
      "If I could send a message to myself one year from now, what would it say?",
      "What am I building today that my future self will thank me for?",
    ],
    duration: '5 min',
    icon: '🔮',
  },
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
  const [selectedFramework, setSelectedFramework] = useState<JournalFramework | null>(null);
  const [frameworkStep, setFrameworkStep] = useState(0);
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

    // If in a guided framework, prefix with context
    let finalMessage = textToSend;
    if (selectedFramework && messages.length === 0) {
      const prompt = selectedFramework.prompts[frameworkStep];
      finalMessage = `[${selectedFramework.name} reflection - "${prompt}"]\n\n${textToSend}`;
    }

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Advance framework step after submitting
    if (selectedFramework && frameworkStep < selectedFramework.prompts.length - 1) {
      setFrameworkStep(frameworkStep + 1);
    }

    try {
      const response = await fetch('/api/journal/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMessage,
          history: messages,
          selectedEntry: selectedEntry ? selectedEntry.content : null,
          framework: selectedFramework ? {
            name: selectedFramework.name,
            prompt: selectedFramework.prompts[frameworkStep],
            step: frameworkStep + 1,
            totalSteps: selectedFramework.prompts.length,
          } : null,
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
  }, [input, isLoading, messages, selectedEntry, selectedFramework, frameworkStep]);

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
        {messages.length === 0 && !selectedFramework ? (
          <div className="h-full flex flex-col px-4 py-2">
            {/* Guided Journaling Frameworks */}
            <div className="mb-6">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                Guided Journaling
              </p>
              <div className="grid grid-cols-2 gap-2">
                {JOURNAL_FRAMEWORKS.map((framework) => (
                  <button
                    key={framework.id}
                    onClick={() => {
                      setSelectedFramework(framework);
                      setFrameworkStep(0);
                    }}
                    className="p-3 text-left bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-amber-500/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{framework.icon}</span>
                      <span className="text-white text-sm font-medium group-hover:text-amber-400 transition-colors">
                        {framework.name}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">{framework.description}</p>
                    <p className="text-gray-600 text-xs mt-1">{framework.duration}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-gray-600 text-xs">or ask freely</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Time-aware prompts */}
            <div className="space-y-2">
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
            <details className="mt-4 text-gray-600 text-xs cursor-pointer">
              <summary className="hover:text-gray-400 transition-colors">More prompts</summary>
              <div className="mt-2 space-y-1">
                {DEFAULT_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(prompt)}
                    className="block w-full px-3 py-1.5 text-gray-500 hover:text-white transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </details>
          </div>
        ) : messages.length === 0 && selectedFramework ? (
          /* Guided Framework View */
          <div className="h-full flex flex-col px-4 py-2">
            {/* Framework Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedFramework.icon}</span>
                <div>
                  <h4 className="text-white font-medium">{selectedFramework.name}</h4>
                  <p className="text-gray-500 text-xs">
                    Step {frameworkStep + 1} of {selectedFramework.prompts.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFramework(null);
                  setFrameworkStep(0);
                }}
                className="text-gray-500 hover:text-white text-xs transition-colors"
              >
                Exit
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-zinc-800 rounded-full mb-6">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${((frameworkStep + 1) / selectedFramework.prompts.length) * 100}%` }}
              />
            </div>

            {/* Current Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-white text-lg font-medium mb-6 max-w-sm leading-relaxed">
                {selectedFramework.prompts[frameworkStep]}
              </p>

              <p className="text-gray-500 text-sm mb-4">
                Take a moment to reflect, then share your thoughts below.
              </p>

              {/* Navigation Buttons */}
              <div className="flex gap-2 mt-4">
                {frameworkStep > 0 && (
                  <button
                    onClick={() => setFrameworkStep(frameworkStep - 1)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    ← Previous
                  </button>
                )}
                {frameworkStep < selectedFramework.prompts.length - 1 && (
                  <button
                    onClick={() => setFrameworkStep(frameworkStep + 1)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Skip →
                  </button>
                )}
              </div>
            </div>
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
            placeholder={selectedFramework ? "Share your reflection..." : "Ask about your journal entries..."}
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
