'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TextSelection {
  text: string;
  x: number;
  y: number;
}

interface ContentCompanionProps {
  contentType: 'article' | 'course' | 'module';
  contentTitle: string;
  contentSlug: string;
  moduleSlug?: string;
}

const CONTEXTUAL_PROMPTS: Record<string, string[]> = {
  article: [
    "What's the main takeaway here?",
    "How can I apply this?",
    "I'm confused about...",
  ],
  course: [
    "Where should I start?",
    "What will I learn?",
    "Is this right for me?",
  ],
  module: [
    "Can you explain this differently?",
    "How does this connect to...",
    "I'm stuck on the exercise",
  ],
};

export default function ContentCompanion({
  contentType,
  contentTitle,
  contentSlug,
  moduleSlug,
}: ContentCompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prompts = CONTEXTUAL_PROMPTS[contentType] || CONTEXTUAL_PROMPTS.article;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear selection timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  // Text selection detection for highlight-to-ask
  useEffect(() => {
    const handleMouseUp = () => {
      // Debounce to allow selection to settle
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      selectionTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 3 && selectedText.length < 500) {
          // Get selection position
          const range = selection?.getRangeAt(0);
          if (range) {
            const rect = range.getBoundingClientRect();
            setTextSelection({
              text: selectedText,
              x: rect.left + rect.width / 2,
              y: rect.top - 10, // Position above the selection
            });
          }
        } else {
          setTextSelection(null);
        }
      }, 100);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Clear selection when clicking outside the tooltip
      const target = e.target as HTMLElement;
      if (!target.closest('.highlight-tooltip')) {
        setTextSelection(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage = input.trim();
    setInput('');
    setHasInteracted(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Build context about what they're reading
      const contentContext = `The user is currently ${
        contentType === 'article' ? 'reading the article' :
        contentType === 'module' ? 'taking a course module' : 'viewing a course'
      } titled "${contentTitle}".${moduleSlug ? ` Module: ${moduleSlug}` : ''}`;

      // Include highlighted text context if available
      const highlightContext = highlightedText
        ? `\n[The user has highlighted this text from the content: "${highlightedText}"]`
        : '';

      // Clear highlighted text after including in message
      if (highlightedText) {
        setHighlightedText(null);
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Context: ${contentContext}${highlightContext}]\n\n${userMessage}`,
          history: messages.slice(-6),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessage = '';
      if (isMountedRef.current) {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage += data.content;
                if (isMountedRef.current) {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                    };
                    return updated;
                  });
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Companion chat error:', err);
      if (isMountedRef.current) {
        setMessages(prev => [
          ...prev.filter(m => m.content !== ''),
          { role: 'assistant', content: 'Sorry, I couldn\'t respond right now. Please try again.' }
        ]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [input, isLoading, contentType, contentTitle, moduleSlug, messages, highlightedText]);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  // Handle asking about highlighted text
  const handleAskAboutSelection = () => {
    if (!textSelection) return;

    setHighlightedText(textSelection.text);
    setTextSelection(null);
    setIsOpen(true);

    // Clear the browser selection
    window.getSelection()?.removeAllRanges();

    // Focus the input after a small delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Quick question about selection (preset prompts)
  const handleQuickQuestion = (type: 'explain' | 'apply' | 'deeper') => {
    if (!textSelection) return;

    const questions = {
      explain: `Can you explain this in simpler terms: "${textSelection.text}"`,
      apply: `How can I apply this concept: "${textSelection.text}"`,
      deeper: `Tell me more about: "${textSelection.text}"`,
    };

    setInput(questions[type]);
    setTextSelection(null);
    setIsOpen(true);

    // Clear the browser selection
    window.getSelection()?.removeAllRanges();

    // Submit after opening
    setTimeout(() => {
      inputRef.current?.form?.requestSubmit();
    }, 150);
  };

  // Clear highlighted text context
  const clearHighlightContext = () => {
    setHighlightedText(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Floating tooltip for text selection
  const SelectionTooltip = () => {
    if (!textSelection) return null;

    // Calculate position with bounds checking
    const tooltipWidth = 200;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    let left = textSelection.x - tooltipWidth / 2;
    let top = textSelection.y - 50;

    // Keep within viewport horizontally
    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;

    // If too close to top, show below selection instead
    if (top < 10) top = textSelection.y + 30;

    return (
      <div
        className="highlight-tooltip fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${tooltipWidth}px`,
        }}
      >
        <div className="flex gap-1">
          <button
            onClick={() => handleQuickQuestion('explain')}
            className="flex-1 px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded transition-colors"
            title="Explain this"
          >
            Explain
          </button>
          <button
            onClick={() => handleQuickQuestion('apply')}
            className="flex-1 px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded transition-colors"
            title="How to apply this"
          >
            Apply
          </button>
          <button
            onClick={() => handleQuickQuestion('deeper')}
            className="flex-1 px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded transition-colors"
            title="Tell me more"
          >
            More
          </button>
        </div>
        <button
          onClick={handleAskAboutSelection}
          className="w-full mt-1.5 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Ask custom question
        </button>
      </div>
    );
  };

  // Minimized state - just an icon
  if (!isOpen) {
    return (
      <>
        <SelectionTooltip />
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-zinc-900 border border-zinc-700 rounded-full shadow-lg hover:border-zinc-500 hover:bg-zinc-800 transition-all group"
          aria-label="Open AI companion"
        >
          <div className="flex items-center justify-center w-full h-full">
            <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          {/* Pulse indicator for first-time users */}
          {!hasInteracted && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
          )}
        </button>
      </>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 max-h-[500px] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-white">Guide</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-gray-500 hover:text-white transition-colors"
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M4 8h16M4 16h16" : "M20 12H4"} />
            </svg>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px]">
            {messages.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-4">
                  Questions about what you're {contentType === 'article' ? 'reading' : 'learning'}?
                </p>
                <div className="space-y-2">
                  {prompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(prompt)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-400 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-600 hover:text-white transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-gray-300'
                    }`}
                  >
                    {msg.content || (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800">
            {/* Highlighted text context indicator */}
            {highlightedText && (
              <div className="mb-2 flex items-start gap-2 px-2 py-1.5 bg-blue-900/30 border border-blue-800/50 rounded text-xs">
                <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="text-blue-300">Asking about: </span>
                  <span className="text-gray-400 line-clamp-1">&quot;{highlightedText}&quot;</span>
                </div>
                <button
                  type="button"
                  onClick={clearHighlightContext}
                  className="text-gray-500 hover:text-gray-300 flex-shrink-0"
                  aria-label="Clear highlight context"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={highlightedText ? "Ask about the highlighted text..." : "Ask anything..."}
                aria-label="Ask a question about this content"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-zinc-500 resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-3 py-2 bg-white text-black rounded text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
