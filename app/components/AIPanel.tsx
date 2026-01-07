'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
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
  lastMessage: string;
  date: Date;
}

// Sample recent conversations
const RECENT_CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'Understanding my patterns', lastMessage: 'Your tendency to...', date: new Date() },
  { id: '2', title: 'Morning routine help', lastMessage: 'Based on your goals...', date: new Date(Date.now() - 86400000) },
];

const AI_SECTIONS = [
  {
    title: 'Quick Actions',
    items: [
      {
        label: 'New Chat',
        action: 'new-chat',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        label: 'Full Chat',
        href: '/chat',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      {
        label: 'Insights',
        href: '/profile/ai-insights',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
      },
      {
        label: 'Patterns',
        href: '/profile/patterns',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        label: 'Suggestions',
        href: '/profile/suggestions',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
    ],
  },
];

export default function AIPanel() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Panel state
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);

  const isExpanded = !isCollapsed || isHovering;

  // Close on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Hide on specific pages
  const hideSidebar = pathname?.startsWith('/onboarding') ||
                      pathname?.startsWith('/login') ||
                      pathname?.startsWith('/signup') ||
                      pathname?.startsWith('/chat');

  const handleAction = (action: string) => {
    if (action === 'new-chat') {
      setMessages([]);
      setShowChat(true);
    }
  };

  if (hideSidebar) return null;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 lg:hidden p-3 bg-amber-600 hover:bg-amber-500 rounded-full shadow-lg transition-colors"
        aria-label="Open AI panel"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`fixed top-0 right-0 z-50 h-full bg-zinc-950 border-l border-zinc-800 transition-all duration-300 flex flex-col ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${isExpanded ? 'w-64' : 'w-16'}`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {isExpanded && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-medium text-white text-sm">AI Guide</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 text-gray-400 hover:text-white transition-colors"
              aria-label={isCollapsed ? 'Pin sidebar open' : 'Unpin sidebar'}
              title={isCollapsed ? 'Pin sidebar open' : 'Unpin sidebar'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${!isCollapsed ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 overflow-y-auto flex-1 sidebar-scroll">
          {AI_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              {isExpanded && (
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 px-3 mb-2">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  if (item.href) {
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title={!isExpanded ? item.label : undefined}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          {isExpanded && (
                            <span className="flex-1 whitespace-nowrap">{item.label}</span>
                          )}
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={item.label}>
                      <button
                        onClick={() => item.action && handleAction(item.action)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title={!isExpanded ? item.label : undefined}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {isExpanded && (
                          <span className="flex-1 whitespace-nowrap text-left">{item.label}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Recent Conversations */}
          {isExpanded && (
            <div className="mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 px-3 mb-2">
                Recent Chats
              </h3>
              <ul className="space-y-1">
                {RECENT_CONVERSATIONS.map((conv) => (
                  <li key={conv.id}>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <div className="text-sm truncate">{conv.title}</div>
                      <div className="text-xs text-gray-600 truncate">{conv.lastMessage}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Status indicator at bottom */}
        {isExpanded && session && (
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>AI ready</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
