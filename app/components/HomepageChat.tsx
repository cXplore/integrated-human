'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const starterPrompts = [
  "I'm feeling stuck",
  "Understand my patterns",
  "A practice for now",
];

export default function HomepageChat() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!session) {
      window.location.href = '/login?callbackUrl=/chat';
      return;
    }

    setHasStarted(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: 'homepage-widget',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.code === 'NO_CREDITS' ? 'Out of credits' : 'Error');
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }
            } catch {
              // Skip
            }
          }
        }
      }
    } catch {
      setError('Connection error');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Initial state - minimal invitation
  if (!hasStarted) {
    return (
      <section className="py-12 px-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-gray-400 text-sm">AI Companion</span>
              </div>
              <Link href="/chat" className="text-gray-600 hover:text-gray-400 text-xs">
                Full chat →
              </Link>
            </div>

            {/* Prompts */}
            <div className="p-4 flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-full text-gray-400 hover:text-white text-sm transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={session ? "Ask anything..." : "Sign in to chat"}
                  className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none"
                  disabled={status === 'loading'}
                />
                <button
                  onClick={() => sendMessage()}
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

  // Active chat
  return (
    <section className="py-12 px-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-gray-400 text-sm">AI Companion</span>
            </div>
            <Link href="/chat" className="text-gray-600 hover:text-gray-400 text-xs">
              Full chat →
            </Link>
          </div>

          {/* Messages */}
          <div className="h-[240px] overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
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
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 pb-2">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Continue..."
                className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
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
