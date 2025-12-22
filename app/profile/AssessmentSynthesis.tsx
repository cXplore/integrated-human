'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  "What do my assessments reveal about my patterns?",
  "How do my archetype and attachment style connect?",
  "What's the best place to start my integration work?",
  "What blind spots might I have based on these results?",
  "How can I work with my shadow material?",
];

export default function AssessmentSynthesis() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setIsExpanded(true);
    setError(null);
    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assessments/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'NO_CREDITS') {
          setError('You\'ve run out of AI credits. Visit your profile to get more.');
        } else if (errorData.code === 'AUTH_REQUIRED') {
          setError('Please sign in to use the assessment synthesis.');
        } else {
          setError(errorData.message || 'Something went wrong. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

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
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                      lastMsg.content += data.content;
                    }
                    return updated;
                  });
                }
                if (data.done && data.usage) {
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
      console.error('Synthesis error:', err);
      setError('Failed to connect to the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Collapsed state - show as a CTA card
  if (!isExpanded && messages.length === 0) {
    return (
      <div className="border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">Explore Your Patterns</h3>
              <p className="text-gray-500 text-sm mb-4">
                Use AI to synthesize your assessment results into personalized insights
              </p>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.slice(0, 2).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(prompt)}
                    className="px-3 py-1.5 text-xs text-gray-400 border border-zinc-800 hover:border-zinc-600 hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state - full chat interface
  return (
    <div className="border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">Pattern Synthesis</h3>
            <p className="text-gray-600 text-xs">AI-powered assessment insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {tokenBalance !== null && (
            <span className="text-gray-600 text-xs">
              {tokenBalance.toLocaleString()} tokens
            </span>
          )}
          <button
            onClick={() => {
              setMessages([]);
              setIsExpanded(false);
            }}
            className="text-gray-600 hover:text-gray-400 text-xs"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600/20 text-white'
                  : 'bg-zinc-800 text-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
                {isLoading && i === messages.length - 1 && msg.role === 'assistant' && (
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 px-4 py-3 bg-red-900/20 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your patterns..."
            className="flex-1 bg-zinc-900 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-zinc-600 placeholder-gray-600 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white transition-colors"
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
        <div className="flex flex-wrap gap-2 mt-3">
          {STARTER_PROMPTS.slice(2, 5).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(prompt)}
              disabled={isLoading}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
