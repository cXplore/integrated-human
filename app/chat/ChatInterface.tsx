'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

interface ContextInfo {
  hasHealthContext: boolean;
  dataFreshness?: 'fresh' | 'aging' | 'stale' | 'expired';
  suggestedActions?: string[];
}

interface Props {
  userName?: string;
}

export default function ChatInterface({ userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Load active conversation and context info on mount
  useEffect(() => {
    loadConversations();
    loadContextInfo();
  }, []);

  const loadContextInfo = async () => {
    try {
      const res = await fetch('/api/chat/context-info');
      if (res.ok) {
        const data = await res.json();
        setContextInfo(data);
      }
    } catch (err) {
      console.error('Error loading context info:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);

        // Load the most recent active conversation
        const active = data.conversations?.find((c: Conversation & { isActive?: boolean }) => c.isActive);
        if (active) {
          loadConversation(active.id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadConversation = async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation.id);
        setMessages(
          data.conversation.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.createdAt),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setLoadingHistory(false);
      setShowHistory(false);
    }
  };

  const startNewConversation = async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'general' }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation.id);
        setMessages([]);
        setShowHistory(false);
        loadConversations();
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation
    if (!confirm('Delete this conversation?')) return;

    setDeletingConversation(id);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // If we deleted the current conversation, clear it
        if (id === conversationId) {
          setConversationId(null);
          setMessages([]);
        }
        loadConversations();
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    } finally {
      setDeletingConversation(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create placeholder for assistant message
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: 'standalone-chat',
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'NO_CREDITS') {
          setError('You\'ve run out of AI credits. Visit your profile to purchase more.');
        } else {
          setError(errorData.message || 'Failed to get response');
        }
        // Remove empty assistant message
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
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }
              if (parsed.done) {
                if (parsed.usage) {
                  setTokenBalance(parsed.usage.remainingBalance);
                }
                if (parsed.conversationId && !conversationId) {
                  setConversationId(parsed.conversationId);
                  loadConversations();
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
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

  const exportChat = () => {
    if (messages.length === 0) return;

    const content = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const greeting = userName ? `Hello, ${userName.split(' ')[0]}` : 'Hello';

  // Generate contextual follow-up suggestions based on last message
  const getSuggestions = (): string[] => {
    if (messages.length === 0 || isLoading) return [];

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return [];

    const content = lastAssistant.content.toLowerCase();

    // Context-aware suggestions based on AI response content
    if (content.includes('shadow') || content.includes('unconscious')) {
      return ['How do I recognize my shadow?', 'What triggers might reveal it?'];
    }
    if (content.includes('breath') || content.includes('nervous system')) {
      return ['Can you guide me through a practice?', 'What else calms the nervous system?'];
    }
    if (content.includes('dream') || content.includes('symbol')) {
      return ['What else could this mean?', 'How do I work with this insight?'];
    }
    if (content.includes('relationship') || content.includes('attachment')) {
      return ['How do I communicate this?', 'What patterns should I watch for?'];
    }
    if (content.includes('stuck') || content.includes('block')) {
      return ['What might be underneath this?', 'What small step could I take?'];
    }
    if (content.includes('practice') || content.includes('exercise')) {
      return ['How often should I do this?', 'What if I struggle with it?'];
    }

    // Default suggestions
    return ['Tell me more', 'What practice would help?'];
  };

  const suggestions = getSuggestions();

  const getContextTooltip = (): string => {
    if (!contextInfo?.hasHealthContext) return 'No personalization data';
    switch (contextInfo.dataFreshness) {
      case 'fresh':
        return 'AI has your latest health context';
      case 'aging':
        return 'Context is a few days old - consider a quick check-in';
      case 'stale':
        return 'Context is outdated - AI will ask about your current state';
      case 'expired':
        return 'Context is very old - AI will focus on your present experience';
      default:
        return 'AI is personalized to your journey';
    }
  };

  return (
    <>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-white transition-colors p-2 -ml-2"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-white font-medium">AI Companion</h1>
              <p className="text-xs text-gray-500">Personal growth conversation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Context awareness indicator */}
            {contextInfo?.hasHealthContext && (
              <div className="flex items-center gap-1" title={getContextTooltip()}>
                <span
                  className={`w-2 h-2 rounded-full ${
                    contextInfo.dataFreshness === 'fresh'
                      ? 'bg-green-500'
                      : contextInfo.dataFreshness === 'aging'
                      ? 'bg-yellow-500'
                      : contextInfo.dataFreshness === 'stale'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {contextInfo.dataFreshness === 'fresh'
                    ? 'Context fresh'
                    : contextInfo.dataFreshness === 'aging'
                    ? 'Context aging'
                    : 'Context stale'}
                </span>
              </div>
            )}
            {tokenBalance !== null && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                {Math.floor(tokenBalance / 1000)}k tokens
              </span>
            )}
            {/* History button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-gray-500 hover:text-white transition-colors p-2"
              aria-label="Chat history"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Export button */}
            {messages.length > 0 && (
              <button
                onClick={exportChat}
                className="text-gray-500 hover:text-white transition-colors p-2"
                aria-label="Export chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            {/* New chat button */}
            <button
              onClick={startNewConversation}
              className="text-gray-500 hover:text-white transition-colors p-2"
              aria-label="New chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Stale data banner */}
      {contextInfo?.hasHealthContext &&
        (contextInfo.dataFreshness === 'stale' || contextInfo.dataFreshness === 'expired') &&
        messages.length === 0 && (
          <div className="bg-amber-900/30 border-b border-amber-800/50">
            <div className="max-w-3xl mx-auto px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-200">
                    {contextInfo.dataFreshness === 'expired'
                      ? "It's been a while since you checked in. I'll ask about how you're doing now rather than assuming."
                      : "Your health context is a bit outdated. Things may have changed since we last talked."}
                  </p>
                  {contextInfo.suggestedActions && contextInfo.suggestedActions.length > 0 && (
                    <p className="text-xs text-amber-400/80 mt-1">
                      Tip: {contextInfo.suggestedActions[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* History sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-20 md:relative md:inset-auto">
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setShowHistory(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-900 border-r border-zinc-800 overflow-y-auto md:relative md:w-full">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-white font-medium">Conversations</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-white md:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2">
              {conversations.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group w-full text-left p-3 rounded-lg mb-1 transition-colors cursor-pointer flex items-start justify-between ${
                      conv.id === conversationId
                        ? 'bg-purple-600/20 text-white'
                        : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conv.messageCount} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      disabled={deletingConversation === conv.id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all flex-shrink-0 ml-2"
                      aria-label="Delete conversation"
                    >
                      {deletingConversation === conv.id ? (
                        <div className="w-4 h-4 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {loadingHistory ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-4">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl text-white font-serif mb-2">{greeting}</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                I&apos;m here to support your journey of integration and growth.
                What&apos;s on your mind today?
              </p>

              {/* Conversation starters */}
              <div className="grid gap-3 max-w-md mx-auto">
                {[
                  'I\'ve been feeling stuck lately...',
                  'Help me understand my patterns',
                  'I had an interesting dream last night',
                  'What practice would help me right now?',
                ].map((starter) => (
                  <button
                    key={starter}
                    onClick={() => setInput(starter)}
                    className="text-left px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' && !message.content && isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : message.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => (
                              <code className="bg-zinc-700 px-1 py-0.5 rounded text-sm">{children}</code>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-purple-500 pl-3 italic text-gray-400">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Suggested follow-ups */}
              {suggestions.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-1.5 text-xs bg-zinc-800/50 border border-zinc-700 rounded-full text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Error */}
      {error && (
        <div className="fixed bottom-24 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-8 pb-4 md:pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none px-3 py-2 focus:outline-none text-sm max-h-[200px]"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-gray-600 text-xs mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
