'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAICompanion } from './AICompanionContext';

const starterPrompts = [
  "I'm feeling stuck",
  "Understand my patterns",
  "A practice for now",
];

export default function HomepageChat() {
  const { data: session, status } = useSession();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useAICompanion();

  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!session) {
      window.location.href = '/login?callbackUrl=/chat';
      return;
    }

    setHasStarted(true);
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initial state - minimal invitation (only if no messages in context)
  if (!hasStarted && messages.length === 0) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto relative">
          {/* Glow behind the box */}
          <div className="absolute -inset-8 bg-gradient-to-r from-purple-900/15 via-purple-800/8 to-purple-900/15 blur-2xl rounded-3xl" />
          <div className="absolute -inset-4 bg-gradient-to-b from-purple-900/10 to-transparent blur-xl rounded-2xl" />
          <div className="relative bg-zinc-900/70 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl shadow-purple-950/10">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-gray-300 text-sm font-medium">AI Companion</span>
              </div>
              <Link href="/chat" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                Full chat →
              </Link>
            </div>

            {/* Prompts */}
            <div className="p-4 flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 bg-zinc-800/50 hover:bg-purple-900/30 border border-zinc-700/50 hover:border-purple-700/50 rounded-full text-gray-400 hover:text-white text-xs transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/30">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={session ? "Ask anything..." : "Sign in to chat"}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
                  disabled={status === 'loading'}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || status === 'loading'}
                  className="text-gray-500 hover:text-purple-400 disabled:text-gray-700 transition-colors"
                  aria-label="Send"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Active chat - shows messages from shared context
  return (
    <section className="py-16 px-6">
      <div className="max-w-xl mx-auto relative">
        {/* Glow behind the box */}
        <div className="absolute -inset-8 bg-gradient-to-r from-purple-900/15 via-purple-800/8 to-purple-900/15 blur-2xl rounded-3xl" />
        <div className="absolute -inset-4 bg-gradient-to-b from-purple-900/10 to-transparent blur-xl rounded-2xl" />
        <div className="relative bg-zinc-900/70 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl shadow-purple-950/10">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-gray-300 text-sm font-medium">AI Companion</span>
            </div>
            <Link href="/chat" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Full chat →
            </Link>
          </div>

          {/* Messages - show last 5 from shared context */}
          <div className="h-[240px] overflow-y-auto p-4 space-y-3">
            {messages.slice(-5).map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-purple-600/80 text-white'
                      : 'bg-zinc-800/80 text-gray-300'
                  }`}
                >
                  {message.role === 'assistant' && !message.content && isLoading ? (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : message.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 pb-2">
              <p className="text-red-400 text-xs">
                {error}
                {error === 'Out of AI credits' && (
                  <> — <Link href="/profile" className="underline hover:text-red-300">add more</Link></>
                )}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/30">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Continue..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="text-gray-500 hover:text-purple-400 disabled:text-gray-700 transition-colors"
                aria-label="Send"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
