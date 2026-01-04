'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAICompanion } from './AICompanionContext';

// Pages where the floating companion should NOT appear
// (these have their own integrated chat UI)
const HIDDEN_PATHS = ['/chat', '/login', '/register'];

// Text selection state
interface TextSelection {
  text: string;
  x: number;
  y: number;
}

// Welcome context from API
interface WelcomeContext {
  greeting: string;
  lastConversationSummary?: string;
  daysSinceLastChat: number | null;
  suggestedTopic?: string;
}

export default function FloatingCompanion() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const {
    messages,
    isLoading,
    isMinimized,
    error,
    pageContext,
    sendMessage,
    setHighlightedText,
    toggleMinimized,
    clearConversation,
    continueInFullChat,
  } = useAICompanion();

  const [input, setInput] = useState('');
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [welcomeContext, setWelcomeContext] = useState<WelcomeContext | null>(null);
  const [welcomeFetched, setWelcomeFetched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we should hide the companion
  const shouldHide = HIDDEN_PATHS.some((path) => pathname.startsWith(path));

  // Fetch welcome context on mount (only once per session)
  useEffect(() => {
    if (status !== 'authenticated' || welcomeFetched) return;

    const fetchWelcome = async () => {
      try {
        const response = await fetch('/api/chat/welcome-back');
        if (response.ok) {
          const data = await response.json();
          setWelcomeContext(data);
        }
      } catch {
        // Silently fail - welcome is not critical
      }
      setWelcomeFetched(true);
    };

    fetchWelcome();
  }, [status, welcomeFetched]);

  // Text selection detection for highlight-to-ask (only on content pages)
  useEffect(() => {
    const isContentPage = ['article', 'module', 'course'].includes(pageContext.type);
    if (!isContentPage) return;

    const handleMouseUp = () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      selectionTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 3 && selectedText.length < 500) {
          const range = selection?.getRangeAt(0);
          if (range) {
            const rect = range.getBoundingClientRect();
            setTextSelection({
              text: selectedText,
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
            });
          }
        } else {
          setTextSelection(null);
        }
      }, 100);
    };

    const handleMouseDown = (e: MouseEvent) => {
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
  }, [pageContext.type]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Focus input when expanded
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text) return;

    if (!session) {
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(pathname);
      return;
    }

    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle quick question about selected text
  const handleQuickQuestion = useCallback((type: 'explain' | 'apply' | 'deeper') => {
    if (!textSelection) return;

    const questions = {
      explain: `Can you explain this in simpler terms: "${textSelection.text}"`,
      apply: `How can I apply this concept: "${textSelection.text}"`,
      deeper: `Tell me more about: "${textSelection.text}"`,
    };

    setHighlightedText(textSelection.text);
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();

    // Open the chat if minimized and send the message
    if (isMinimized) {
      toggleMinimized();
    }

    // Send after a brief delay to ensure UI is open
    setTimeout(() => {
      sendMessage(questions[type]);
    }, 100);
  }, [textSelection, setHighlightedText, isMinimized, toggleMinimized, sendMessage]);

  // Handle custom question about selected text
  const handleAskAboutSelection = useCallback(() => {
    if (!textSelection) return;

    setHighlightedText(textSelection.text);
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();

    // Open the chat if minimized
    if (isMinimized) {
      toggleMinimized();
    }

    // Focus input after opening
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [textSelection, setHighlightedText, isMinimized, toggleMinimized]);

  // Selection tooltip component
  const SelectionTooltip = () => {
    if (!textSelection) return null;

    const tooltipWidth = 200;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;

    let left = textSelection.x - tooltipWidth / 2;
    let top = textSelection.y - 50;

    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;
    if (top < 10) top = textSelection.y + 30;

    return (
      <div
        className="highlight-tooltip fixed z-[60] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150"
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
          >
            Explain
          </button>
          <button
            onClick={() => handleQuickQuestion('apply')}
            className="flex-1 px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => handleQuickQuestion('deeper')}
            className="flex-1 px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded transition-colors"
          >
            More
          </button>
        </div>
        <button
          onClick={handleAskAboutSelection}
          className="w-full mt-1.5 px-2 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Ask custom question
        </button>
      </div>
    );
  };

  // Don't render on hidden pages
  if (shouldHide) return null;

  // Get contextual placeholder based on page
  const getPlaceholder = () => {
    if (status === 'loading') return 'Loading...';
    if (!session) return 'Sign in to chat';

    switch (pageContext.type) {
      case 'article':
        return 'Ask about this article...';
      case 'module':
      case 'course':
        return 'Questions about this lesson?';
      case 'journal':
        return 'Reflect on your thoughts...';
      case 'dreams':
        return 'Explore your dreams...';
      default:
        return 'Ask anything...';
    }
  };

  // Minimized state - just show a floating button (plus selection tooltip)
  if (isMinimized) {
    return (
      <>
        <SelectionTooltip />
        <button
          onClick={toggleMinimized}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-purple-600 hover:bg-purple-500 rounded-full shadow-lg shadow-purple-900/30 flex items-center justify-center transition-all hover:scale-105 group"
          aria-label="Open AI Companion"
        >
          {/* Pulse indicator if there are messages or welcome suggestion */}
          {(messages.length > 0 || welcomeContext?.suggestedTopic) && (
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${messages.length > 0 ? 'bg-green-500' : 'bg-purple-400 animate-pulse'}`} />
          )}
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI Companion
          </span>
        </button>
      </>
    );
  }

  // Expanded state - chat window
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 max-h-[70vh] flex flex-col bg-zinc-900/95 border border-zinc-700/50 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span className="text-gray-200 text-sm font-medium">AI Companion</span>
          {pageContext.type !== 'home' && pageContext.type !== 'other' && (
            <span className="text-xs text-gray-500 capitalize">
              ({pageContext.type})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Go to full chat */}
          <button
            onClick={continueInFullChat}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            title="Open full chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          {/* Clear conversation */}
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
              title="Clear conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {/* Minimize */}
          <button
            onClick={toggleMinimized}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm py-4 px-2">
            {/* Personalized welcome */}
            {welcomeContext ? (
              <div className="space-y-3">
                <p className="text-gray-300">{welcomeContext.greeting}</p>
                {welcomeContext.lastConversationSummary && (
                  <p className="text-gray-500 text-xs">{welcomeContext.lastConversationSummary}</p>
                )}
                {welcomeContext.suggestedTopic && (
                  <button
                    onClick={() => sendMessage(welcomeContext.suggestedTopic!.replace(/\?$/, ''))}
                    className="w-full text-left px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-purple-600/50 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {welcomeContext.suggestedTopic}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="mb-2">I&apos;m here to help.</p>
                {pageContext.type === 'article' && (
                  <p className="text-xs text-gray-600">Ask me about what you&apos;re reading.</p>
                )}
                {pageContext.type === 'module' && (
                  <p className="text-xs text-gray-600">Questions about this lesson?</p>
                )}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-zinc-800/80 text-gray-300'
                }`}
              >
                {message.role === 'assistant' && !message.content && isLoading ? (
                  <div className="flex items-center gap-1 py-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                    <div
                      className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                ) : message.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      a: ({ href, children }) => (
                        <Link
                          href={href || '#'}
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          {children}
                        </Link>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-1">
          <p className="text-red-400 text-xs">
            {error}
            {error === 'Out of AI credits' && (
              <>
                {' — '}
                <Link href="/profile" className="underline hover:text-red-300">
                  add more
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-zinc-800/50 bg-zinc-900/80">
        {/* Highlighted text indicator */}
        {pageContext.highlightedText && (
          <div className="mb-2 flex items-start gap-2 px-2 py-1.5 bg-purple-900/30 border border-purple-800/50 rounded text-xs">
            <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="text-purple-300">Asking about: </span>
              <span className="text-gray-400 line-clamp-1">&quot;{pageContext.highlightedText}&quot;</span>
            </div>
            <button
              type="button"
              onClick={() => setHighlightedText(null)}
              className="text-gray-500 hover:text-gray-300 flex-shrink-0"
              aria-label="Clear highlight context"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-xl px-3 py-2 border border-zinc-700/30 focus-within:border-purple-600/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pageContext.highlightedText ? 'Ask about the highlighted text...' : getPlaceholder()}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            disabled={isLoading || status === 'loading'}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || !session}
            className="text-gray-500 hover:text-purple-400 disabled:text-gray-700 transition-colors"
            aria-label="Send"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
