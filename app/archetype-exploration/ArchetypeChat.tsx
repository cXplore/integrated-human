'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  userId: string;
  userName?: string;
}

const INITIAL_PROMPT = `You are a guide for archetype exploration on Integrated Human - a personal growth platform. You're helping someone discover their archetypal patterns through conversation.

CONTEXT:
- Masculine archetypes: King (order, blessing), Warrior (boundaries, service), Magician (awareness, truth), Lover (connection, aliveness)
- Feminine archetypes: Queen (radiance, self-worth), Mother (nurturing), Lover (embodiment, eros), Maiden (receptivity), Huntress (independence), Mystic (depth, stillness), Wild Woman (primal force)
- Each has mature and shadow expressions
- People carry multiple archetypes, often in combination
- Shadow doesn't mean "bad" - it's the part not yet integrated

YOUR APPROACH:
- Be curious, warm, and direct. Not clinical or detached.
- Ask about real situations, feelings, patterns - not abstract preferences
- Go where the energy is. If they mention a relationship, explore it.
- Name what you see, but hold it lightly. You might be wrong.
- Look for the shadow AND the gift in each pattern
- Help them see combinations (Lover-Magician, Queen-Huntress, etc.)
- Connect archetypes to their actual life - relationships, work, struggles
- Don't rush to conclusions. This is exploration, not diagnosis.

CONVERSATION STRUCTURE:
1. Start by asking what brought them here - what are they curious about or struggling with?
2. Follow their lead. Ask follow-up questions about specifics.
3. When you notice archetypal patterns, name them gently and check if it resonates.
4. Explore both the strength and shadow of what you see.
5. After 6-8 exchanges, start weaving together what you've noticed.
6. Offer a synthesis: their likely primary archetype(s), shadow patterns, and integration path.

TONE:
- Like a wise friend who sees you clearly
- Honest but not harsh
- Present, not performative
- Okay with not knowing everything

Remember: This is about helping them see themselves more clearly, not impressing them with knowledge.`;

export default function ArchetypeChat({ userId, userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch credits on mount
  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch('/api/credits');
        if (res.ok) {
          const data = await res.json();
          setCredits(data.creditBalance);
        }
      } catch (e) {
        console.error('Error fetching credits:', e);
      }
    }
    fetchCredits();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startExploration = async () => {
    setStarted(true);
    setIsLoading(true);
    setError(null);

    // Send initial greeting
    const greeting = userName
      ? `Hello ${userName}. I'm here to explore archetypes with you — not as a quiz, but as a conversation. We'll look at patterns in how you live, love, work, and struggle. Some of what I reflect back might resonate immediately. Some might take time to land. And some might be wrong — that's okay too.\n\nSo tell me: what brings you here today? What are you curious about, or what's been on your mind lately?`
      : `Hello. I'm here to explore archetypes with you — not as a quiz, but as a conversation. We'll look at patterns in how you live, love, work, and struggle. Some of what I reflect back might resonate immediately. Some might take time to land. And some might be wrong — that's okay too.\n\nSo tell me: what brings you here today? What are you curious about, or what's been on your mind lately?`;

    setMessages([{ role: 'assistant', content: greeting }]);
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build history for API
      const history = [
        { role: 'system', content: INITIAL_PROMPT },
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history.slice(0, -1), // Don't include the current message in history
          context: 'archetype-exploration',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.code === 'NO_CREDITS') {
          setError('no_credits');
        } else if (data.code === 'AUTH_REQUIRED') {
          setError('auth_required');
        } else {
          setError(data.message || 'Failed to get response');
        }
        setIsLoading(false);
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message
      setMessages([...newMessages, { role: 'assistant', content: '' }]);

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
                setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
              }
              if (data.done && data.usage) {
                // Update credits display
                setCredits(data.usage.remainingBalance);
              }
            } catch {
              // Skip parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Something went wrong. Please try again.');
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

  // Not started yet - show intro
  if (!started) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-3xl text-white">Archetype Exploration</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            A guided conversation to discover your archetypal patterns — not through a quiz,
            but through exploring your actual life, relationships, and struggles.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <h2 className="font-serif text-xl text-white">How This Works</h2>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">1.</span>
              <span>We'll have a conversation about what's real for you — your patterns, relationships, what lights you up and what trips you up.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">2.</span>
              <span>I'll reflect back the archetypal patterns I notice — both the gifts and the shadows.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">3.</span>
              <span>You'll tell me what resonates and what doesn't. This is exploration, not diagnosis.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">4.</span>
              <span>By the end, you'll have a clearer picture of your archetypal constellation and where your growth edge lives.</span>
            </li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-sm">This exploration uses AI credits</span>
            {credits !== null && (
              <span className="text-white text-sm ml-2">
                (You have {credits.toLocaleString()} credits)
              </span>
            )}
          </div>
          {credits !== null && credits < 1000 && (
            <Link href="/pricing" className="text-amber-500 hover:text-amber-400 text-sm">
              Get more credits →
            </Link>
          )}
        </div>

        {credits !== null && credits > 0 ? (
          <button
            onClick={startExploration}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
          >
            Begin Exploration
          </button>
        ) : credits === 0 ? (
          <div className="text-center space-y-4">
            <p className="text-gray-400">You need AI credits to start this exploration.</p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white transition-colors"
            >
              Get Credits
            </Link>
          </div>
        ) : (
          <div className="text-center text-gray-500">Loading...</div>
        )}

        <p className="text-center text-gray-600 text-sm">
          Prefer a quick quiz? <Link href="/archetypes" className="text-gray-400 hover:text-white">Take the Archetype Quiz instead</Link>
        </p>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <h1 className="font-serif text-xl text-white">Archetype Exploration</h1>
        {credits !== null && (
          <span className="text-sm text-gray-500">
            {credits.toLocaleString()} credits
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 ${
                message.role === 'user'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-gray-300'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error === 'no_credits' && (
          <div className="bg-amber-900/20 border border-amber-800 p-4 text-center">
            <p className="text-amber-400 mb-2">You've run out of AI credits.</p>
            <Link href="/pricing" className="text-amber-500 hover:text-amber-400 text-sm">
              Purchase more credits to continue →
            </Link>
          </div>
        )}

        {error === 'auth_required' && (
          <div className="bg-red-900/20 border border-red-800 p-4 text-center">
            <p className="text-red-400">Session expired. Please refresh and sign in again.</p>
          </div>
        )}

        {error && error !== 'no_credits' && error !== 'auth_required' && (
          <div className="bg-red-900/20 border border-red-800 p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-zinc-800">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            rows={2}
            disabled={isLoading || error === 'no_credits'}
            className="flex-1 bg-zinc-900 border border-zinc-700 text-white placeholder-gray-500 p-3 resize-none focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || error === 'no_credits'}
            className="px-6 bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
