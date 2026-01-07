'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ChatPosition = 'center' | 'right';

export default function BottomChatBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<ChatPosition>('center');
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hide on specific pages
  const hideBar = pathname?.startsWith('/onboarding') ||
                  pathname?.startsWith('/login') ||
                  pathname?.startsWith('/signup') ||
                  pathname?.startsWith('/chat');

  // Auto-scroll when messages change
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-menu') && !target.closest('.settings-button')) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent(pathname || '/'));
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          quickMode: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setIsExpanded(false);
  };

  const togglePosition = () => {
    setPosition(position === 'center' ? 'right' : 'center');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
    }
  };

  if (hideBar) return null;

  // Position classes
  const positionClasses = position === 'center'
    ? 'left-1/2 -translate-x-1/2 max-w-2xl w-full mx-4'
    : 'right-20 w-96';

  return (
    <div
      className={`fixed bottom-6 z-40 transition-all duration-500 ease-out ${positionClasses}`}
    >
      {/* Expanded chat window - more transparent, flexible height */}
      <div
        className={`
          overflow-hidden rounded-2xl bg-zinc-950/60 backdrop-blur-md border border-zinc-700/30
          shadow-xl
          transition-all duration-500 ease-out origin-bottom
          ${isExpanded && messages.length > 0
            ? 'opacity-100 scale-100 mb-3'
            : 'max-h-0 opacity-0 scale-95 mb-0'
          }
        `}
      >
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/30 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500/80 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Chat</span>
            <span className="text-xs text-gray-500">{messages.length} messages</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Move to corner button */}
            <button
              onClick={togglePosition}
              className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800/30 transition-all"
              title={position === 'center' ? 'Move to corner' : 'Move to center'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {position === 'center' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                )}
              </svg>
            </button>
            {/* Full chat */}
            <button
              onClick={() => router.push('/chat')}
              className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800/30 transition-all"
              title="Open full chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            {/* Minimize */}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800/30 transition-all"
              title="Minimize"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Close */}
            <button
              onClick={clearChat}
              className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-zinc-800/30 transition-all"
              title="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages - flexible height based on content */}
        <div className="min-h-[100px] max-h-[60vh] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-zinc-700/60 text-white'
                    : 'bg-zinc-800/40 text-gray-200 border border-zinc-700/30'
                }`}
              >
                {msg.role === 'assistant' && !msg.content && isLoading ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-p:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar - floating pill design */}
      <div className="relative">
        <div className={`
          bg-zinc-900/70 backdrop-blur-md border border-zinc-700/40
          shadow-xl
          transition-all duration-300
          ${isExpanded ? 'rounded-2xl' : 'rounded-full'}
        `}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2">
            {/* AI Avatar - subtle, clickable to expand when minimized */}
            <button
              type="button"
              onClick={() => messages.length > 0 && setIsExpanded(!isExpanded)}
              className={`w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center flex-shrink-0 transition-all ${
                messages.length > 0 ? 'hover:bg-zinc-700/80 cursor-pointer' : 'cursor-default'
              }`}
              title={messages.length > 0 ? (isExpanded ? 'Minimize chat' : 'Show chat') : undefined}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {/* Indicator when minimized with messages - subtle badge */}
              {!isExpanded && messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-700 rounded-full border border-zinc-800 flex items-center justify-center text-[10px] text-gray-400">
                  {messages.length}
                </span>
              )}
            </button>

            {/* Input area */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={session ? "Ask anything..." : "Sign in to chat"}
                className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none resize-none py-2 px-2"
                rows={1}
                disabled={isLoading || status === 'loading'}
                style={{ maxHeight: '120px' }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Attach file */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handleFileClick}
                className="p-2 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800/50 transition-all"
                title="Attach file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Settings */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="settings-button p-2 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800/50 transition-all"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>

                {/* Settings dropdown */}
                {showSettings && (
                  <div className="settings-menu absolute bottom-full right-0 mb-2 w-48 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/40 rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <button
                      onClick={() => {
                        togglePosition();
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      {position === 'center' ? 'Move to corner' : 'Center chat'}
                    </button>
                    <button
                      onClick={() => {
                        router.push('/chat');
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open full chat
                    </button>
                    {messages.length > 0 && (
                      <>
                        <button
                          onClick={() => {
                            setIsExpanded(!isExpanded);
                            setShowSettings(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isExpanded ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            )}
                          </svg>
                          {isExpanded ? 'Minimize' : 'Show chat'}
                        </button>
                        <button
                          onClick={() => {
                            clearChat();
                            setShowSettings(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800/50 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear chat
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Send button - subtle */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !session}
                className={`
                  p-2 rounded-full transition-all duration-300
                  ${input.trim() && session
                    ? 'text-gray-300 hover:text-white hover:bg-zinc-800/50'
                    : 'text-gray-600 cursor-not-allowed'
                  }
                `}
                aria-label="Send"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Keyboard hint */}
        {!isExpanded && !messages.length && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-600 transition-opacity duration-300">
            Press Enter to send
          </div>
        )}
      </div>
    </div>
  );
}
