'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type SessionStatus = 'idle' | 'loading' | 'in_progress' | 'completed' | 'error';

export default function WeeklyCheckIn() {
  const { data: session, status: authStatus } = useSession();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for existing session on mount
  useEffect(() => {
    if (authStatus === 'authenticated') {
      checkExistingSession();
    }
  }, [authStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function checkExistingSession() {
    try {
      const res = await fetch('/api/health/session');
      if (res.ok) {
        const data = await res.json();
        if (data.session && data.session.status === 'in_progress') {
          setSessionId(data.session.id);
          setMessages(data.session.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })));
          setSessionStatus('in_progress');
        }
      }
    } catch (err) {
      console.error('Error checking session:', err);
    }
  }

  async function startSession() {
    setSessionStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/health/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', type: 'weekly-checkin' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start session');
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([{
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }]);
      setSessionStatus('in_progress');
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setSessionStatus('error');
    }
  }

  async function sendMessage() {
    if (!input.trim() || !sessionId || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    // Optimistically add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);

    try {
      const res = await fetch('/api/health/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'continue',
          sessionId,
          message: userMessage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }]);

      if (data.status === 'completed') {
        setSessionStatus('completed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function resetSession() {
    setSessionId(null);
    setMessages([]);
    setSessionStatus('idle');
    setError(null);
  }

  if (authStatus !== 'authenticated') return null;

  // Collapsed view - show prompt to start or resume
  if (!expanded) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              {sessionStatus === 'in_progress' ? (
                <>
                  <p className="text-gray-300 text-sm">Check-in in progress</p>
                  <p className="text-gray-500 text-xs">{messages.length} messages</p>
                </>
              ) : sessionStatus === 'completed' ? (
                <>
                  <p className="text-gray-300 text-sm">Check-in complete</p>
                  <p className="text-green-500 text-xs">Session finished</p>
                </>
              ) : (
                <>
                  <p className="text-gray-300 text-sm">Weekly Check-in</p>
                  <p className="text-gray-500 text-xs">Chat with your integration guide</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (sessionStatus === 'idle') {
                startSession();
              } else {
                setExpanded(true);
              }
            }}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            {sessionStatus === 'idle' ? 'Start' : sessionStatus === 'in_progress' ? 'Continue' : 'View'}
          </button>
        </div>
      </div>
    );
  }

  // Expanded view - full chat interface
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">Weekly Check-in</h3>
            {sessionStatus === 'completed' && (
              <p className="text-green-500 text-xs">Session complete</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {sessionStatus === 'loading' && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Starting session...</span>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-gray-300'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input or completion message */}
      {sessionStatus === 'completed' ? (
        <div className="p-4 border-t border-zinc-800">
          <div className="text-center space-y-3">
            <p className="text-gray-400 text-sm">
              Thank you for checking in. Your insights have been noted.
            </p>
            <button
              onClick={resetSession}
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Start a new check-in
            </button>
          </div>
        </div>
      ) : sessionStatus === 'in_progress' ? (
        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              disabled={sending}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
